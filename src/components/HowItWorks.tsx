import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Sign up & get embed code",
    desc: "Create your FitAI account in under 2 minutes. We instantly generate a unique embed script tied to your brand's catalogue.",
  },
  {
    num: "02",
    title: "Paste one line into your site",
    desc: "Drop a single <script> tag into your product pages — Shopify, WooCommerce, or custom. No developer required.",
  },
  {
    num: "03",
    title: "Customers try on, you sell more",
    desc: "Shoppers upload their photo and instantly see how your garments look on their body. Confidence goes up. Returns go down.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-body text-xs tracking-widest text-terracotta uppercase">
            How it works
          </span>
          <h2 className="font-display text-4xl lg:text-5xl text-cream mt-4 font-semibold leading-tight max-w-lg">
            Up and running in five minutes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-0 border border-border">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className={`p-8 lg:p-10 group hover:bg-surface transition-colors duration-300 cursor-default ${
                i < steps.length - 1 ? "border-b md:border-b-0 md:border-r border-border" : ""
              }`}
            >
              <div className="font-display text-5xl font-semibold text-terracotta/20 group-hover:text-terracotta/40 transition-colors duration-300 mb-6 leading-none">
                {step.num}
              </div>
              <h3 className="font-display text-xl text-cream mb-3 font-medium">
                {step.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
