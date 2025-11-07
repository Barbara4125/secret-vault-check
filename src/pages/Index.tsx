import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import QuestionCard from "@/components/QuestionCard";
import WalletConnect from "@/components/WalletConnect";
import { useToast } from "@/hooks/use-toast";

const questions = [
  {
    question: "How often do you feel stressed at work?",
    type: "multiple-choice" as const,
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
  },
  {
    question: "Do you feel comfortable sharing concerns with management?",
    type: "multiple-choice" as const,
    options: ["Very Comfortable", "Comfortable", "Neutral", "Uncomfortable", "Very Uncomfortable"]
  },
  {
    question: "What workplace changes would improve your mental health?",
    type: "text" as const
  },
  {
    question: "Rate your overall work-life balance",
    type: "multiple-choice" as const,
    options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
  }
];

const Index = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const handleAnswer = (index: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      toast({
        title: "Incomplete Survey",
        description: `Please answer all ${questions.length} questions before submitting.`,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Survey Submitted",
      description: "Your anonymous responses have been encrypted and submitted successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Logo />
          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl font-bold text-foreground">
              Answer Honestly. Stay Anonymous.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your responses are encrypted end-to-end and only revealed in aggregate analytics. 
              Complete privacy guaranteed.
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <QuestionCard
                key={index}
                index={index}
                question={q.question}
                type={q.type}
                options={q.options}
                onAnswer={(answer) => handleAnswer(index, answer)}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              onClick={handleSubmit}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Submit Survey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Link to="/analytics">
              <Button 
                variant="outline"
                size="lg"
                className="border-border hover:border-primary"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
