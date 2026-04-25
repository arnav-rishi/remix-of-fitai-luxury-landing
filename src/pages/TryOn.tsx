import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowLeft, Upload, ShoppingCart, RefreshCw, Sparkles, X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import garment1 from "@/assets/garment-1.jpg";
import garment2 from "@/assets/garment-2.jpg";
import garment3 from "@/assets/garment-3.jpg";
import garment4 from "@/assets/garment-4.jpg";

const GARMENTS = [
  { id: 1, name: "Rust Gold Embroidered Kurta", price: "₹3,490", img: garment1, tag: "Bestseller", category: "tops" },
  { id: 2, name: "Ivory Anarkali Set", price: "₹5,290", img: garment2, tag: "New Arrival", category: "one-pieces" },
  { id: 3, name: "Peacock Blue Floral Kurti", price: "₹4,190", img: garment3, tag: "Festive Edit", category: "tops" },
  { id: 4, name: "Blush Pink Embroidered Frock", price: "₹5,890", img: garment4, tag: "New Arrival", category: "one-pieces" },
];

const SIZES = ["XS", "S", "M", "L", "XL"];

type Step = "grid" | "product" | "upload" | "result";

interface Garment {
  id: number;
  name: string;
  price: string;
  img: string;
  tag: string | null;
  category: string;
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

/**
 * Load any image URL (blob:, http:, or bundled asset path), draw it onto a
 * canvas (max 1024px), and return the full data-URI string.
 * fashn.ai accepts data-URIs with the prefix included.
 */
async function toDataUri(url: string, maxDim = 1024): Promise<string> {
  const srcUrl = await (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return url;
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return url;
    }
  })();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = srcUrl;
  });
}

export default function TryOn() {
  const [step, setStep] = useState<Step>("grid");
  const [selected, setSelected] = useState<Garment | null>(null);
  const [size, setSize] = useState("M");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Generating your try-on…");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSelectGarment = (g: Garment) => {
    setSelected(g);
    setStep("product");
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setPhotoFile(file);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleGenerate = async () => {
    if (!photo || !selected) return;
    setLoading(true);
    setError(null);
    setLoadingMsg("Preparing images…");

    try {
      const [modelDataUri, garmentDataUri] = await Promise.all([
        toDataUri(photo),
        toDataUri(selected.img),
      ]);

      console.log("model_image length:", modelDataUri.length);
      console.log("garment_image length:", garmentDataUri.length);
      console.log("model_image prefix:", modelDataUri.substring(0, 50));
      console.log("garment_image prefix:", garmentDataUri.substring(0, 50));

      setLoadingMsg("Starting try-on job…");

      const { data: runData, error: runError } = await supabase.functions.invoke("fashn-run", {
        body: {
          model_image: modelDataUri,
          garment_image: garmentDataUri,
          category: selected.category ?? "auto",
        },
      });

      if (runError || runData?.error) {
        throw new Error(runData?.error || runError?.message || "Failed to start try-on job");
      }

      const jobId: string = runData.id;
      if (!jobId) throw new Error("No job ID returned");

      setLoadingMsg("Generating your try-on… (~30s)");

      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));

        const { data: statusData, error: statusError } = await supabase.functions.invoke("fashn-status", {
          body: { id: jobId },
        });

        if (statusError || statusData?.error) {
          console.warn("Status poll error:", statusError || statusData?.error);
          continue;
        }

        const status: string = statusData?.status;
        console.log(`Poll ${attempt + 1}: status = ${status}`);

        if (status === "completed") {
          const outputUrl: string = statusData?.output?.[0];
          if (!outputUrl) throw new Error("No output URL in completed job");
          setResult(outputUrl);
          setStep("result");
          return;
        }

        if (status === "failed") {
          const rawErr = statusData?.error;
          const errMsg =
            typeof rawErr === "string"
              ? rawErr
              : rawErr
              ? JSON.stringify(rawErr)
              : "Unknown error";
          throw new Error(`Try-on failed: ${errMsg}`);
        }

        if (attempt > 5) setLoadingMsg("Almost there… hang tight");
      }

      throw new Error("Timed out waiting for try-on result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("grid");
    setSelected(null);
    setPhoto(null);
    setPhotoFile(null);
    setResult(null);
    setError(null);
    setSize("M");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:py-4 md:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="font-display text-base md:text-lg font-semibold tracking-tight text-foreground">
            Fit<span className="text-terracotta">AI</span>
          </div>
          <div className="w-12 md:w-16" />
        </div>
      </header>

      <main className="pt-16 md:pt-20 pb-12 md:pb-16">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: GARMENT GRID ── */}
          {step === "grid" && (
            <motion.div
              key="grid"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="container mx-auto px-4 md:px-8 py-6 md:py-10"
            >
              <div className="mb-6 md:mb-10">
                <p className="font-body text-xs tracking-widest text-terracotta uppercase mb-2 md:mb-3">
                  Virtual Try-On
                </p>
                <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold text-foreground leading-tight">
                  Choose a garment to try on
                </h1>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {GARMENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGarment(g)}
                    className="group text-left focus:outline-none"
                  >
                    <div
                      className="relative overflow-hidden bg-card border border-border aspect-[3/4] mb-2 md:mb-3"
                      style={{ borderRadius: "2px" }}
                    >
                      <img
                        src={g.img}
                        alt={g.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {g.tag && (
                        <span
                          className="absolute top-2 left-2 md:top-3 md:left-3 font-body text-[10px] md:text-xs tracking-widest uppercase text-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1"
                          style={{ borderRadius: "1px" }}
                        >
                          {g.tag}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-10 md:h-14 bg-gradient-to-t from-background/60 to-transparent" />
                    </div>
                    <p className="font-body text-xs md:text-sm text-foreground leading-snug mb-0.5 md:mb-1">{g.name}</p>
                    <p className="font-body text-xs md:text-sm text-terracotta">{g.price}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: PRODUCT VIEW ── */}
          {step === "product" && selected && (
            <motion.div
              key="product"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="container mx-auto px-4 md:px-8 py-6 md:py-10"
            >
              <button
                onClick={() => setStep("grid")}
                className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors mb-5 md:mb-8 tracking-wide uppercase"
              >
                <ArrowLeft size={12} /> All garments
              </button>

              <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-16 items-start">
                {/* Image */}
                <div
                  className="bg-card border border-border overflow-hidden aspect-[3/4] max-w-xs mx-auto w-full md:max-w-none"
                  style={{ borderRadius: "2px" }}
                >
                  <img
                    src={selected.img}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col gap-5 md:gap-6 md:pt-4">
                  <div>
                    <p className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-2">
                      FitAI Collection
                    </p>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-2 md:mb-3">
                      {selected.name}
                    </h2>
                    <p className="font-display text-xl md:text-2xl text-terracotta">{selected.price}</p>
                  </div>

                  {/* Size selector */}
                  <div>
                    <p className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-3">
                      Size
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`font-body text-sm w-10 h-10 md:w-11 md:h-11 border transition-all duration-200 ${
                            size === s
                              ? "border-foreground text-foreground bg-secondary"
                              : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                          }`}
                          style={{ borderRadius: "2px" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3 pt-1 md:pt-2">
                    <button
                      className="w-full font-body text-sm py-3 md:py-3.5 border border-border text-foreground hover:border-foreground/60 transition-all duration-200 tracking-wide flex items-center justify-center gap-2"
                      style={{ borderRadius: "2px" }}
                    >
                      <ShoppingCart size={14} /> Add to cart
                    </button>
                    <button
                      className="w-full font-body text-sm py-3 md:py-3.5 bg-secondary text-foreground hover:bg-secondary/80 transition-all duration-200 tracking-wide"
                      style={{ borderRadius: "2px" }}
                    >
                      Buy now
                    </button>
                    <button
                      onClick={() => setStep("upload")}
                      className="w-full font-body text-sm py-3 md:py-3.5 bg-terracotta text-cream hover:opacity-90 transition-all duration-200 tracking-wide flex items-center justify-center gap-2"
                      style={{ borderRadius: "2px" }}
                    >
                      <Sparkles size={14} /> Try On
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: UPLOAD ── */}
          {step === "upload" && selected && (
            <motion.div
              key="upload"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="container mx-auto px-4 md:px-8 py-6 md:py-10"
            >
              <button
                onClick={() => { setPhoto(null); setStep("product"); }}
                className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8 tracking-wide uppercase"
              >
                <ArrowLeft size={12} /> Back
              </button>

              <div className="max-w-sm md:max-w-lg mx-auto">
                <div className="mb-6 md:mb-8 text-center">
                  <p className="font-body text-xs tracking-widest text-terracotta uppercase mb-2 md:mb-3">
                    Step 2 of 2
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">
                    Upload your photo
                  </h2>
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    Front-facing photo works best
                  </p>
                </div>

                {!photo ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-4 py-14 md:py-20 transition-all duration-200 ${
                      dragging
                        ? "border-terracotta bg-terracotta/5"
                        : "border-border hover:border-foreground/30"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    <Upload size={28} className={dragging ? "text-terracotta" : "text-muted-foreground"} />
                    <div className="text-center px-4">
                      <p className="font-body text-sm text-foreground mb-1">
                        Tap to upload your photo
                      </p>
                      <p className="font-body text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 md:gap-5">
                    <div
                      className="relative border border-border overflow-hidden"
                      style={{ borderRadius: "2px" }}
                    >
                      <img src={photo} alt="Uploaded" className="w-full max-h-64 md:max-h-72 object-cover" />
                      <button
                        onClick={() => { setPhoto(null); setPhotoFile(null); }}
                        className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm p-1.5 border border-border hover:border-foreground/40 transition-colors"
                        style={{ borderRadius: "2px" }}
                      >
                        <X size={14} className="text-foreground" />
                      </button>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 md:px-4 py-3" style={{ borderRadius: "2px" }}>
                        <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                        <p className="font-body text-xs text-destructive">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full font-body text-sm py-4 bg-terracotta text-cream hover:opacity-90 disabled:opacity-60 transition-all duration-200 tracking-wide flex items-center justify-center gap-2"
                      style={{ borderRadius: "2px" }}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                          {loadingMsg}
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> Generate Try-On
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: RESULT ── */}
          {step === "result" && selected && result && (
            <motion.div
              key="result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="container mx-auto px-4 md:px-8 py-6 md:py-10"
            >
              <div className="max-w-sm md:max-w-xl mx-auto">
                <div className="mb-5 md:mb-6 text-center">
                  <p className="font-body text-xs tracking-widest text-terracotta uppercase mb-2">
                    Your try-on is ready
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">
                    {selected.name}
                  </h2>
                </div>

                <div
                  className="border border-border overflow-hidden mb-5 md:mb-6"
                  style={{ borderRadius: "2px" }}
                >
                  <img src={result} alt="Try-on result" className="w-full object-cover" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setPhoto(null); setStep("upload"); }}
                    className="font-body text-sm py-3 md:py-3.5 border border-border text-foreground hover:border-foreground/60 transition-all duration-200 tracking-wide flex items-center justify-center gap-2"
                    style={{ borderRadius: "2px" }}
                  >
                    <RefreshCw size={13} /> Try another
                  </button>
                  <button
                    className="font-body text-sm py-3 md:py-3.5 bg-terracotta text-cream hover:opacity-90 transition-all duration-200 tracking-wide flex items-center justify-center gap-2"
                    style={{ borderRadius: "2px" }}
                  >
                    <ShoppingCart size={13} /> Add to cart
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full mt-3 font-body text-xs text-muted-foreground hover:text-foreground transition-colors py-2 tracking-wide"
                >
                  ← Back to all garments
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
