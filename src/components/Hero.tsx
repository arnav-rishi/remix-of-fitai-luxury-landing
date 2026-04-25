import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroFashion from "@/assets/hero-fashion.jpg";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: "easeOut" } as Transition,
});

const Hero = () => {
  const navigate = useNavigate();
  const stats = [
    { value: "40%", label: "fewer returns" },
    { value: "2×", label: "add-to-cart rate" },
    { value: "5 min", label: "to go live" },
  ];

  return (
    <section className="min-h-screen pt-24 pb-16 flex flex-col justify-center">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            <motion.div {...fadeUp(0.1)}>
              <span className="font-body text-xs tracking-widest text-terracotta uppercase border border-terracotta/30 px-3 py-1.5 inline-block">
                Virtual try-on for Indian D2C brands
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.2)}
              className="font-display text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.05] text-cream"
            >
              Let customers{" "}
              <em className="font-display" style={{ fontStyle: "italic" }}>
                try
              </em>{" "}
              before they buy
            </motion.h1>

            <motion.p {...fadeUp(0.35)} className="font-body text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
              India's D2C clothing brands lose crores every year to return-driven logistics. FitAI plugs directly into your store and shows customers how garments look on their body — before checkout.
            </motion.p>

            <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row gap-3">
              <button
                className="font-body text-sm bg-terracotta text-cream px-7 py-3.5 hover:bg-terracotta-dim transition-all duration-200 tracking-wide flex items-center gap-2"
                style={{ borderRadius: "2px" }}
                onClick={() => document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start for free <ArrowRight size={14} />
              </button>
              <button
                className="font-body text-sm border border-border text-cream px-7 py-3.5 hover:border-terracotta/60 hover:text-terracotta transition-all duration-200 tracking-wide"
                style={{ borderRadius: "2px" }}
                onClick={() => navigate("/tryon")}
              >
                See how it works
              </button>
            </motion.div>
          </div>

          {/* Right column — Lifestyle image */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="overflow-hidden border border-border" style={{ borderRadius: "2px" }}>
              <img
                src={heroFashion}
                alt="Model wearing ethnic wear"
                className="w-full h-[560px] lg:h-[640px] object-cover object-top"
              />
              {/* subtle overlay badge */}
              <div className="absolute bottom-5 left-5 bg-background/80 backdrop-blur-sm border border-border px-4 py-3" style={{ borderRadius: "2px" }}>
                <p className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-0.5">Powered by FitAI</p>
                <p className="font-display text-sm text-cream">See it on you before you buy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          {...fadeUp(0.6)}
          className="mt-20 pt-10 border-t border-border grid grid-cols-3 gap-6"
        >
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="font-display text-3xl lg:text-4xl text-cream font-semibold">
                {s.value}
              </span>
              <span className="font-body text-sm text-muted-foreground tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
