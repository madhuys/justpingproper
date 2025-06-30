import React from 'react';
import { NodeToolbar as ReactFlowNodeToolbar, Position } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Edit3 } from 'lucide-react';

interface NodeToolbarProps {
  nodeId: string;
  isVisible?: boolean;
  position?: Position;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
}

export function NodeToolbar({ 
  nodeId, 
  isVisible,
  position = Position.Top,
  onDelete,
  onDuplicate,
  onEdit
}: NodeToolbarProps) {
  return (
    <ReactFlowNodeToolbar
      nodeId={nodeId}
      isVisible={isVisible}
      position={position}
      offset={10}
    >
      <div className="workflow-node-toolbar flex gap-1 p-1 glass backdrop-blur-lg rounded-md shadow-md">
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
        {onDuplicate && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onDuplicate}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </ReactFlowNodeToolbar>
  );
}