import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

const embedCode = `<!-- Add to your product images -->
<img src="your-product.jpg" data-fitai-garment data-fitai-category="tops" />

<!-- Add once per page -->
<script src="https://cdn.fitai.in/widget.js" data-brand-id="YOUR_ID" async></script>`;

const EmbedCode = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="embed" className="py-24 border-t border-border">
      <div className="container mx-auto px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-body text-xs tracking-widest text-terracotta uppercase">
              Integration
            </span>
            <h2 className="font-display text-4xl lg:text-5xl text-cream mt-4 font-semibold leading-tight">
              One line of code.{" "}
              <span className="italic">Works everywhere.</span>
            </h2>
            <p className="font-body text-base text-muted-foreground mt-4 mb-12 max-w-lg mx-auto">
              Shopify, WooCommerce, Magento, or custom — our widget drops in anywhere a script tag does.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-surface border border-border relative group"
            style={{ borderRadius: "2px" }}
          >
            {/* Code block header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <span className="font-body text-xs text-muted-foreground tracking-wide">
                HTML
              </span>
            </div>

            {/* Code */}
            <div className="px-6 py-6 text-left overflow-x-auto">
              <code className="font-mono text-sm leading-relaxed whitespace-pre">
                <span className="text-muted-foreground">&lt;!-- Add to your product images --&gt;</span>{"\n"}
                <span className="text-terracotta/70">&lt;img</span>{" "}
                <span className="text-cream/60">src</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-cream/40">"your-product.jpg"</span>{" "}
                <span className="text-cream/60">data-fitai-garment</span>{" "}
                <span className="text-cream/60">data-fitai-category</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-cream/40">"tops"</span>{" "}
                <span className="text-terracotta/70">/&gt;</span>{"\n\n"}
                <span className="text-muted-foreground">&lt;!-- Add once per page --&gt;</span>{"\n"}
                <span className="text-terracotta/70">&lt;script</span>{" "}
                <span className="text-cream/60">src</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-cream/40">"https://cdn.fitai.in/widget.js"</span>{" "}
                <span className="text-cream/60">data-brand-id</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-cream/40">"YOUR_ID"</span>{" "}
                <span className="text-cream/60">async</span>
                <span className="text-terracotta/70">&gt;&lt;/script&gt;</span>
              </code>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`absolute top-3 right-12 flex items-center gap-2 font-body text-xs px-3 py-1.5 border transition-all duration-200 ${
                copied
                  ? "border-terracotta/50 text-terracotta bg-terracotta/10"
                  : "border-border text-muted-foreground hover:border-terracotta/40 hover:text-cream"
              }`}
              style={{ borderRadius: "2px" }}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6"
          >
            {["Shopify", "WooCommerce", "Magento", "Custom HTML"].map((p) => (
              <span key={p} className="font-body text-xs text-muted-foreground/60 tracking-widest uppercase">
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EmbedCode;
