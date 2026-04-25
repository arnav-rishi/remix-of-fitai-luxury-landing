import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Copy, Check, LogOut, Loader2, Plus, RefreshCw, ChevronDown, Mail, Save,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  api_key: string;
  allowed_domains: string[];
  widget_theme: any;
  is_active: boolean;
  created_at: string;
}

interface BrandStats {
  count: number;
  lastActive: string | null;
}

type CdnStatus = "checking" | "online" | "offline";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "vcjshbykllrhuodzaguf";
const WIDGET_URL = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/widget/widget.js`;

export default function Admin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<Record<string, BrandStats>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [creating, setCreating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cdnStatus, setCdnStatus] = useState<CdnStatus>("checking");
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>({});
  const [savingDomainsId, setSavingDomainsId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/brand-auth"); return; }

      // Check admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const admin = roles?.some((r: any) => r.role === "admin");
      if (!admin) {
        navigate("/");
        return;
      }
      setIsAdmin(true);

      // Fetch all brands
      const { data } = await supabase.from("brands").select("*").order("created_at", { ascending: false });
      const brandList = (data as unknown as Brand[]) || [];
      setBrands(brandList);

      // Fetch try-on stats per brand
      const { data: logs } = await supabase
        .from("tryon_logs")
        .select("brand_id, created_at");
      const statsMap: Record<string, BrandStats> = {};
      (logs || []).forEach((log: any) => {
        const cur = statsMap[log.brand_id] || { count: 0, lastActive: null };
        cur.count += 1;
        if (!cur.lastActive || new Date(log.created_at) > new Date(cur.lastActive)) {
          cur.lastActive = log.created_at;
        }
        statsMap[log.brand_id] = cur;
      });
      setStats(statsMap);
      setLoading(false);
    };
    load();
  }, [navigate]);

  // CDN health check (HEAD ping every 60s)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(WIDGET_URL, { method: "HEAD", cache: "no-store" });
        setCdnStatus(res.ok ? "online" : "offline");
      } catch {
        setCdnStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.from("brands").insert({
        name: newBrandName.trim(),
        user_id: session.user.id,
      }).select().single();

      if (error) throw error;
      setBrands([data as unknown as Brand, ...brands]);
      setNewBrandName("");
    } catch (err: any) {
      alert("Failed to create brand: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerateKey = async (brandId: string) => {
    if (!window.confirm("Regenerate API key? The old key will stop working immediately.")) return;
    setRegeneratingId(brandId);
    try {
      const res = await supabase.functions.invoke("brand-api-key", {
        body: { brand_id: brandId },
      });
      if (res.error) throw res.error;
      const newKey = res.data?.api_key;
      if (newKey) {
        setBrands(brands.map(b => b.id === brandId ? { ...b, api_key: newKey } : b));
      }
    } catch {
      alert("Failed to regenerate key");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    const { error } = await supabase
      .from("brands")
      .update({ is_active: !brand.is_active } as any)
      .eq("id", brand.id);
    if (!error) {
      setBrands(brands.map(b => b.id === brand.id ? { ...b, is_active: !b.is_active } : b));
    }
  };

  const handleSaveDomains = async (brand: Brand) => {
    setSavingDomainsId(brand.id);
    const raw = domainDrafts[brand.id] ?? brand.allowed_domains.join(", ");
    const domains = raw
      .split(/[\s,]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean);
    const { error } = await supabase
      .from("brands")
      .update({ allowed_domains: domains } as any)
      .eq("id", brand.id);
    if (!error) {
      setBrands(brands.map((b) => (b.id === brand.id ? { ...b, allowed_domains: domains } : b)));
      setDomainDrafts((d) => ({ ...d, [brand.id]: domains.join(", ") }));
    } else {
      alert("Failed to save domains: " + error.message);
    }
    setSavingDomainsId(null);
  };

  const buildOnboardingEmail = (brand: Brand) => {
    return `Hi team,

You're all set to enable virtual try-on on your store. It's a 2-step setup — no SDK, no npm install, just HTML.

────────────────────────────
STEP 1 — Add this script tag once to your global template
(theme.liquid, footer include, _document.tsx, etc.)
────────────────────────────

<script
  src="${WIDGET_URL}"
  data-brand-id="${brand.api_key}"
  async></script>

────────────────────────────
STEP 2 — Tag any product image you want try-on enabled
────────────────────────────

<img src="/products/shirt.jpg"
     data-fitai-garment
     data-fitai-category="tops" />

Categories: tops | bottoms | one-pieces | auto

That's it. The widget will:
  • Auto-discover every tagged image on every page
  • Inject a "Try On" button next to each
  • Handle the photo capture + AI generation

The script is CSS-isolated (Shadow DOM) so it won't conflict with your theme.

Questions? Reply to this email.

— FitAI`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="font-display text-lg font-semibold">
            Fit<span className="text-terracotta">AI</span> Admin
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5 font-body text-xs text-muted-foreground"
              title={`Widget CDN: ${cdnStatus}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cdnStatus === "online"
                    ? "bg-green-500"
                    : cdnStatus === "offline"
                    ? "bg-destructive"
                    : "bg-muted-foreground animate-pulse"
                }`}
              />
              CDN {cdnStatus === "checking" ? "…" : cdnStatus}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <p className="font-body text-xs tracking-widest text-primary uppercase mb-2">Admin Panel</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Brand Management</h1>
        </div>

        {/* Create New Brand */}
        <section className="bg-card border border-border p-5 md:p-6 mb-8" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Onboard New Brand
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="flex-1 bg-secondary border border-border px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ borderRadius: "2px" }}
              placeholder="Brand name (e.g. Bewakoof, Snitch)"
              onKeyDown={(e) => e.key === "Enter" && handleCreateBrand()}
            />
            <button
              onClick={handleCreateBrand}
              disabled={creating || !newBrandName.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ borderRadius: "2px" }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
          </div>
        </section>

        {/* Brand List */}
        <section>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-4">
            All Brands ({brands.length})
          </h2>

          {brands.length === 0 ? (
            <div className="bg-card border border-border p-8 text-center" style={{ borderRadius: "4px" }}>
              <p className="font-body text-sm text-muted-foreground">No brands onboarded yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`bg-card border ${brand.is_active ? "border-border" : "border-destructive/30 opacity-70"} transition-all`}
                  style={{ borderRadius: "4px" }}
                >
                  {/* Header Row */}
                  <div
                    className="flex items-center justify-between p-4 md:p-5 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === brand.id ? null : brand.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${brand.is_active ? "bg-green-500" : "bg-destructive"}`}
                        title={brand.is_active ? "Active" : "Inactive"}
                      />
                      <div>
                        <h3 className="font-body text-sm font-medium text-foreground">{brand.name}</h3>
                        <p className="font-body text-xs text-muted-foreground">
                          Created {new Date(brand.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right hidden sm:block">
                        <p className="font-display text-base font-semibold text-foreground leading-none">
                          {stats[brand.id]?.count ?? 0}
                        </p>
                        <p className="font-body text-[10px] tracking-widest text-muted-foreground uppercase mt-1">
                          try-ons
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="font-body text-xs text-foreground leading-none">
                          {stats[brand.id]?.lastActive
                            ? new Date(stats[brand.id].lastActive!).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            : "—"}
                        </p>
                        <p className="font-body text-[10px] tracking-widest text-muted-foreground uppercase mt-1">
                          last active
                        </p>
                      </div>
                      {expandedId === brand.id ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} className="transition-transform" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === brand.id && (
                    <div className="border-t border-border p-4 md:p-5 space-y-4">
                      {/* API Key */}
                      <div>
                        <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
                          API Key
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-secondary px-3 py-2 font-mono text-xs text-foreground overflow-x-auto" style={{ borderRadius: "2px" }}>
                            {brand.api_key}
                          </code>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(brand.api_key, brand.id); }}
                            className="p-2 border border-border hover:border-foreground/40 transition-colors"
                            style={{ borderRadius: "2px" }}
                            title="Copy"
                          >
                            {copied === brand.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRegenerateKey(brand.id); }}
                            disabled={regeneratingId === brand.id}
                            className="p-2 border border-border hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            style={{ borderRadius: "2px" }}
                            title="Regenerate"
                          >
                            <RefreshCw size={14} className={regeneratingId === brand.id ? "animate-spin" : ""} />
                          </button>
                        </div>
                      </div>

                      {/* Embed Code Snippet */}
                      <div>
                        <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
                          Embed Code (send to client)
                        </label>
                        <div className="relative">
                          <pre className="bg-secondary p-3 font-mono text-[11px] text-foreground overflow-x-auto" style={{ borderRadius: "2px" }}>
{`<!-- Add this script once, before </body> on every page (or in your global template) -->
<script
  src="${WIDGET_URL}"
  data-brand-id="${brand.api_key}"
  async></script>

<!-- Then tag any product image with data-fitai-garment -->
<!-- Example: <img src="product.jpg" data-fitai-garment data-fitai-category="tops" /> -->
<!-- The widget auto-discovers all tagged images on the page -->`}
                          </pre>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                `<script\n  src="${WIDGET_URL}"\n  data-brand-id="${brand.api_key}"\n  async></script>`,
                                brand.id + "-embed"
                              );
                            }}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-card/80 border border-border hover:border-foreground/40 transition-colors"
                            style={{ borderRadius: "2px" }}
                          >
                            {copied === brand.id + "-embed" ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Allowed Domains */}
                      <div>
                        <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
                          Allowed Domains
                        </label>
                        <p className="font-body text-[11px] text-muted-foreground mb-2">
                          Comma-separated list. Subdomains auto-included. Leave empty during onboarding (key works anywhere) — fill in once the brand is live to lock the key to their domains.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={domainDrafts[brand.id] ?? brand.allowed_domains.join(", ")}
                            onChange={(e) =>
                              setDomainDrafts({ ...domainDrafts, [brand.id]: e.target.value })
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder="brand.com, shop.brand.com"
                            className="flex-1 bg-secondary border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            style={{ borderRadius: "2px" }}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveDomains(brand); }}
                            disabled={savingDomainsId === brand.id}
                            className="p-2 border border-border hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            style={{ borderRadius: "2px" }}
                            title="Save domains"
                          >
                            {savingDomainsId === brand.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(buildOnboardingEmail(brand), brand.id + "-email");
                          }}
                          className="px-4 py-2 font-body text-xs border border-border hover:border-primary/60 text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          style={{ borderRadius: "2px" }}
                        >
                          {copied === brand.id + "-email" ? (
                            <><Check size={12} className="text-green-400" /> Email copied</>
                          ) : (
                            <><Mail size={12} /> Copy onboarding email</>
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(brand); }}
                          className={`px-4 py-2 font-body text-xs border transition-colors ${
                            brand.is_active
                              ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                              : "border-primary/40 text-primary hover:bg-primary/10"
                          }`}
                          style={{ borderRadius: "2px" }}
                        >
                          {brand.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
