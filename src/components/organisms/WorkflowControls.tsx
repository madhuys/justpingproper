import React from 'react';
import { WorkflowZoomControl } from '@/components/atoms/WorkflowZoomControl';
import { WorkflowGridControl } from '@/components/atoms/WorkflowGridControl';
import { WorkflowSaveStatus } from '@/components/atoms/WorkflowSaveStatus';
import { WorkflowFlowDirectionControl } from '@/components/molecules/WorkflowFlowDirectionControl';
import { WorkflowAlignmentControl } from '@/components/molecules/WorkflowAlignmentControl';
import { WorkflowNodeCounter } from '@/components/molecules/WorkflowNodeCounter';
import { Card } from '@/components/ui/card';

interface WorkflowControlsProps {
  // Zoom controls
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  
  // Grid controls
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  
  // Flow direction
  flowDirection: 'TB' | 'LR';
  onDirectionChange: (direction: 'TB' | 'LR') => void;
  onReturnToStart: () => void;
  
  // Alignment controls
  showAlignmentControls: boolean;
  onAlignLeft: () => void;
  onAlignCenterHorizontal: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignCenterVertical: () => void;
  onAlignBottom: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onArrangeHierarchy: () => void;
  
  // Node counter
  nodeCounts: {
    message: number;
    input: number;
    action: number;
    end: number;
  };
  
  // Save status
  saveStatus: string | null;
  hasChanges: boolean;
  onClearSaveStatus: () => void;
  
  // Touch mode
  isTouchDevice: boolean;
  
  // Theme
  theme: 'light' | 'dark';
}

export function WorkflowControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  showGrid,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  flowDirection,
  onDirectionChange,
  onReturnToStart,
  showAlignmentControls,
  onAlignLeft,
  onAlignCenterHorizontal,
  onAlignRight,
  onAlignTop,
  onAlignCenterVertical,
  onAlignBottom,
  onDistributeHorizontal,
  onDistributeVertical,
  onArrangeHierarchy,
  nodeCounts,
  saveStatus,
  hasChanges,
  onClearSaveStatus,
  isTouchDevice,
  theme
}: WorkflowControlsProps) {
  const cardStyle = {
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(127, 127, 127, 0.2)'
  };

  return (
    <>
      {/* Flow Direction Toggle and Return to Start - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <WorkflowFlowDirectionControl
          flowDirection={flowDirection}
          onDirectionChange={onDirectionChange}
          onReturnToStart={onReturnToStart}
          theme={theme}
        />
      </div>

      {/* Zoom and Grid Controls - Top Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <WorkflowZoomControl
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitView={onFitView}
          theme={theme}
        />
        <WorkflowGridControl
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          onToggleGrid={onToggleGrid}
          onToggleSnap={onToggleSnap}
          theme={theme}
        />
        
        {/* Touch Mode Indicator */}
        {isTouchDevice && (
          <Card className="p-2" style={cardStyle}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs">Touch Mode</span>
            </div>
          </Card>
        )}
      </div>

      {/* Alignment Controls - Bottom Center */}
      {showAlignmentControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <WorkflowAlignmentControl
            onAlignLeft={onAlignLeft}
            onAlignCenterHorizontal={onAlignCenterHorizontal}
            onAlignRight={onAlignRight}
            onAlignTop={onAlignTop}
            onAlignCenterVertical={onAlignCenterVertical}
            onAlignBottom={onAlignBottom}
            onDistributeHorizontal={onDistributeHorizontal}
            onDistributeVertical={onDistributeVertical}
            onArrangeHierarchy={onArrangeHierarchy}
            theme={theme}
          />
        </div>
      )}

      {/* Save Status - Bottom Left */}
      {(saveStatus || hasChanges) && (
        <div className="absolute bottom-4 left-4">
          <WorkflowSaveStatus
            saveStatus={saveStatus}
            hasChanges={hasChanges}
            onClearStatus={onClearSaveStatus}
            theme={theme}
          />
        </div>
      )}

      {/* Node Counter - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <WorkflowNodeCounter
          nodeCounts={nodeCounts}
          theme={theme}
        />
      </div>
    </>
  );
}