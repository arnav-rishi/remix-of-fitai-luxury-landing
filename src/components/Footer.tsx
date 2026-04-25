const Footer = () => {
  return (
    <footer className="py-10 border-t border-border">
      <div className="container mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-lg font-semibold text-cream tracking-tight">
          Fit<span className="text-terracotta">AI</span>
        </div>
        <p className="font-body text-xs text-muted-foreground tracking-wide text-center">
          Let customers try before they buy
        </p>
        <p className="font-body text-xs text-muted-foreground/40">
          © 2024 FitAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
