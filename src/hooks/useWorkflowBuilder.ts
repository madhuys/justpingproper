import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Node,
  Edge,
  Connection,
  useReactFlow,
  ReactFlowInstance,
  XYPosition,
  MarkerType,
  useKeyPress,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

interface UseWorkflowBuilderOptions {
  onSave?: (state: WorkflowState) => void;
  onLoad?: () => WorkflowState | null;
  proximityThreshold?: number;
  autoSaveInterval?: number;
  flowDirection?: 'TB' | 'LR';
}

export const useWorkflowBuilder = ({
  onSave,
  onLoad,
  proximityThreshold = 100,
  autoSaveInterval = 30000, // 30 seconds
  flowDirection = 'TB',
}: UseWorkflowBuilderOptions = {}) => {
  const reactFlowInstance = useReactFlow();
  const { toast } = useToast();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [copiedNode, setCopiedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const proximityCheckRef = useRef<NodeJS.Timeout>();

  // Keyboard shortcuts
  const ctrlPressed = useKeyPress('Control');
  const deletePressed = useKeyPress('Delete');
  const cPressed = useKeyPress('c');
  const vPressed = useKeyPress('v');
  const dPressed = useKeyPress('d');
  const sPressed = useKeyPress('s');

  // Load workflow state on mount
  useEffect(() => {
    if (onLoad) {
      const savedState = onLoad();
      if (savedState) {
        setNodes(savedState.nodes);
        setEdges(savedState.edges);
        if (savedState.viewport && reactFlowInstance) {
          reactFlowInstance.setViewport(savedState.viewport);
        }
      }
    }
  }, [onLoad, reactFlowInstance]);

  // Auto-save workflow
  useEffect(() => {
    if (!onSave || !autoSaveInterval) return;

    const saveWorkflow = () => {
      const viewport = reactFlowInstance?.getViewport();
      if (viewport) {
        onSave({ nodes, edges, viewport });
      }
    };

    autoSaveTimeoutRef.current = setInterval(saveWorkflow, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearInterval(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, onSave, autoSaveInterval, reactFlowInstance]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (deletePressed && selectedNodes.length > 0) {
      deleteNodes(selectedNodes);
    }

    if (ctrlPressed && cPressed && selectedNodes.length === 1) {
      const node = nodes.find((n) => n.id === selectedNodes[0]);
      if (node) {
        copyNode(node);
      }
    }

    if (ctrlPressed && vPressed && copiedNode) {
      pasteNode();
    }

    if (ctrlPressed && dPressed && selectedNodes.length === 1) {
      const node = nodes.find((n) => n.id === selectedNodes[0]);
      if (node) {
        duplicateNode(node);
      }
    }

    if (ctrlPressed && sPressed) {
      saveWorkflow();
    }
  }, [ctrlPressed, deletePressed, cPressed, vPressed, dPressed, sPressed, selectedNodes, copiedNode, nodes]);

  // Connection validation with proximity detection
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Check if connection already exists
      const existingEdge = edges.find(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle
      );

      return !existingEdge;
    },
    [edges]
  );

  // Create edge with proper styling based on flow direction
  const createEdge = useCallback(
    (params: Connection | Edge): Edge => {
      const id = 'id' in params ? params.id : `e${params.source}-${params.target}`;
      
      return {
        ...params,
        id,
        type: 'floating',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: '#64748b',
        },
        animated: false,
      } as Edge;
    },
    []
  );

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => [...eds, createEdge(params)]);
        toast({
          title: 'Connection created',
          description: 'Nodes connected successfully',
        });
      }
    },
    [createEdge, isValidConnection, toast]
  );

  // Proximity-based auto-connection
  const checkProximity = useCallback(
    (draggedNodeId: string) => {
      const draggedNode = nodes.find((n) => n.id === draggedNodeId);
      if (!draggedNode) return;

      const nearbyNodes = nodes.filter((node) => {
        if (node.id === draggedNodeId) return false;
        
        const distance = Math.sqrt(
          Math.pow(node.position.x - draggedNode.position.x, 2) +
          Math.pow(node.position.y - draggedNode.position.y, 2)
        );
        
        return distance < proximityThreshold;
      });

      // Highlight nearby nodes
      nearbyNodes.forEach((node) => {
        setHoveredNode(node.id);
      });

      // Auto-connect if very close
      const veryCloseNode = nearbyNodes.find((node) => {
        const distance = Math.sqrt(
          Math.pow(node.position.x - draggedNode.position.x, 2) +
          Math.pow(node.position.y - draggedNode.position.y, 2)
        );
        return distance < proximityThreshold / 2;
      });

      if (veryCloseNode) {
        const connection = {
          source: flowDirection === 'TB' ? draggedNodeId : veryCloseNode.id,
          target: flowDirection === 'TB' ? veryCloseNode.id : draggedNodeId,
          sourceHandle: null,
          targetHandle: null,
        };

        if (isValidConnection(connection)) {
          onConnect(connection);
        }
      }
    },
    [nodes, proximityThreshold, flowDirection, isValidConnection, onConnect]
  );

  // Node manipulation functions
  const addNode = useCallback(
    (type: string, position: XYPosition) => {
      const id = uuidv4();
      const newNode: Node = {
        id,
        type,
        position,
        data: { label: `${type} ${nodes.length + 1}` },
      };
      
      setNodes((nds) => [...nds, newNode]);
      return id;
    },
    [nodes.length]
  );

  const deleteNodes = useCallback(
    (nodeIds: string[]) => {
      setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
      setEdges((eds) =>
        eds.filter(
          (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
        )
      );
      setSelectedNodes([]);
      
      toast({
        title: 'Nodes deleted',
        description: `${nodeIds.length} node(s) deleted`,
      });
    },
    [toast]
  );

  const duplicateNode = useCallback(
    (node: Node) => {
      const newNode: Node = {
        ...node,
        id: uuidv4(),
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
      
      toast({
        title: 'Node duplicated',
        description: 'Node duplicated successfully',
      });
      
      return newNode.id;
    },
    [toast]
  );

  const copyNode = useCallback(
    (node: Node) => {
      setCopiedNode(node);
      toast({
        title: 'Node copied',
        description: 'Node copied to clipboard',
      });
    },
    [toast]
  );

  const pasteNode = useCallback(() => {
    if (!copiedNode) return;
    
    const viewport = reactFlowInstance?.getViewport();
    const position = viewport
      ? {
          x: -viewport.x / viewport.zoom + 100,
          y: -viewport.y / viewport.zoom + 100,
        }
      : { x: 100, y: 100 };
    
    const newNode: Node = {
      ...copiedNode,
      id: uuidv4(),
      position,
    };
    
    setNodes((nds) => [...nds, newNode]);
    
    toast({
      title: 'Node pasted',
      description: 'Node pasted from clipboard',
    });
  }, [copiedNode, reactFlowInstance, toast]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, []);

  const saveWorkflow = useCallback(() => {
    if (!onSave) return;
    
    const viewport = reactFlowInstance?.getViewport();
    if (viewport) {
      onSave({ nodes, edges, viewport });
      toast({
        title: 'Workflow saved',
        description: 'Your workflow has been saved successfully',
      });
    }
  }, [nodes, edges, onSave, reactFlowInstance, toast]);

  // Node event handlers
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setIsDragging(true);
    setSelectedNodes([node.id]);
  }, []);

  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (proximityCheckRef.current) {
        clearTimeout(proximityCheckRef.current);
      }
      
      proximityCheckRef.current = setTimeout(() => {
        checkProximity(node.id);
      }, 100);
    },
    [checkProximity]
  );

  const onNodeDragStop = useCallback(() => {
    setIsDragging(false);
    setHoveredNode(null);
    
    if (proximityCheckRef.current) {
      clearTimeout(proximityCheckRef.current);
    }
  }, []);

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      // Apply changes to nodes
      return changes.reduce((acc: Node[], change: any) => {
        if (change.type === 'remove') {
          return acc.filter((n) => n.id !== change.id);
        }
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedNodes((prev) => [...prev, change.id]);
          } else {
            setSelectedNodes((prev) => prev.filter((id) => id !== change.id));
          }
        }
        return acc.map((n) => {
          if (n.id === change.id) {
            switch (change.type) {
              case 'position':
                return { ...n, position: change.position };
              case 'dimensions':
                return { ...n, width: change.dimensions.width, height: change.dimensions.height };
              default:
                return n;
            }
          }
          return n;
        });
      }, nds);
    });
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      return changes.reduce((acc: Edge[], change: any) => {
        if (change.type === 'remove') {
          return acc.filter((e) => e.id !== change.id);
        }
        return acc;
      }, eds);
    });
  }, []);

  return {
    nodes,
    edges,
    selectedNodes,
    hoveredNode,
    isDragging,
    onConnect,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    addNode,
    deleteNodes,
    duplicateNode,
    copyNode,
    pasteNode,
    updateNodeData,
    saveWorkflow,
    isValidConnection,
  };
};