import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

// Helper to add days (ignoring weekends if we want strict working days, but standard 48 hours is robust for demonstration)
function getCollectionDeadline(days = 2) {
  const date = new Date();
  let addedDays = 0;
  while (addedDays < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      addedDays++;
    }
  }
  return date.toISOString();
}

// 1. GET /api/claims - Retrieve Claims
router.get('/', authenticateToken, async (req, res) => {
  const { status = '', roll_number = '' } = req.query;

  try {
    let claims = [];
    if (req.user.role === 'student') {
      // Students can only view their own claims
      claims = await db.claims.getAll({ rollNumber: req.user.roll_number, status });
    } else {
      // Admins see everything
      claims = await db.claims.getAll({ rollNumber: roll_number, status });
    }
    res.json(claims);
  } catch (error) {
    console.error('Fetch claims error:', error);
    res.status(500).json({ error: 'Server error retrieving claims queue' });
  }
});

// 2. GET /api/claims/:id - Retrieve Claim Details
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const claim = await db.claims.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim request not found' });

    // Students can only read their own claim
    if (req.user.role === 'student' && claim.claimant_roll_number !== req.user.roll_number) {
      return res.status(403).json({ error: 'Access denied: unauthorized claim view' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Fetch claim details error:', error);
    res.status(500).json({ error: 'Server error querying claim details' });
  }
});

// 3. POST /api/claims - Submit Claim (Student or Admin on student behalf)
router.post('/', authenticateToken, async (req, res) => {
  const { item_id, roll_number, remarks } = req.body;

  if (!item_id || !roll_number || !remarks) {
    return res.status(400).json({ error: 'Item ID, Roll Number, and verification answers are required' });
  }

  // Security: Students can only claim on their own roll number
  if (req.user.role === 'student' && req.user.roll_number !== roll_number) {
    return res.status(403).json({ error: 'Unauthorized: Cannot submit claim for a different Roll Number' });
  }

  try {
    // Check item status
    const item = await db.items.findById(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.status !== 'Waiting for Owner') {
      return res.status(400).json({ error: `Cannot claim this item: status is currently "${item.status}"` });
    }

    // Verify student exists
    const student = await db.students.findByRoll(roll_number);
    if (!student) return res.status(404).json({ error: 'Student Roll Number is invalid' });
    if (!student.active_status) {
      return res.status(403).json({ error: 'This student account has been disabled' });
    }

    // Create claim request
    const deadline = getCollectionDeadline(2); // 2 working days collection deadline
    const newClaim = await db.claims.create({
      item_id,
      claimant_roll_number: roll_number,
      approval_status: 'pending',
      expected_collection_deadline: deadline,
      remarks, // holds ownership answers
      receipt_code: null
    });

    // Update item status to 'Claim Requested'
    await db.items.setStatus(item_id, 'Claim Requested');

    // Create audit log
    await db.logs.create({
      performed_by: req.user.id,
      action: 'SUBMIT_CLAIM',
      affected_record_table: 'claims',
      affected_record_id: newClaim.id || 'new',
      details: { roll_number, item_id, item_name: item.item_name }
    });

    res.status(201).json(newClaim);

  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ error: 'Server error processing claim submission' });
  }
});

// 4. PUT /api/claims/:id/approve - Approve Claim (Admins only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { verification_notes } = req.body;

  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }

  try {
    const claim = await db.claims.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.approval_status !== 'pending') {
      return res.status(400).json({ error: `Claim has already been processed: "${claim.approval_status}"` });
    }

    const receiptCode = 'REC-' + Math.floor(100000 + Math.random() * 900000);
    const deadline = getCollectionDeadline(2); // 2 working days collection deadline from approval time
    
    // Update claim
    const updatedClaim = await db.claims.update(id, {
      approval_status: 'approved',
      approved_by: req.user.id,
      claimed_date: null, // Keep null until physically collected
      expected_collection_deadline: deadline,
      verification_notes: verification_notes || 'Manually verified by safety admin.',
      receipt_code: receiptCode
    });

    // Update item status to 'Claim Requested' (maps to 'Claim Approved' in UI since claim is approved but claimed_date is null)
    await db.items.setStatus(claim.item_id, 'Claim Requested');

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'APPROVE_CLAIM',
      affected_record_table: 'claims',
      affected_record_id: id,
      details: { item_id: claim.item_id, claimant: claim.claimant_roll_number, receiptCode }
    });

    res.json(updatedClaim);

  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({ error: 'Server error approving claim' });
  }
});

// 5. PUT /api/claims/:id/reject - Reject Claim (Admins only)
router.put('/:id/reject', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }

  try {
    const claim = await db.claims.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.approval_status !== 'pending') {
      return res.status(400).json({ error: `Claim has already been processed: "${claim.approval_status}"` });
    }

    // Update claim status to 'rejected'
    const updatedClaim = await db.claims.update(id, {
      approval_status: 'rejected',
      remarks: remarks || 'Rejected by administrator during verification.'
    });

    // Revert item status to 'Waiting for Owner'
    await db.items.setStatus(claim.item_id, 'Waiting for Owner');

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'REJECT_CLAIM',
      affected_record_table: 'claims',
      affected_record_id: id,
      details: { item_id: claim.item_id, claimant: claim.claimant_roll_number, reason: remarks }
    });

    res.json(updatedClaim);

  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({ error: 'Server error rejecting claim' });
  }
});

// 6. PUT /api/claims/:id/cancel - Cancel Claim (Admins OR Claimant Student)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const claim = await db.claims.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const isClaimant = req.user.role === 'student' && req.user.roll_number === claim.claimant_roll_number;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isClaimant && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (claim.approval_status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel a non-pending claim request' });
    }

    // Cancel claim
    const updatedClaim = await db.claims.update(id, {
      approval_status: 'rejected',
      remarks: 'Cancelled by claimant or administrator.'
    });

    // Revert item status to 'Waiting for Owner'
    await db.items.setStatus(claim.item_id, 'Waiting for Owner');

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'CANCEL_CLAIM',
      affected_record_table: 'claims',
      affected_record_id: id,
      details: { item_id: claim.item_id, claimant: claim.claimant_roll_number }
    });

    res.json(updatedClaim);

  } catch (error) {
    console.error('Cancel claim error:', error);
    res.status(500).json({ error: 'Server error cancelling claim' });
  }
});

// 7. PUT /api/claims/:id/collect - Mark Claim as Collected (Admins only)
router.put('/:id/collect', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }

  try {
    const claim = await db.claims.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    if (claim.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Cannot collect an unapproved claim' });
    }

    if (claim.claimed_date) {
      return res.status(400).json({ error: 'Claim has already been collected' });
    }

    // Update claim: set claimed_date to current time
    const updatedClaim = await db.claims.update(id, {
      claimed_date: new Date().toISOString()
    });

    // Update item status to 'Claimed & Collected'
    await db.items.setStatus(claim.item_id, 'Claimed & Collected');

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'COLLECT_CLAIM',
      affected_record_table: 'claims',
      affected_record_id: id,
      details: { item_id: claim.item_id, claimant: claim.claimant_roll_number }
    });

    res.json(updatedClaim);

  } catch (error) {
    console.error('Collect claim error:', error);
    res.status(500).json({ error: 'Server error marking claim as collected' });
  }
});

export default router;
