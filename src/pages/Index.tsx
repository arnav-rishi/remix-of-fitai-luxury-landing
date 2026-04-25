import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import BrandsBar from "@/components/BrandsBar";
import HowItWorks from "@/components/HowItWorks";
import ProblemSection from "@/components/ProblemSection";
import Pricing from "@/components/Pricing";
import EmbedCode from "@/components/EmbedCode";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <BrandsBar />
      <HowItWorks />
      <ProblemSection />
      <Pricing />
      <EmbedCode />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
