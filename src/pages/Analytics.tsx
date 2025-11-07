import { BarChart3, Users, Lock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Analytics = () => {
  const mockData = [
    { question: "How often do you feel stressed at work?", responses: 247, avgRating: 3.8 },
    { question: "Do you feel comfortable sharing concerns with management?", responses: 245, avgRating: 2.9 },
    { question: "Rate your work-life balance", responses: 250, avgRating: 3.2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Logo />
          <Link to="/">
            <Button variant="outline" className="border-border">
              Back to Survey
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground">
              Aggregate Analytics
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              All data is encrypted and displayed only in aggregate form. Individual responses remain completely anonymous.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                  <p className="text-3xl font-bold text-foreground">250</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Encryption Level</p>
                  <p className="text-3xl font-bold text-foreground">256-bit</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold text-foreground">94%</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Response Distribution</h2>
            </div>

            {mockData.map((item, index) => (
              <Card 
                key={index} 
                className="p-6 bg-card border-border animate-slide-up hover:border-primary/50 transition-all"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-foreground flex-1">
                      {item.question}
                    </h3>
                    <div className="text-right ml-4">
                      <p className="text-sm text-muted-foreground">Responses</p>
                      <p className="text-2xl font-bold text-primary">{item.responses}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Rating</span>
                      <span className="text-foreground font-medium">{item.avgRating}/5.0</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000"
                        style={{ width: `${(item.avgRating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
