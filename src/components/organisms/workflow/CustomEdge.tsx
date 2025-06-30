import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  // Offset the edge connection points
  // For source (output) - move 4px in the direction of flow
  // For target (input) - keep at original position
  let adjustedSourceX = sourceX;
  let adjustedSourceY = sourceY;
  
  // Adjust based on source position
  switch (sourcePosition) {
    case 'right':
      adjustedSourceX += 4; // Move 4px to the right
      break;
    case 'bottom':
      adjustedSourceY += 4; // Move 4px down
      break;
    case 'left':
      adjustedSourceX -= 4; // Move 4px to the left
      break;
    case 'top':
      adjustedSourceY -= 4; // Move 4px up
      break;
  }

  const [edgePath] = getSmoothStepPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={style} 
      />
    </>
  );
};

export default CustomEdge;