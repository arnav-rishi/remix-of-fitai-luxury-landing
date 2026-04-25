import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brand-api-key',
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
    const brandApiKey = req.headers.get('x-brand-api-key')
    if (!brandApiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-brand-api-key header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: brand, error } = await supabase
      .from('brands')
      .select('id, name, widget_theme, allowed_domains, is_active')
      .eq('api_key', brandApiKey)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !brand) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive brand API key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate origin against allowed_domains if any are set.
    // Empty array = "not configured yet" = allow all (onboarding mode).
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

    return new Response(JSON.stringify({
      brand_id: brand.id,
      name: brand.name,
      theme: brand.widget_theme,
    }), {
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
