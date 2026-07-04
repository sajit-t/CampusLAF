import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// 1. GET /api/audit-logs (Super Admin only)
router.get('/audit-logs', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const logs = await db.logs.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Fetch logs error:', error);
    res.status(500).json({ error: 'Server error retrieving system audit logs' });
  }
});

// 2. GET /api/analytics (Admin & Super Admin only)
router.get('/analytics', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // 1. Retrieve all items, claims, students
    const items = await db.items.getAll({ limit: 10000 });
    const claims = await db.claims.getAll();
    const studentsRes = await db.students.getAll({ limit: 10000 });

    const totalStudents = studentsRes.total;
    const waitingCount = items.filter(i => i.status === 'Waiting for Owner').length;
    const pendingClaimsCount = items.filter(i => i.status === 'Claim Requested').length;
    const claimedCount = items.filter(i => i.status === 'Claimed & Collected').length;
    const archivedCount = items.filter(i => i.status === 'Archived').length;

    // 2. Count expired claims
    // An expired claim is a claim record with status 'expired' (set by worker) or status 'rejected' with keyword 'expired'
    const expiredCount = claims.filter(c => c.approval_status === 'expired').length;

    // 3. Count today's collections
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollections = claims.filter(c => 
      c.approval_status === 'approved' && 
      c.claimed_date && 
      c.claimed_date.startsWith(todayStr)
    ).length;

    // 4. Group items by category
    const categoryMap = {};
    items.forEach(i => {
      categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    });
    const itemsByCategory = Object.keys(categoryMap).map(cat => ({
      category: cat,
      count: categoryMap[cat]
    }));

    // 5. Build recent activity feed
    // Sort items by creation date
    const recentItems = [...items].slice(0, 10).map(i => ({
      id: i.id,
      type: 'item',
      action: `New ${i.category.toLowerCase()} item registered: "${i.item_name}"`,
      location: i.found_location,
      time: i.created_at,
      status: i.status
    }));

    const recentClaims = [...claims].slice(0, 10).map(c => ({
      id: c.id,
      type: 'claim',
      action: `Claim request submitted for item ID "${c.item_id}" by student ${c.claimant_roll_number}`,
      location: `Deadline: ${new Date(c.expected_collection_deadline).toLocaleDateString()}`,
      time: c.claim_request_date,
      status: c.approval_status
    }));

    const activityFeed = [...recentItems, ...recentClaims]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    res.json({
      metrics: {
        totalStudents,
        waitingForOwner: waitingCount,
        claimRequested: pendingClaimsCount,
        claimedAndCollected: claimedCount,
        archived: archivedCount,
        expiredClaims: expiredCount,
        todayCollections
      },
      itemsByCategory,
      activityFeed
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Server error compiling dashboard analytics' });
  }
});

export default router;
