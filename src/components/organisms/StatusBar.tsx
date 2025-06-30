import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Loader2 } from "lucide-react";
import { BuildStatus as KnowledgebaseBuildStatus } from '@/hooks/useKnowledgebase';
import { BuildStatus as AgentBuildStatus } from '@/hooks/useAgents';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import agentsStrings from '@/data/strings/agents.json';

interface StatusBarProps {
  buildStatus: KnowledgebaseBuildStatus | AgentBuildStatus;
  onCancel: () => void;
  type?: 'knowledgebase' | 'agent';
}

export function StatusBar({ buildStatus, onCancel, type = 'knowledgebase' }: StatusBarProps) {
  if (!buildStatus.isBuilding) return null;

  const getProgressMessage = () => {
    if (type === 'agent') {
      // For agents build status
      return (buildStatus as AgentBuildStatus).message;
    } else {
      // For knowledgebase build status
      const kbStatus = buildStatus as KnowledgebaseBuildStatus;
      const typeString = kbStatus.buildType === 'knowledge' ? 'index' : 'classifier';
      const message = knowledgebaseStrings.statusBar.building
        .replace('{{type}}', typeString)
        .replace('{{name}}', kbStatus.indexId || '');
      
      if (kbStatus.progress > 0) {
        const progressMsg = knowledgebaseStrings.statusBar.progress
          .replace('{{progress}}', Math.round(kbStatus.progress).toString());
        return `${message} - ${progressMsg}`;
      }
      
      return message;
    }
  };

  const statusBarContent = (
    <div className="fixed bottom-12 left-0 right-0 z-[60] bg-background border-t shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{getProgressMessage()}</p>
              {buildStatus.progress > 0 && (
                <Progress 
                  value={buildStatus.progress} 
                  className="mt-2 h-2 max-w-md"
                />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="ml-4"
          >
            <X className="h-4 w-4 mr-1" />
            {type === 'agent' ? agentsStrings.status.cancelBuild : knowledgebaseStrings.statusBar.cancel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(statusBarContent, document.body);
}