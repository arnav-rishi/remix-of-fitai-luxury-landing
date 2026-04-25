import { motion } from "framer-motion";

const statCards = [
  {
    value: "30–40%",
    label: "average return rate for Indian clothing brands",
  },
  {
    value: "₹180",
    label: "average cost per returned order after logistics & restocking",
  },
  {
    value: "68%",
    label: "of returns are due to fit and size issues",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left — editorial copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6"
          >
            <span className="font-body text-xs tracking-widest text-terracotta uppercase">
              The problem
            </span>
            <h2 className="font-display text-4xl lg:text-5xl text-cream font-semibold leading-tight">
              India's clothing return problem is eating your margins
            </h2>
            <div className="w-10 h-0.5 bg-terracotta" />
            <p className="font-body text-base text-muted-foreground leading-relaxed">
              When a customer can't try before they buy, they over-order — and then return what doesn't fit. For Indian D2C brands shipping across 700+ districts, every return is a ₹180+ hole in your P&L.
            </p>
            <p className="font-body text-base text-muted-foreground leading-relaxed">
              The problem compounds: reverse logistics delays, repackaging costs, inventory limbo, and customer churn. Brands like Bewakoof and The Souled Store have entire ops teams managing returns. You might not.
            </p>
            <p className="font-body text-base text-muted-foreground leading-relaxed">
              FitAI gives your customers the confidence to commit. And it takes five minutes to set up.
            </p>
          </motion.div>

          {/* Right — stat cards */}
          <div className="flex flex-col gap-4">
            {statCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="bg-surface border border-border p-6 lg:p-8 hover:border-terracotta/30 transition-colors duration-300 group"
                style={{ borderRadius: "2px" }}
              >
                <div className="font-display text-4xl lg:text-5xl text-cream font-semibold mb-3 group-hover:text-terracotta transition-colors duration-300">
                  {card.value}
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {card.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
