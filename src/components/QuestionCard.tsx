import { Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface QuestionCardProps {
  question: string;
  type: "multiple-choice" | "text";
  options?: string[];
  index: number;
  onAnswer: (answer: string) => void;
}

const QuestionCard = ({ question, type, options, index, onAnswer }: QuestionCardProps) => {
  const [answered, setAnswered] = useState(false);
  const [value, setValue] = useState("");

  const handleAnswer = (answer: string) => {
    setValue(answer);
    setAnswered(true);
    onAnswer(answer);
  };

  return (
    <Card 
      className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 animate-slide-up relative overflow-hidden group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute top-4 right-4">
        {answered ? (
          <CheckCircle2 className="w-6 h-6 text-primary animate-lock-unlock" />
        ) : (
          <Lock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>

      <div className="mb-6 pr-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Question {index + 1}
        </h3>
        <p className="text-foreground/90">{question}</p>
      </div>

      {type === "multiple-choice" && options ? (
        <RadioGroup value={value} onValueChange={handleAnswer} className="space-y-3">
          {options.map((option, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <RadioGroupItem value={option} id={`q${index}-option${i}`} />
              <Label 
                htmlFor={`q${index}-option${i}`} 
                className="flex-1 cursor-pointer text-foreground/90"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <Textarea
          placeholder="Your anonymous answer..."
          value={value}
          onChange={(e) => handleAnswer(e.target.value)}
          className="min-h-32 bg-secondary/30 border-border focus:border-primary resize-none"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  );
};

export default QuestionCard;
