import React from 'react';
import { ConnectionLineComponentProps, Position } from 'reactflow';

interface FlowDirectionConnectionLineProps extends ConnectionLineComponentProps {
  flowDirection?: 'TB' | 'LR';
}

export function FlowDirectionConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
  flowDirection = 'TB',
}: FlowDirectionConnectionLineProps) {
  // Calculate path based on flow direction
  const getMidpoint = () => {
    if (flowDirection === 'LR') {
      // Left to Right: curve horizontally
      const midX = (fromX + toX) / 2;
      return `M${fromX},${fromY} C${midX},${fromY} ${midX},${toY} ${toX},${toY}`;
    } else {
      // Top to Bottom: curve vertically
      const midY = (fromY + toY) / 2;
      return `M${fromX},${fromY} C${fromX},${midY} ${toX},${midY} ${toX},${toY}`;
    }
  };

  return (
    <g>
      <path
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        className="animated"
        d={getMidpoint()}
        style={connectionLineStyle}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#6366f1"
        strokeWidth={1.5}
      />
    </g>
  );
}