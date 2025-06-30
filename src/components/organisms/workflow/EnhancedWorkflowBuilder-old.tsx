import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { EnhancedWorkflowNode, WorkflowNodeData } from './EnhancedWorkflowNode';
import { WorkflowSidebarEnhanced } from './WorkflowSidebarEnhanced';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowUpDown, ArrowLeftRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import workflowState from '@/data/states/workflow.json';

const nodeTypes = {
  workflow: EnhancedWorkflowNode,
};

const initialNodes: Node<WorkflowNodeData>[] = [
  {
    id: '1',
    type: 'workflow',
    position: { x: 400, y: 50 },
    data: {
      label: 'Start',
      type: 'start',
      prompt: 'Conversation begins here',
    },
  },
];

interface EnhancedWorkflowBuilderProps {
  onSave: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
  initialFlow?: {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
  };
  selectedNode: Node<WorkflowNodeData> | null;
  onNodeSelect: (node: Node<WorkflowNodeData>) => void;
}

export function EnhancedWorkflowBuilder({ 
  onSave, 
  initialFlow,
  selectedNode,
  onNodeSelect 
}: EnhancedWorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [flowDirection, setFlowDirection] = useState<'TB' | 'LR'>(workflowState.flowDirection as 'TB' | 'LR');
  
  // Load saved zoom and viewport from localStorage
  const savedZoom = typeof window !== 'undefined' ? localStorage.getItem('workflowZoom') : null;
  const savedViewport = typeof window !== 'undefined' ? localStorage.getItem('workflowViewport') : null;
  
  const initialZoom = savedZoom ? parseFloat(savedZoom) : workflowState.zoom;
  const initialViewport = savedViewport ? JSON.parse(savedViewport) : { x: 0, y: 0, zoom: initialZoom };
  
  const [zoom, setZoom] = useState(initialZoom);
  const [viewport, setViewport] = useState(initialViewport);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeData = JSON.parse(type);
      const newNode: Node<WorkflowNodeData> = {
        id: `${Date.now()}`,
        type: 'workflow',
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );


  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const updateNodePositions = useCallback(() => {
    // Update handle positions based on flow direction
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          flowDirection,
        },
      }))
    );
  }, [flowDirection, setNodes]);

  React.useEffect(() => {
    updateNodePositions();
  }, [flowDirection, updateNodePositions]);

  React.useEffect(() => {
    onSave(nodes, edges);
  }, [nodes, edges, onSave]);

  // Save zoom and viewport preference
  const saveViewportPreference = useCallback((newViewport: any) => {
    setViewport(newViewport);
    setZoom(newViewport.zoom);
    // Save to localStorage
    localStorage.setItem('workflowZoom', newViewport.zoom.toString());
    localStorage.setItem('workflowViewport', JSON.stringify(newViewport));
  }, []);

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  const onMove = useCallback((event: any, newViewport: any) => {
    saveViewportPreference(newViewport);
  }, [saveViewportPreference]);

  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        {/* Left Sidebar */}
        <WorkflowSidebarEnhanced />

        {/* Main Flow Area */}
        <div className="flex-1 relative h-full w-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={(instance) => {
                setReactFlowInstance(instance);
                // Apply saved viewport on initialization
                if (initialViewport) {
                  instance.setViewport(initialViewport);
                }
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onMove={onMove}
              nodeTypes={nodeTypes}
              fitView={false}
              defaultViewport={initialViewport}
              className="bg-background"
            >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1}
            color="#e5e5e5"
          />
          <Controls className="bg-background border rounded-lg shadow-md" />
            </ReactFlow>

            {/* Flow Direction Toggle */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Card className="p-2 glass backdrop-blur-lg">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={flowDirection === 'TB' ? 'default' : 'outline'}
                    onClick={() => setFlowDirection('TB')}
                    className="h-8"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Top-Bottom
                  </Button>
                  <Button
                    size="sm"
                    variant={flowDirection === 'LR' ? 'default' : 'outline'}
                    onClick={() => setFlowDirection('LR')}
                    className="h-8"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Left-Right
                  </Button>
                </div>
              </Card>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Card className="p-2 glass backdrop-blur-lg">
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleZoomIn}
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleZoomOut}
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleFitView}
                    className="h-8 w-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
              <Card className="p-2 glass backdrop-blur-lg">
                <div className="text-xs text-center font-mono">
                  {Math.round(viewport.zoom * 100)}%
                </div>
              </Card>
            </div>
          </div>
        </div>
    </ReactFlowProvider>
  );
}