import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY');
    if (!FASHN_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id, log_id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing job id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const statusRes = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: { Authorization: `Bearer ${FASHN_API_KEY}` },
    });

    const statusText = await statusRes.text();
    console.log(`fashn.ai /status/${id}:`, statusRes.status, statusText);

    if (!statusRes.ok) {
      // Mark log as failed if we have it
      if (log_id) await markLog(log_id, 'failed');
      return new Response(JSON.stringify({ error: `fashn.ai status error: ${statusText}` }), {
        status: statusRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let statusData: { status?: string; output?: string[]; error?: unknown };
    try {
      statusData = JSON.parse(statusText);
    } catch {
      if (log_id) await markLog(log_id, 'failed');
      return new Response(JSON.stringify({ error: `Invalid JSON from fashn.ai: ${statusText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update tryon_logs on terminal states
    if (log_id && statusData.status) {
      const s = statusData.status.toLowerCase();
      if (s === 'completed' || s === 'success' || s === 'succeeded') {
        await markLog(log_id, 'completed');
      } else if (s === 'failed' || s === 'error' || s === 'canceled' || s === 'cancelled') {
        await markLog(log_id, 'failed');
      }
    }

    return new Response(JSON.stringify(statusData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function markLog(logId: string, status: 'completed' | 'failed') {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // Only transition from 'started' to a terminal state — avoid duplicate writes
    await supabase
      .from('tryon_logs')
      .update({ status })
      .eq('id', logId)
      .eq('status', 'started');
  } catch (e) {
    console.error('Failed to update tryon log status:', e);
  }
}
