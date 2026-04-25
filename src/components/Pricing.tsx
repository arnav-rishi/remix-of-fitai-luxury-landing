import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "/mo",
    desc: "For early-stage brands testing the waters",
    features: [
      "Up to 1000 try-on sessions/month",
      "1 storefront integration",
      "Standard AI model",
      "Email support",
      "FitAI watermark on widget",
    ],
    cta: "Start for free",
    featured: false,
  },
  {
    name: "Growth",
    price: "₹9,999",
    period: "/mo",
    desc: "For brands scaling past ₹1Cr GMV",
    features: [
      "Up to 2,000 try-on sessions/month",
      "3 storefront integrations",
      "Enhanced AI model",
      "Priority support (WhatsApp)",
      "No FitAI watermark",
      "Analytics dashboard",
    ],
    cta: "Start Growth plan",
    featured: true,
  },
  {
    name: "Scale",
    price: "₹19,999",
    period: "/mo",
    desc: "For established D2C brands at serious volume",
    features: [
      "Up to 8,000 try-on sessions/month",
      "Unlimited integrations",
      "Premium AI model (highest accuracy)",
      "Dedicated account manager",
      "Custom widget branding",
      "API access + webhooks",
      "SLA guarantee",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 border-t border-border">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="font-body text-xs tracking-widest text-terracotta uppercase">
            Pricing
          </span>
          <h2 className="font-display text-4xl lg:text-5xl text-cream mt-4 font-semibold leading-tight">
            Simple, honest pricing
          </h2>
          <p className="font-body text-base text-muted-foreground mt-4 max-w-md mx-auto">
            No setup fees. No long-term contracts. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className={`relative flex flex-col p-8 transition-all duration-300 ${
                plan.featured
                  ? "bg-surface border-0"
                  : "bg-surface border border-border hover:border-border/80"
              }`}
              style={{
                borderRadius: "2px",
                ...(plan.featured
                  ? {
                      background:
                        "linear-gradient(hsl(var(--surface)), hsl(var(--surface))) padding-box, linear-gradient(135deg, hsl(18 64% 47%), hsl(40 60% 97% / 0.3), hsl(18 64% 47%)) border-box",
                      border: "1.5px solid transparent",
                    }
                  : {}),
              }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-8">
                  <span className="font-body text-xs bg-terracotta text-cream px-3 py-1 tracking-widest uppercase">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl text-cream font-medium mb-1">
                  {plan.name}
                </h3>
                <p className="font-body text-xs text-muted-foreground">
                  {plan.desc}
                </p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="font-display text-4xl text-cream font-semibold">
                  {plan.price}
                </span>
                <span className="font-body text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-8">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check
                      size={14}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.featured ? "text-terracotta" : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-body text-sm text-muted-foreground leading-relaxed">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full font-body text-sm py-3.5 tracking-wide transition-all duration-200 ${
                  plan.featured
                    ? "bg-terracotta text-cream hover:bg-terracotta-dim"
                    : "border border-border text-cream hover:border-terracotta/50 hover:text-terracotta"
                }`}
                style={{ borderRadius: "2px" }}
                onClick={() => document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" })}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
