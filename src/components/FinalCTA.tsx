import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

const FinalCTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="final-cta" className="py-32 border-t border-border">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8"
        >
          <span className="font-body text-xs tracking-widest text-terracotta uppercase">
            Get started
          </span>

          <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl text-cream font-semibold leading-tight">
            Start reducing returns{" "}
            <em className="italic text-terracotta">today</em>
          </h2>

          <p className="font-body text-base text-muted-foreground max-w-sm">
            Join India's most aesthetics-forward brands on FitAI. No credit card required.
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col sm:flex-row gap-3 max-w-md"
            >
              <input
                type="email"
                placeholder="your@brand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-surface border border-border px-4 py-3.5 font-body text-sm text-cream placeholder:text-muted-foreground focus:outline-none focus:border-terracotta/60 transition-colors duration-200"
                style={{ borderRadius: "2px" }}
              />
              <button
                type="submit"
                className="bg-terracotta text-cream font-body text-sm px-6 py-3.5 hover:bg-terracotta-dim transition-all duration-200 tracking-wide flex items-center gap-2 whitespace-nowrap"
                style={{ borderRadius: "2px" }}
              >
                Get early access <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-surface border border-terracotta/30 px-8 py-5 text-center"
              style={{ borderRadius: "2px" }}
            >
              <p className="font-body text-sm text-cream">
                🎉 You're on the list! We'll reach out within 24 hours.
              </p>
            </motion.div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle size={14} className="text-terracotta/60" />
            <span className="font-body text-xs">
              Onboarding happens over WhatsApp. No forms. No calls. Just results.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
