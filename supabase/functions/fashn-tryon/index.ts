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

    const { model_image, garment_image, category = 'tops' } = await req.json();

    if (!model_image || !garment_image) {
      return new Response(JSON.stringify({ error: 'Missing model_image or garment_image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Start the try-on job
    const runRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FASHN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_image, garment_image, category }),
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      console.error('fashn.ai /run error:', errText);
      return new Response(JSON.stringify({ error: `fashn.ai error: ${errText}` }), {
        status: runRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id } = await runRes.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'No job ID returned from fashn.ai' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Poll for result (up to ~55s with 2s intervals)
    const maxAttempts = 27;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
        headers: { Authorization: `Bearer ${FASHN_API_KEY}` },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error('fashn.ai /status error:', errText);
        continue;
      }

      const statusData = await statusRes.json();
      console.log(`Poll attempt ${attempt + 1}: status = ${statusData.status}`);

      if (statusData.status === 'completed') {
        const outputUrl = statusData.output?.[0];
        if (!outputUrl) {
          return new Response(JSON.stringify({ error: 'No output URL in completed job' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ output_url: outputUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.status === 'failed') {
        return new Response(
          JSON.stringify({ error: `Job failed: ${statusData.error || 'Unknown error'}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // status is 'starting' or 'processing' — keep polling
    }

    return new Response(JSON.stringify({ error: 'Timed out waiting for try-on result' }), {
      status: 504,
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
