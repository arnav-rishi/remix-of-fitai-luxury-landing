import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function BrandAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);
        
        const isAdminUser = roles?.some((r: any) => r.role === "admin");
        navigate(isAdminUser ? "/admin" : "/dashboard");
      } else {
        if (!brandName.trim()) {
          throw new Error("Brand name is required");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "https://fitai-try-on-studio.lovable.app/brand-auth",
          },
        });
        if (error) throw error;
        if (data.user && data.session) {
          // Create brand record
          const { error: brandError } = await supabase.from("brands").insert({
            user_id: data.user.id,
            name: brandName.trim(),
          } as any);
          if (brandError) throw brandError;
          navigate("/dashboard");
        } else {
          setSuccess("Check your email to confirm your account, then log in.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-2">
            {isLogin ? "Welcome back" : "Get started"}
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to your brand dashboard"
              : "Create your brand account to get your embed code"}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded mb-4 font-body text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 text-green-400 p-3 rounded mb-4 font-body text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                style={{ borderRadius: "2px" }}
                placeholder="Your brand name"
                required
              />
            </div>
          )}

          <div>
            <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-border px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ borderRadius: "2px" }}
              placeholder="you@brand.com"
              required
            />
          </div>

          <div>
            <label className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ borderRadius: "2px" }}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-body text-sm py-3 bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ borderRadius: "2px" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="font-body text-sm text-muted-foreground text-center mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
            className="text-primary hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
