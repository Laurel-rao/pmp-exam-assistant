'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

interface Question {
  id: string;
  type: string;
  content: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
}

export default function PracticePage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRandomQuestion = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/questions/random");
      const data = await response.json();
      setQuestion(data);
      setSelectedAnswer("");
      setShowAnswer(false);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const handleSubmit = () => {
    if (selectedAnswer) {
      setShowAnswer(true);
    }
  };

  if (loading || !question) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">练习模式</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchRandomQuestion}>
            下一题
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex gap-2 text-sm text-muted-foreground mb-2">
              <span>{question.type}</span>
              <span>•</span>
              <span>题目ID: {question.id}</span>
            </div>
            <p className="text-lg">{question.content}</p>
          </div>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {Object.entries(question.options).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className="text-base">
                  {key}. {value}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div>
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={!selectedAnswer || showAnswer}
            >
              提交答案
            </Button>
          </div>
        </div>
      </Card>

      {showAnswer && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">答案解析</h3>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm text-muted-foreground">
              正确答案：{question.answer}
            </p>
            <p className="text-sm">
              {selectedAnswer === question.answer ? (
                <span className="text-green-500">回答正确</span>
              ) : (
                <span className="text-red-500">回答错误</span>
              )}
            </p>
          </div>
          <Separator className="my-4" />
          <p>{question.explanation}</p>
        </Card>
      )}
    </div>
  );
} 