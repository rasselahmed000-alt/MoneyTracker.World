import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * P1 HIGH: Payment gateway reconciliation
 * - Verifies payment gateway callbacks match our records
 * - Prevents double-crediting or orphan transactions
 * - Admin-only, server-authoritative
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const {
      tx_id,
      gateway_reference,
      gateway_status,
      amount,
      timestamp
    } = await req.json();

    if (!tx_id || !gateway_reference) {
      return Response.json({ error: 'Missing tx_id or gateway_reference' }, { status: 400 });
    }

    // Find transaction
    const txs = await base44.asServiceRole.entities.Transaction.filter({
      tx_id
    }, null, 1);

    if (!txs || txs.length === 0) {
      return Response.json({
        error: 'Transaction not found',
        action_needed: 'Create transaction first'
      }, { status: 404 });
    }

    const transaction = txs[0];

    // P1: Verify amount matches
    if (Math.abs(Number(amount) - (transaction.amount || 0)) > 0.01) {
      return Response.json({
        error: 'Amount mismatch',
        our_amount: transaction.amount,
        gateway_amount: amount,
        action_needed: 'Manual review required'
      }, { status: 400 });
    }

    // Update with gateway reference
    await base44.asServiceRole.entities.Transaction.update(transaction.id, {
      gateway_reference,
      gateway_status,
      gateway_verified_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      action: 'reconciled',
      tx_id,
      gateway_reference
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});