

# Embeddable Try-On Widget — Auto-Garment Feed Plan

## How It Works

The brand adds a single script tag to their product pages. The widget automatically finds the product image on the page and uses it as the garment input — zero manual upload per product.

```text
Brand's Product Page
┌─────────────────────────────────────┐
│  <img class="product-img" src="…">  │ ◄── widget reads this automatically
│                                     │
│  <script                            │
│    src="https://cdn.fitai.in/w.js"  │
│    data-brand-id="abc"              │
│    data-garment-selector=".product-img"  ◄── CSS selector pointing to garment
│  ></script>                         │
└─────────────────────────────────────┘
```

## Three Ways to Feed the Garment Image

| Method | How | Best For |
|--------|-----|----------|
| **CSS Selector** | `data-garment-selector=".product-img"` — widget grabs the `src` from that element | Most e-commerce sites |
| **Direct URL** | `data-garment-url="https://cdn.brand.com/shirt.jpg"` — explicit image URL | Headless/custom stores |
| **Product ID lookup** | `data-product-id="SKU-001"` — widget calls your API to get the registered garment URL | Brands who want full control |

The selector method is the simplest — brands just tell the widget where their product image lives on the page, and it handles the rest. No per-product setup needed.

## Implementation Plan

### Step 1: Database Tables
- `brands` table — id, name, api_key (auto-generated), allowed_domains, widget_theme (JSON), created_at
- `tryon_logs` table — id, brand_id, garment_url, created_at (analytics/billing)
- RLS policies for brand-level access

### Step 2: Edge Functions
- **`brand-config`** — validates brand API key + origin domain, returns theme config
- **Update `fashn-run`** — accept garment image as a URL (not just base64), fetch and convert server-side; authenticate via brand API key; log usage to `tryon_logs`

### Step 3: Build the Widget (`/widget` directory)
Separate Vite library-mode build producing a single `widget.js` file (IIFE bundle).

**On load:**
1. Read `data-brand-id` and garment source (`data-garment-selector` or `data-garment-url`) from the script tag
2. Call `brand-config` to validate + get theme
3. Find garment image via CSS selector or use direct URL
4. Inject a "Try On" button near the product image

**On click:**
1. Open a Shadow DOM modal (CSS-isolated from host site)
2. User uploads their photo (drag-drop or camera)
3. Widget sends photo + garment URL to `fashn-run`
4. Polls `fashn-status`, shows result overlay

### Step 4: Brand Dashboard (in marketing site)
- Brand signup/login (authenticated routes)
- Dashboard showing API key, embed code generator, usage stats
- Domain whitelist + widget theme customization (colors, button text)

### Step 5: CDN Delivery
- Build pipeline outputs `widget.js` to a public storage bucket
- Brands reference it via a stable URL

## Technical Notes
- **CORS on garment images**: The widget fetches the garment image URL and sends it to your edge function — the edge function downloads the image server-side, so no CORS issues on the brand's CDN
- **Shadow DOM**: All widget UI is encapsulated, zero CSS conflicts with the host site
- **No auth for shoppers**: Only the brand API key authenticates requests; end shoppers don't need accounts
- **Fallback**: If selector doesn't find an image, widget shows an error state with guidance for the brand

## Suggested Build Order

| # | Task | Size |
|---|------|------|
| 1 | Create `brands` + `tryon_logs` tables | Small |
| 2 | Build `brand-config` edge function | Small |
| 3 | Update `fashn-run` to accept URL + brand key auth | Small |
| 4 | Build widget.js (selector-based garment feed + try-on UI) | Large |
| 5 | Brand dashboard with auth + embed code generator | Medium |

