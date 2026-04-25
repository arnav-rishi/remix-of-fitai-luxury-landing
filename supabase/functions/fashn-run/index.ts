import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brand-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function originHost(origin: string): string {
  try { return new URL(origin).hostname } catch { return '' }
}

function isDomainAllowed(originHostname: string, allowed: string[]): boolean {
  if (!originHostname) return false
  return allowed.some((d) => {
    const clean = d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!clean) return false
    return originHostname === clean || originHostname.endsWith('.' + clean)
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY')
    if (!FASHN_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { model_image, garment_image, garment_url, category = 'auto', brand_api_key } = await req.json()

    // Resolve garment image: either direct base64 or fetch from URL
    let resolvedGarment = garment_image
    if (!resolvedGarment && garment_url) {
      try {
        const imgRes = await fetch(garment_url)
        if (!imgRes.ok) throw new Error(`Failed to fetch garment: ${imgRes.status}`)
        const blob = await imgRes.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        const mimeType = blob.type || 'image/jpeg'
        resolvedGarment = `data:${mimeType};base64,${base64}`
      } catch (e) {
        return new Response(JSON.stringify({ error: `Failed to fetch garment image: ${e}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!model_image || !resolvedGarment) {
      return new Response(JSON.stringify({ error: 'Missing model_image and garment_image/garment_url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If brand_api_key provided, validate, enforce domain, and prepare for usage logging
    let brandId: string | null = null
    if (brand_api_key) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { data: brand } = await supabase
        .from('brands')
        .select('id, is_active, allowed_domains')
        .eq('api_key', brand_api_key)
        .eq('is_active', true)
        .maybeSingle()

      if (!brand) {
        return new Response(JSON.stringify({ error: 'Invalid or inactive brand API key' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Enforce origin against allowed_domains (mirrors brand-config behavior)
      const origin = req.headers.get('origin') || ''
      const allowed = (brand.allowed_domains || []) as string[]
      if (allowed.length > 0) {
        const host = originHost(origin)
        if (!isDomainAllowed(host, allowed)) {
          return new Response(JSON.stringify({
            error: `Domain not allowed. Origin "${host || 'unknown'}" is not in this brand's whitelist.`,
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      brandId = brand.id
    }

    const runRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FASHN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image,
          garment_image: resolvedGarment,
          category,
          mode: 'balanced',
        },
      }),
    })

    const runText = await runRes.text()
    console.log('fashn.ai /run response:', runRes.status, runText)

    if (!runRes.ok) {
      return new Response(JSON.stringify({ error: `fashn.ai error: ${runText}` }), {
        status: runRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let runData: { id?: string }
    try {
      runData = JSON.parse(runText)
    } catch {
      return new Response(JSON.stringify({ error: `Invalid JSON from fashn.ai: ${runText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!runData.id) {
      return new Response(JSON.stringify({ error: 'No job ID returned from fashn.ai' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log usage if brand request
    let logId: string | null = null
    if (brandId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { data: log } = await supabase.from('tryon_logs').insert({
        brand_id: brandId,
        garment_url: garment_url || null,
        status: 'started',
      }).select('id').single()
      logId = log?.id ?? null
    }

    return new Response(JSON.stringify({ id: runData.id, log_id: logId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
