import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const WalletConnect = () => {
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    // Mock wallet connection
    setConnected(true);
    toast({
      title: "Wallet Connected",
      description: "Rainbow Wallet connected successfully. Your identity remains anonymous.",
    });
  };

  return (
    <div className="flex items-center gap-4">
      {connected ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-primary font-medium">Connected</span>
        </div>
      ) : (
        <Button 
          onClick={handleConnect}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Rainbow Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
