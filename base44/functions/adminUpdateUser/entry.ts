import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generic admin update for user fields that RLS blocks (kyc_status, currency, account_status, etc.)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { target_user_id, data } = await req.json();
    if (!target_user_id || !data) {
      return Response.json({ error: 'target_user_id and data required' }, { status: 400 });
    }

    // Handle permanent delete
    if (data._delete === true) {
      await base44.asServiceRole.entities.User.delete(target_user_id);
      return Response.json({ success: true, action: 'deleted' });
    }

    // Whitelist allowed fields to prevent abuse
    const ALLOWED_FIELDS = [
      'kyc_status', 'currency', 'account_status', 'role',
      'min_balance', 'is_blocked', 'pin', 'pin_failed_attempts', 'pin_locked_until',
      'balance', 'display_name', 'mobile', 'country', 'address', 'occupation',
      'kyc_nid_front', 'kyc_nid_back', 'kyc_face_photo',
      'kyc_submitted_at', 'kyc_verified_date', 'kyc_rejection_reason', 'kyc_reject_reason',
      'kyc_doc_type', 'agent_code', 'agent_name',
    ];

    const safeData = {};
    for (const key of Object.keys(data)) {
      if (ALLOWED_FIELDS.includes(key)) {
        safeData[key] = data[key];
      }
    }

    if (Object.keys(safeData).length === 0) {
      return Response.json({ error: 'No allowed fields to update' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(target_user_id, safeData);
    return Response.json({ success: true, updated: Object.keys(safeData) });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});