import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, LogOut, Loader2, RefreshCw } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  api_key: string;
  allowed_domains: string[];
  widget_theme: { primaryColor?: string; buttonText?: string; position?: string };
  is_active: boolean;
}

export default function Dashboard() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [domains, setDomains] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/brand-auth"); return; }

      // Check if user is admin — redirect to admin panel
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const isAdminUser = roles?.some((r: any) => r.role === "admin");
      if (isAdminUser) { navigate("/admin"); return; }

      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        navigate("/brand-auth");
        return;
      }

      setBrand(data as unknown as Brand);
      setDomains((data as any).allowed_domains?.join(", ") || "");
      setLoading(false);
    };
    load();
  }, [navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveDomains = async () => {
    if (!brand) return;
    setSaving(true);
    const domainList = domains.split(",").map(d => d.trim()).filter(Boolean);
    await supabase
      .from("brands")
      .update({ allowed_domains: domainList } as any)
      .eq("id", brand.id);
    setBrand({ ...brand, allowed_domains: domainList });
    setSaving(false);
  };

  const handleRegenerateKey = async () => {
    if (!brand) return;
    if (!window.confirm("Are you sure? This will invalidate your current API key. All existing widget integrations will stop working until updated.")) return;
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("brand-api-key", {
        body: { brand_id: brand.id },
      });
      if (res.error) throw res.error;
      const newKey = res.data?.api_key;
      if (newKey) setBrand({ ...brand, api_key: newKey });
    } catch (err) {
      alert("Failed to regenerate API key");
      console.error(err);
    } finally {
      setRegenerating(false);
    }
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

  if (!brand) return null;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "vcjshbykllrhuodzaguf";
  const widgetUrl = `https://${projectId}.supabase.co/storage/v1/object/public/widget/widget.js`;

  const embedCode = `<!-- Step 1: Add data-fitai-garment to your product images -->
<!-- Use data-fitai-category to specify: tops, bottoms, one-pieces (or omit for auto-detect) -->
<img src="your-product.jpg" data-fitai-garment data-fitai-category="tops" />

<!-- Step 2: Add the widget script (once per page) -->
<script
  src="${widgetUrl}"
  data-brand-id="${brand.api_key}"
  async></script>`;

  const embedCodeUrl = `<script
  src="${widgetUrl}"
  data-brand-id="${brand.api_key}"
  data-garment-url="YOUR_GARMENT_IMAGE_URL"
  async></script>`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="font-display text-lg font-semibold">
            Fit<span className="text-terracotta">AI</span> Dashboard
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <p className="font-body text-xs tracking-widest text-primary uppercase mb-2">
            Brand Dashboard
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{brand.name}</h1>
        </div>

        {/* API Key */}
        <section className="bg-card border border-border p-5 md:p-6 mb-6" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Your API Key
          </h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-secondary px-3 py-2.5 font-mono text-sm text-foreground overflow-x-auto" style={{ borderRadius: "2px" }}>
              {brand.api_key}
            </code>
            <button
              onClick={() => copyToClipboard(brand.api_key, "api")}
              className="p-2.5 border border-border hover:border-foreground/40 transition-colors"
              style={{ borderRadius: "2px" }}
              title="Copy"
            >
              {copied === "api" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleRegenerateKey}
              disabled={regenerating}
              className="p-2.5 border border-border hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              style={{ borderRadius: "2px" }}
              title="Regenerate API Key"
            >
              <RefreshCw size={16} className={regenerating ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-2">
            Keep this secret. Use it in your embed code. Regenerating will invalidate the current key.
          </p>
        </section>

        {/* Embed Code — Attribute Mode */}
        <section className="bg-card border border-border p-5 md:p-6 mb-6" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Embed Code — Attribute Mode (Recommended)
          </h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Add <code className="text-foreground">data-fitai-garment</code> to each product image you want to enable try-on for. Review images and other images are automatically ignored.
          </p>
          <div className="relative">
            <pre className="bg-secondary p-4 font-mono text-xs text-foreground overflow-x-auto" style={{ borderRadius: "2px" }}>
              {embedCode}
            </pre>
            <button
              onClick={() => copyToClipboard(embedCode, "embed1")}
              className="absolute top-2 right-2 p-1.5 bg-card/80 border border-border hover:border-foreground/40 transition-colors"
              style={{ borderRadius: "2px" }}
            >
              {copied === "embed1" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </section>

        {/* Embed Code — Direct URL */}
        <section className="bg-card border border-border p-5 md:p-6 mb-6" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Embed Code — Direct URL Mode
          </h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Pass the garment image URL directly if you have it available.
          </p>
          <div className="relative">
            <pre className="bg-secondary p-4 font-mono text-xs text-foreground overflow-x-auto" style={{ borderRadius: "2px" }}>
              {embedCodeUrl}
            </pre>
            <button
              onClick={() => copyToClipboard(embedCodeUrl, "embed2")}
              className="absolute top-2 right-2 p-1.5 bg-card/80 border border-border hover:border-foreground/40 transition-colors"
              style={{ borderRadius: "2px" }}
            >
              {copied === "embed2" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </section>

        {/* Domain Whitelist */}
        <section className="bg-card border border-border p-5 md:p-6 mb-6" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Allowed Domains
          </h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Restrict your widget to specific domains. Leave empty to allow all.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              className="flex-1 bg-secondary border border-border px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ borderRadius: "2px" }}
              placeholder="example.com, shop.example.com"
            />
            <button
              onClick={handleSaveDomains}
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-all disabled:opacity-50"
              style={{ borderRadius: "2px" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </section>

        {/* Integration Guide */}
        <section className="bg-card border border-border p-5 md:p-6" style={{ borderRadius: "4px" }}>
          <h2 className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
            Quick Start Guide
          </h2>
            <ol className="font-body text-sm text-muted-foreground space-y-3 list-decimal list-inside">
            <li>Add <code className="text-foreground">data-fitai-garment</code> to each product image, and optionally <code className="text-foreground">data-fitai-category="tops"</code> (tops, bottoms, or one-pieces): <code className="text-foreground">&lt;img src="..." data-fitai-garment data-fitai-category="tops" /&gt;</code></li>
            <li>Copy the embed script above and paste it before the closing <code className="text-foreground">&lt;/body&gt;</code> tag</li>
            <li>The "Try On" button will appear automatically next to each marked product image</li>
            <li>The category tells the AI exactly what type of garment it is for best results</li>
            <li>Shoppers click the button, upload their photo, and see the AI try-on result</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
