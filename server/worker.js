import { db } from './db.js';

export function startWorker() {
  console.log('Background Worker Started (Runs checks every 1 minute)');

  // Run lifecycle checks immediately on startup, then every minute
  runLifecycleChecks();
  setInterval(runLifecycleChecks, 60000); // 1 minute
}

async function runLifecycleChecks() {
  const now = new Date();

  try {
    // 1. Process Expired Claims (deadline exceeded for approved claims awaiting collection)
    const activeClaims = await db.claims.getAll({ status: 'approved' });
    let expiredCount = 0;

    for (const claim of activeClaims) {
      if (claim.claimed_date) continue; // Skip collected claims
      const deadline = new Date(claim.expected_collection_deadline);
      if (deadline < now) {
        // Claim expired! Update claim status
        await db.claims.update(claim.id, {
          approval_status: 'expired',
          remarks: `System: Claim expired automatically because student did not visit within 2 working days of approval (Deadline: ${deadline.toLocaleString()}).`
        });

        // Revert item status to 'Waiting for Owner'
        await db.items.setStatus(claim.item_id, 'Waiting for Owner');

        // Write audit log
        await db.logs.create({
          performed_by: null, // System Action
          action: 'EXPIRE_CLAIM',
          affected_record_table: 'claims',
          affected_record_id: claim.id,
          details: { item_id: claim.item_id, claimant: claim.claimant_roll_number }
        });

        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[Worker] Expired ${expiredCount} claim requests`);
    }

    // 2. Process Auto-Archiving (claimed more than 7 days ago)
    const approvedClaims = await db.claims.getAll({ status: 'approved' });
    let archivedCount = 0;

    for (const claim of approvedClaims) {
      if (!claim.claimed_date) continue;
      const claimedDate = new Date(claim.claimed_date);
      
      // Calculate difference in days
      const diffTime = Math.abs(now - claimedDate);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 7) {
        // Fetch item to verify it is still Claimed & Collected (not archived yet)
        const item = await db.items.findById(claim.item_id);
        if (item && item.status === 'Claimed & Collected') {
          // Update status to Archived
          await db.items.setStatus(item.id, 'Archived');

          // Write audit log
          await db.logs.create({
            performed_by: null, // System Action
            action: 'ARCHIVE_ITEM',
            affected_record_table: 'lost_items',
            affected_record_id: item.id,
            details: { item_name: item.item_name, claimant: claim.claimant_roll_number }
          });

          archivedCount++;
        }
      }
    }

    if (archivedCount > 0) {
      console.log(`[Worker] Archived ${archivedCount} claimed items`);
    }

  } catch (error) {
    console.error('[Worker Error] Lifecycle routine failed:', error);
  }
}
