import { Shield } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-glow-pulse"></div>
        <Shield className="w-10 h-10 text-primary relative z-10" strokeWidth={2} />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
        Secret Survey Vault
      </span>
    </div>
  );
};

export default Logo;
