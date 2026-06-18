import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { agent_code } = await req.json();
    if (!agent_code) return Response.json({ valid: false, agent_name: '' });

    const agents = await base44.asServiceRole.entities.Agent.filter(
      { agent_code: agent_code.trim().toUpperCase(), status: 'active' },
      null, 1
    );

    if (!agents || agents.length === 0) {
      return Response.json({ valid: false, agent_name: '', message: 'Invalid or inactive agent code' });
    }

    const agent = agents[0];

    // Build response — only expose fields that admin has permitted
    const result = {
      valid: true,
      agent_name: agent.agent_name,
      agent_id: agent.agent_id || agent.id,
      agent_code: agent.agent_code,
      country: agent.country || '',
      mobile: agent.allow_agent_details ? (agent.mobile || '') : '',
      photo_url: agent.allow_agent_photo ? (agent.photo_url || '') : '',
      status: agent.allow_agent_status ? agent.status : 'active',
      verification_instruction: agent.allow_agent_verification ? (agent.verification_instruction || '') : '',
      support_info: agent.allow_support_notes ? (agent.support_info || '') : '',
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});