import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';

function CustomEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition,
  data 
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculer la couleur et l'épaisseur en fonction du flot
  const flowPercentage = data.flow / data.capacity;
  const strokeColor = flowPercentage === 1 ? 'red' : 
                      flowPercentage > 0.7 ? 'orange' : 
                      flowPercentage > 0.3 ? 'yellow' : 'green';
  const strokeWidth = 2 + (flowPercentage * 3); // Épaisseur variable

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{ 
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: 0.8
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: 'rgba(255,255,255,0.8)',
            padding: '3px 6px',
            borderRadius: '5px',
            fontSize: '12px',
            border: `1px solid ${strokeColor}`
          }}
        >
          {`${data.flow || 0}/${data.capacity}`}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default CustomEdge;