import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tag, Sparkles } from "lucide-react";
import { ClassificationResult } from '@/hooks/useKnowledgebase';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import { Loader } from "@/components/atoms/Loader";

interface ClassificationTesterProps {
  indexId: string;
  onClassify: (indexId: string, text: string) => void;
  classificationResult: ClassificationResult | null;
  isClassifying: boolean;
}

export function ClassificationTester({ 
  indexId, 
  onClassify, 
  classificationResult, 
  isClassifying 
}: ClassificationTesterProps) {
  const [inputText, setInputText] = useState('');

  const handleClassify = () => {
    if (inputText.trim()) {
      onClassify(indexId, inputText);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={knowledgebaseStrings.classification.placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <Button 
          onClick={handleClassify} 
          disabled={isClassifying || !inputText.trim()}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {knowledgebaseStrings.classification.button}
        </Button>
      </div>

      {isClassifying && (
        <div className="flex items-center justify-center py-8">
          <Loader />
          <span className="ml-2 text-sm text-muted-foreground">
            {knowledgebaseStrings.classification.classifying}
          </span>
        </div>
      )}

      {!isClassifying && classificationResult && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">{knowledgebaseStrings.classification.result}</h4>
            </div>
            
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                <span className="text-2xl font-semibold text-primary">
                  {classificationResult.label}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {knowledgebaseStrings.classification.confidence}
                </span>
                <span className={`font-medium ${getConfidenceColor(classificationResult.confidence)}`}>
                  {(classificationResult.confidence * 100).toFixed(1)}% ({getConfidenceLabel(classificationResult.confidence)})
                </span>
              </div>
              <Progress 
                value={classificationResult.confidence * 100} 
                className="h-2"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}