import { motion } from "framer-motion";

const brands = [
  "KALASUTRA",
  "RANGREZ CO.",
  "NUVARA",
  "THAAN COLLECTIVE",
  "MIRCH WALA",
  "INDIRA LABEL",
  "SAAJ WEAR",
  "TANA BANA",
];

const BrandsBar = () => {
  return (
    <section className="py-12 border-y border-border overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <p className="font-body text-xs text-muted-foreground tracking-widest uppercase text-center mb-8">
          Trusted by growing Indian D2C brands
        </p>
        <div className="flex items-center justify-between gap-8 overflow-x-auto scrollbar-none">
          {brands.map((brand, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="font-body text-xs tracking-widest text-muted-foreground/50 whitespace-nowrap hover:text-muted-foreground transition-colors duration-300 cursor-default"
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsBar;
