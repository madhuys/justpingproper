import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ReactFlow, {
  ReactFlowProvider,
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
  MiniMap,
  Panel,
  useReactFlow,
  useStoreApi,
  useKeyPress,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  ConnectionMode,
  reconnectEdge,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './workflow-touch.css';
import { EnhancedWorkflowNodeV2, WorkflowNodeData } from './EnhancedWorkflowNodeV2';
import { WorkflowSidebarEnhanced } from './WorkflowSidebarEnhanced';
import { FlowDirectionConnectionLine } from './FlowDirectionConnectionLine';
import CustomEdge from './CustomEdge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Save,
  FolderOpen,
  Copy,
  Trash2,
  X,
  ArrowUpDown,
  ArrowLeftRight,
  Home,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Magnet,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Columns,
  Rows,
  MessageSquare,
  FileText,
  Zap,
  GitBranch,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Define node types and edge types outside component to prevent React Flow warnings
const nodeTypes = {
  workflow: EnhancedWorkflowNodeV2,
} as const;

const edgeTypes = {
  custom: CustomEdge,
} as const;

const initialNodes: Node<WorkflowNodeData>[] = [
  {
    id: '1',
    type: 'workflow',
    position: { x: 50, y: 200 }, // Better starting position for LR flow
    data: {
      label: 'Start',
      type: 'start',
      prompt: 'Conversation begins here',
      flowDirection: 'LR',
    },
  },
];

const getDefaultEdgeOptions = (flowDirection: 'TB' | 'LR' = 'TB') => ({
  type: 'custom',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
  },
  style: {
    strokeWidth: 2,
    stroke: '#6366f1',
    zIndex: 999,
  },
  sourcePosition: flowDirection === 'LR' ? Position.Right : Position.Bottom,
  targetPosition: flowDirection === 'LR' ? Position.Left : Position.Top,
  zIndex: 999,
});

interface EnhancedWorkflowBuilderV2Props {
  onSave: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
  onNodeSelect: (node: Node<WorkflowNodeData>) => void;
  onNodeUpdate?: (updateFn: (node: Node<WorkflowNodeData>) => void) => void;
  workflowId?: string;
  initialNodes?: Node<WorkflowNodeData>[];
  initialEdges?: Edge[];
}

const NODE_WIDTH = 280;
const NODE_HEIGHT = 100; // Approximate minimum height
const HORIZONTAL_GAP = 80; // Gap between nodes horizontally
const VERTICAL_GAP = 50; // Gap between nodes vertically

// Helper function to snap position to grid
const snapToGridHelper = (position: { x: number; y: number }, gridSize: number): { x: number; y: number } => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

function FlowComponent({ 
  onSave, 
  onNodeSelect,
  onNodeUpdate,
  workflowId = 'default',
  initialNodes: externalNodes,
  initialEdges: externalEdges
}: EnhancedWorkflowBuilderV2Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    getIntersectingNodes,
    getNodes,
    setViewport,
    getEdges,
    deleteElements,
    project,
    screenToFlowPosition,
    fitView
  } = useReactFlow();
  const store = useStoreApi();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // This needs to be defined after handleCustomNodeDrop
  // Moved to after the handleCustomNodeDrop definition
  
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes && externalNodes.length > 0 ? externalNodes : initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges || []);
  const [flowDirection, setFlowDirection] = useState<'TB' | 'LR'>('LR'); // Default to LR
  
  // Update nodes and edges when external props change
  useEffect(() => {
    if (externalNodes && externalNodes.length > 0 && JSON.stringify(externalNodes) !== JSON.stringify(nodes)) {
      // Check if nodes need spacing adjustment
      const adjustedNodes = [...externalNodes];
      const needsAdjustment = adjustedNodes.some((node, index) => {
        for (let j = index + 1; j < adjustedNodes.length; j++) {
          const xOverlap = Math.abs(node.position.x - adjustedNodes[j].position.x) < NODE_WIDTH;
          const yOverlap = Math.abs(node.position.y - adjustedNodes[j].position.y) < NODE_HEIGHT;
          if (xOverlap && yOverlap) {
            return true;
          }
        }
        return false;
      });
      
      if (needsAdjustment) {
        // Auto-layout nodes with proper spacing
        const startNode = adjustedNodes.find(n => n.data?.type === 'start');
        if (startNode) {
          const visited = new Set<string>();
          const queue: { node: Node<WorkflowNodeData>, depth: number, branch: number }[] = [
            { node: startNode, depth: 0, branch: 0 }
          ];
          visited.add(startNode.id);
          
          while (queue.length > 0) {
            const { node, depth, branch } = queue.shift()!;
            
            // Set position based on depth and branch
            if (flowDirection === 'LR') {
              node.position.x = 50 + depth * (NODE_WIDTH + HORIZONTAL_GAP);
              node.position.y = 200 + branch * (NODE_HEIGHT + VERTICAL_GAP);
            } else {
              node.position.x = 50 + branch * (NODE_WIDTH + HORIZONTAL_GAP);
              node.position.y = 50 + depth * (NODE_HEIGHT + VERTICAL_GAP);
            }
            
            // Find connected nodes
            const connectedEdges = (externalEdges || []).filter(e => e.source === node.id);
            connectedEdges.forEach((edge, index) => {
              const targetNode = adjustedNodes.find(n => n.id === edge.target);
              if (targetNode && !visited.has(targetNode.id)) {
                visited.add(targetNode.id);
                queue.push({ 
                  node: targetNode, 
                  depth: depth + 1, 
                  branch: branch + index 
                });
              }
            });
          }
        }
      }
      
      setNodes(adjustedNodes);
    }
  }, [externalNodes, externalEdges, flowDirection]);
  
  useEffect(() => {
    if (externalEdges && externalEdges.length > 0 && JSON.stringify(externalEdges) !== JSON.stringify(edges)) {
      setEdges(externalEdges);
    }
  }, [externalEdges]);
  
  
  // Remove auto-save to prevent infinite loop - onSave should only be called explicitly
  
  // Load saved zoom and viewport from localStorage
  const savedViewport = typeof window !== 'undefined' ? localStorage.getItem(`workflow-viewport-${workflowId}`) : null;
  const initialViewport = savedViewport ? JSON.parse(savedViewport) : { x: 0, y: 0, zoom: 1 }; // Default zoom to 100%
  
  const [zoom, setZoom] = useState(initialViewport.zoom);
  const [viewport, setLocalViewport] = useState(initialViewport);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20; // Grid size in pixels
  const [nodePopoverOpen, setNodePopoverOpen] = useState(false);
  const [nodePopoverPosition, setNodePopoverPosition] = useState({ x: 0, y: 0 });
  const [pendingConnection, setPendingConnection] = useState<any>(null);
  const edgeReconnectSuccessful = useRef(true);
  const connectionInProgress = useRef(false);

  // Keyboard shortcuts
  const deleteKey = useKeyPress(['Delete', 'Backspace']);
  const ctrlC = useKeyPress(['Meta+c', 'Control+c']);
  const ctrlV = useKeyPress(['Meta+v', 'Control+v']);
  const ctrlD = useKeyPress(['Meta+d', 'Control+d']);
  const ctrlS = useKeyPress(['Meta+s', 'Control+s']);
  const escapeKey = useKeyPress(['Escape']);

  const [copiedNodes, setCopiedNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Close popover on ESC
  useEffect(() => {
    if (escapeKey && nodePopoverOpen) {
      setNodePopoverOpen(false);
      setPendingConnection(null);
    }
  }, [escapeKey, nodePopoverOpen]);

  // Check theme
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Helper function to check if adding an edge would create a cycle
  const wouldCreateCycle = useCallback((source: string, target: string) => {
    const nodes = getNodes();
    const currentEdges = getEdges();
    
    // Create adjacency list
    const adjacencyList: Record<string, string[]> = {};
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    // Add existing edges
    currentEdges.forEach(edge => {
      if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
      adjacencyList[edge.source].push(edge.target);
    });
    
    // Add the proposed edge
    if (!adjacencyList[source]) adjacencyList[source] = [];
    adjacencyList[source].push(target);
    
    // DFS to detect cycle
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = adjacencyList[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    // Check all nodes (handles disconnected components)
    for (const nodeId of Object.keys(adjacencyList)) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) return true;
      }
    }
    
    return false;
  }, [getNodes, getEdges]);

  // Custom connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;
    
    // Prevent self-connections
    if (connection.source === connection.target) {
      toast.error('Cannot connect a node to itself');
      return false;
    }
    
    // Check for duplicate connections
    const existingEdge = edges.find(
      edge => edge.source === connection.source && edge.target === connection.target
    );
    if (existingEdge) {
      toast.error('Connection already exists');
      return false;
    }
    
    // Get source and target nodes
    const nodes = getNodes();
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Prevent connecting to start node
    if (targetNode.data?.type === 'start') {
      toast.error('Cannot connect to start node');
      return false;
    }
    
    // Prevent connecting from end node
    if (sourceNode.data?.type === 'end') {
      toast.error('Cannot connect from end node');
      return false;
    }
    
    // Check for cycles
    if (wouldCreateCycle(connection.source, connection.target)) {
      toast.error('Connection would create a circular flow');
      return false;
    }
    
    // Enforce connection rules based on node types
    const sourceType = sourceNode.data?.type;
    const targetType = targetNode.data?.type;
    
    // Basic rule: One edge per handle can only originate one single connector line
    // Check if this specific source handle already has an outgoing connection
    const handleId = connection.sourceHandle || 'output';
    const existingFromThisHandle = edges.some(edge => 
      edge.source === connection.source && 
      (edge.sourceHandle || 'output') === handleId
    );
    
    if (existingFromThisHandle) {
      toast.error('This output handle already has a connection');
      return false;
    }
    
    // Validate logical flow direction
    if (flowDirection === 'LR') {
      if (sourceNode.position.x > targetNode.position.x + 100) {
        toast('Connection goes against flow direction', { icon: '⚠️' });
      }
    } else {
      if (sourceNode.position.y > targetNode.position.y + 100) {
        toast('Connection goes against flow direction', { icon: '⚠️' });
      }
    }
    
    return true;
  }, [edges, getNodes, wouldCreateCycle, flowDirection]);

  const onConnectStart = useCallback((event: any, { nodeId, handleId, handleType }: any) => {
    // Reset connection made flag
    connectionMadeRef.current = false;
    
    // Check if this handle already has an outgoing connection
    if (handleType === 'source') {
      const existingOutgoingEdge = edges.find(edge => 
        edge.source === nodeId && 
        edge.sourceHandle === (handleId || 'output')
      );
      
      if (existingOutgoingEdge) {
        // Prevent starting the connection
        toast.error('This output already has a connection');
        return false;
      }
    }
    
    connectionInProgress.current = true;
  }, [edges]);

  // Track if a connection was just made
  const connectionMadeRef = useRef(false);
  
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      if (!isValidConnection(params)) {
        // Don't reset connectionInProgress here - let onConnectEnd handle it
        return; // isValidConnection already shows appropriate error messages
      }
      
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        ...getDefaultEdgeOptions(flowDirection),
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Mark that a connection was successfully made
      connectionMadeRef.current = true;
      
      toast.success('Nodes connected');
    },
    [setEdges, isValidConnection, flowDirection]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    onNodeSelect(node);
  }, [onNodeSelect]);
  
  // Provide a way to update nodes from parent
  const updateNodeFromParent = useCallback((updatedNode: Node<WorkflowNodeData>) => {
    setNodes(nds => nds.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
  }, [setNodes]);
  
  // Pass the update function to parent
  useEffect(() => {
    if (onNodeUpdate) {
      onNodeUpdate(updateNodeFromParent);
    }
  }, [onNodeUpdate, updateNodeFromParent]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      let position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Apply snap to grid if enabled
      if (snapToGrid) {
        position = snapToGridHelper(position, gridSize);
      }

      const nodeData = JSON.parse(type);
      // Check for nodes at this position and offset if needed
      const existingNodes = getNodes();
      let finalPosition = position;
      
      // Check if position overlaps with existing nodes
      const isOverlapping = existingNodes.some(node => {
        const xOverlap = Math.abs(node.position.x - finalPosition.x) < NODE_WIDTH;
        const yOverlap = Math.abs(node.position.y - finalPosition.y) < NODE_HEIGHT;
        return xOverlap && yOverlap;
      });
      
      if (isOverlapping) {
        // Find a better position
        if (flowDirection === 'LR') {
          finalPosition.x += NODE_WIDTH + HORIZONTAL_GAP;
        } else {
          finalPosition.y += NODE_HEIGHT + VERTICAL_GAP;
        }
      }

      const newNode: Node<WorkflowNodeData> = {
        id: `node-${Date.now()}`,
        type: 'workflow',
        position: finalPosition,
        data: {
          ...nodeData,
          flowDirection: flowDirection, // Use current flow direction
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, flowDirection, setNodes, snapToGrid, gridSize]
  );

  // Custom drop handler for touch events
  const handleCustomNodeDrop = useCallback(
    (event: CustomEvent) => {
      const { nodeData, clientX, clientY } = event.detail;
      if (!nodeData) return;

      let position = screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      // Apply snap to grid if enabled
      if (snapToGrid) {
        position = snapToGridHelper(position, gridSize);
      }

      // Check for nodes at this position and offset if needed
      const existingNodes = getNodes();
      let finalPosition = position;
      
      // Check if position overlaps with existing nodes
      const isOverlapping = existingNodes.some(node => {
        const xOverlap = Math.abs(node.position.x - finalPosition.x) < NODE_WIDTH;
        const yOverlap = Math.abs(node.position.y - finalPosition.y) < NODE_HEIGHT;
        return xOverlap && yOverlap;
      });
      
      if (isOverlapping) {
        // Find a better position
        if (flowDirection === 'LR') {
          finalPosition.x += NODE_WIDTH + HORIZONTAL_GAP;
        } else {
          finalPosition.y += NODE_HEIGHT + VERTICAL_GAP;
        }
      }

      const newNode: Node<WorkflowNodeData> = {
        id: `node-${Date.now()}`,
        type: 'workflow',
        position: finalPosition,
        data: {
          ...nodeData,
          flowDirection: flowDirection, // Use current flow direction
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, flowDirection, setNodes, snapToGrid, gridSize]
  );

  // Listen for custom drop events from touch drag
  useEffect(() => {
    const wrapper = document.querySelector('.react-flow__wrapper');
    if (!wrapper) return;

    const handleDrop = (event: Event) => {
      handleCustomNodeDrop(event as CustomEvent);
    };

    wrapper.addEventListener('customNodeDrop', handleDrop);
    return () => {
      wrapper.removeEventListener('customNodeDrop', handleDrop);
    };
  }, [handleCustomNodeDrop]);

  // Add node on edge drop - React Flow v11 compatible
  const onConnectEnd = useCallback(
    (event: any) => {
      // Always reset connectionInProgress when connection ends
      const wasConnecting = connectionInProgress.current;
      connectionInProgress.current = false;
      
      // If a connection was just made, don't show popover
      if (connectionMadeRef.current) {
        connectionMadeRef.current = false;
        return;
      }
      
      // If no connection was in progress, exit
      if (!wasConnecting) {
        return;
      }
      
      // Access connection state from React Flow store
      const storeState = store.getState();
      const { connectionNodeId, connectionHandleId, connectionHandleType } = storeState;
      
      // Check if we have a valid connection state
      if (!connectionNodeId) {
        return;
      }
      
      // Find the source node
      const sourceNode = storeState.getNodes().find(node => node.id === connectionNodeId);
      if (!sourceNode) {
        return;
      }
      
      // Check if source node already has an outgoing connection from this handle
      const sourceHandle = connectionHandleId || 'output';
      const existingOutgoingEdge = edges.find(edge => 
        edge.source === connectionNodeId && 
        (edge.sourceHandle || 'output') === sourceHandle
      );
      
      // If there's already an outgoing connection from this handle, don't show popover
      if (existingOutgoingEdge) {
        return;
      }
      
      // Check if we're dropping on a valid target
      const targetElement = event.target as HTMLElement;
      const targetIsHandle = targetElement.classList?.contains('react-flow__handle');
      const targetNode = targetElement.closest('.react-flow__node');
      
      // Check if we're over any React Flow element (pane, viewport, etc)
      const isOverReactFlow = targetElement.closest('.react-flow__viewport') || 
                             targetElement.closest('.react-flow__pane') ||
                             targetElement.classList?.contains('react-flow__edge') ||
                             targetElement.closest('.react-flow');
      
      // Only show popover if dropping on empty space (not on handle or node)
      if (!targetIsHandle && !targetNode && isOverReactFlow) {
        // Get mouse position relative to the workflow container
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) {
          return;
        }
        
        // Handle both mouse and touch events
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
          // Touch event
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
          // Touch end event
          clientX = event.changedTouches[0].clientX;
          clientY = event.changedTouches[0].clientY;
        } else {
          // Mouse event
          clientX = event.clientX;
          clientY = event.clientY;
        }
        
        const popoverX = clientX - bounds.left;
        const popoverY = clientY - bounds.top;
        
        // Store the connection state and show popover
        const connectionState = {
          fromNode: sourceNode,
          fromHandle: {
            id: connectionHandleId || 'output',
            type: connectionHandleType || 'source'
          }
        };
        
        setPendingConnection(connectionState);
        setNodePopoverPosition({ x: popoverX, y: popoverY });
        setNodePopoverOpen(true);
      }
    },
    [store, reactFlowWrapper]
  );

  // Create node from popover selection
  const createNodeFromPopover = useCallback(
    (nodeType: WorkflowNodeData['type'], label: string, inputType?: string) => {
      if (!pendingConnection) return null;

      const id = `node-${Date.now()}`;
      let position = screenToFlowPosition({
        x: nodePopoverPosition.x,
        y: nodePopoverPosition.y,
      });

      // Apply snap to grid if enabled
      if (snapToGrid) {
        position = snapToGridHelper(position, gridSize);
      }
      
      // Add offset to prevent overlapping with source node
      if (pendingConnection.fromNode) {
        const sourcePos = pendingConnection.fromNode.position;
        if (flowDirection === 'LR') {
          position.x = sourcePos.x + NODE_WIDTH + HORIZONTAL_GAP; // Node width + gap
          position.y = sourcePos.y; // Align vertically
        } else {
          position.x = sourcePos.x; // Align horizontally
          position.y = sourcePos.y + NODE_HEIGHT + VERTICAL_GAP; // Node height + gap
        }
      }

      const newNode: Node<WorkflowNodeData> = {
        id,
        type: 'workflow',
        position,
        data: {
          label,
          type: nodeType,
          flowDirection,
          ...(inputType && { inputType: inputType as 'text' | 'choice' | 'multiselect' }),
          ...(nodeType === 'branch' && { branchCount: 2 }), // Default to 2 branches
        },
      };

      setNodes((nds) => nds.concat(newNode));
      
      if (pendingConnection.fromNode) {
        const newEdge = {
          id: `edge-${pendingConnection.fromNode.id}-${id}-${Date.now()}`,
          source: pendingConnection.fromNode.id,
          sourceHandle: pendingConnection.fromHandle?.id || 'output',
          target: id,
          targetHandle: null, // Let React Flow determine the best handle
          ...getDefaultEdgeOptions(flowDirection),
          animated: true,
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }

      // Close popover and reset
      setNodePopoverOpen(false);
      setPendingConnection(null);
      connectionInProgress.current = false;
      
      return newNode;
    },
    [pendingConnection, nodePopoverPosition, screenToFlowPosition, flowDirection, setNodes, setEdges, snapToGrid, gridSize, store]
  );

  // Removed proximity connect to prevent auto-connecting

  // Node drag - only show intersection highlights
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Intersection detection for visual feedback only
    const intersections = getIntersectingNodes(node).map((n) => n.id);
    
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        className: intersections.includes(n.id) ? 'highlight' : '',
      }))
    );
  }, [getIntersectingNodes, setNodes]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // Clear intersection highlights
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        className: '',
      }))
    );
  }, [setNodes]);

  // Delete selected elements
  useEffect(() => {
    if (deleteKey) {
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedEdges = edges.filter(edge => edge.selected);
      
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        deleteElements({ nodes: selectedNodes, edges: selectedEdges });
      }
    }
  }, [deleteKey, nodes, edges, deleteElements]);

  // Copy nodes
  useEffect(() => {
    if (ctrlC) {
      const selectedNodes = nodes.filter(node => node.selected);
      setCopiedNodes(selectedNodes);
      if (selectedNodes.length > 0) {
        toast.success(`Copied ${selectedNodes.length} node(s)`);
      }
    }
  }, [ctrlC, nodes]);

  // Paste nodes
  useEffect(() => {
    if (ctrlV && copiedNodes.length > 0) {
      const pastedNodes = copiedNodes.map((node, index) => ({
        ...node,
        id: `node-${Date.now()}-${Math.random()}`,
        position: {
          x: node.position.x + (flowDirection === 'LR' ? (NODE_WIDTH + HORIZONTAL_GAP) * (index + 1) : 50 * (index + 1)),
          y: node.position.y + (flowDirection === 'LR' ? 50 * (index + 1) : (NODE_HEIGHT + VERTICAL_GAP) * (index + 1)),
        },
        selected: false,
      }));
      
      setNodes(nds => [...nds, ...pastedNodes]);
      toast.success(`Pasted ${pastedNodes.length} node(s)`);
    }
  }, [ctrlV, copiedNodes, setNodes]);

  // Duplicate nodes
  useEffect(() => {
    if (ctrlD) {
      const selectedNodes = nodes.filter(node => node.selected);
      const duplicatedNodes = selectedNodes.map(node => ({
        ...node,
        id: `node-${Date.now()}-${Math.random()}`,
        position: {
          x: node.position.x + (flowDirection === 'LR' ? NODE_WIDTH + HORIZONTAL_GAP : 50),
          y: node.position.y + (flowDirection === 'LR' ? 50 : NODE_HEIGHT + VERTICAL_GAP),
        },
        selected: false,
      }));
      
      setNodes(nds => [...nds, ...duplicatedNodes]);
      if (duplicatedNodes.length > 0) {
        toast.success(`Duplicated ${duplicatedNodes.length} node(s)`);
      }
    }
  }, [ctrlD, nodes, setNodes]);

  // Save workflow
  useEffect(() => {
    if (ctrlS) {
      saveWorkflow();
    }
  }, [ctrlS]);

  // Handle escape key - close popover or cancel connection
  useEffect(() => {
    if (escapeKey && nodePopoverOpen) {
      setNodePopoverOpen(false);
      setPendingConnection(null);
    }
  }, [escapeKey, nodePopoverOpen]);

  // Update flow direction for all nodes and edges
  const handleFlowDirectionChange = useCallback((newDirection: 'TB' | 'LR') => {
    // Store current nodes and edges
    const currentNodes = nodes;
    const currentEdges = edges;
    
    // Clear all nodes and edges
    setNodes([]);
    setEdges([]);
    
    // Set new flow direction
    setFlowDirection(newDirection);
    
    // Re-add nodes with updated flow direction after a brief delay
    setTimeout(() => {
      setNodes(
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            flowDirection: newDirection,
          },
        }))
      );
      
      setEdges(
        currentEdges.map((edge) => ({
          ...edge,
          type: 'smoothstep',
          sourcePosition: newDirection === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: newDirection === 'LR' ? Position.Left : Position.Top,
        }))
      );
    }, 10);
  }, [nodes, edges, setNodes, setEdges]);

  // Auto-save disabled to prevent continuous file modifications and Fast Refresh
  // User requested: "its fine if fast refresh happening as long as saving is not happening"
  /*
  useEffect(() => {
    // Skip initial render
    if (nodes.length === 0 && edges.length === 0) return;
    
    // Mark as unsaved immediately
    setSaveStatus('unsaved');
    
    // Debounce saves
    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      onSave(nodes, edges);
      
      // Also save to file system if workflowId is provided
      if (workflowId && workflowId !== 'new-workflow' && workflowId !== 'default') {
        const saveToFileSystem = async () => {
          try {
            const workflow = {
              id: workflowId,
              name: `Workflow ${workflowId}`,
              nodes,
              edges,
              viewport,
              flowDirection,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await fetch(`/api/workflows/${workflowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(workflow),
            });
            
            setSaveStatus('saved');
          } catch (error) {
            console.error('Failed to save workflow to file system:', error);
            setSaveStatus('unsaved');
          }
        };
        
        saveToFileSystem();
      } else {
        setSaveStatus('saved');
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onSave, workflowId, viewport, flowDirection]);
  */

  // Save viewport preference
  const saveViewportPreference = useCallback((newViewport: any) => {
    setLocalViewport(newViewport);
    setZoom(newViewport.zoom);
    localStorage.setItem(`workflow-viewport-${workflowId}`, JSON.stringify(newViewport));
  }, [workflowId]);

  const handleZoomIn = useCallback(() => {
    const state = store.getState();
    const currentZoom = state.transform[2]; // z is the zoom level in the transform array
    const newZoom = Math.min(currentZoom * 1.2, 2); // Max zoom 2
    const currentViewport = { 
      x: state.transform[0], 
      y: state.transform[1], 
      zoom: newZoom 
    };
    setViewport(currentViewport);
    setZoom(newZoom);
    saveViewportPreference(currentViewport);
  }, [setViewport, saveViewportPreference]);

  const handleZoomOut = useCallback(() => {
    const state = store.getState();
    const currentZoom = state.transform[2]; // z is the zoom level in the transform array
    const newZoom = Math.max(currentZoom / 1.2, 0.1); // Min zoom 0.1
    const currentViewport = { 
      x: state.transform[0], 
      y: state.transform[1], 
      zoom: newZoom 
    };
    setViewport(currentViewport);
    setZoom(newZoom);
    saveViewportPreference(currentViewport);
  }, [setViewport, saveViewportPreference]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleReturnToStart = () => {
    const startNode = nodes.find(node => node.data.type === 'start');
    if (startNode) {
      setViewport({ x: -startNode.position.x + 100, y: -startNode.position.y + 200, zoom: 1 }, { duration: 800 });
    } else {
      // If no start node, go to center
      setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
    }
  };
  
  // Get selected nodes
  const getSelectedNodes = useCallback(() => {
    return nodes.filter(node => node.selected);
  }, [nodes]);
  
  // Alignment functions
  const alignNodes = useCallback((alignment: 'top' | 'bottom' | 'left' | 'right' | 'center-h' | 'center-v') => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 2) {
      toast.error('Select at least 2 nodes to align');
      return;
    }
    
    let alignmentValue: number;
    
    switch (alignment) {
      case 'left':
        alignmentValue = Math.min(...selectedNodes.map(n => n.position.x));
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, x: alignmentValue } } : node
        ));
        break;
      case 'right':
        const maxRight = Math.max(...selectedNodes.map(n => n.position.x + NODE_WIDTH));
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, x: maxRight - NODE_WIDTH } } : node
        ));
        break;
      case 'top':
        alignmentValue = Math.min(...selectedNodes.map(n => n.position.y));
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, y: alignmentValue } } : node
        ));
        break;
      case 'bottom':
        const maxBottom = Math.max(...selectedNodes.map(n => n.position.y + (n.height || NODE_HEIGHT)));
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, y: maxBottom - (node.height || NODE_HEIGHT) } } : node
        ));
        break;
      case 'center-h':
        const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x + NODE_WIDTH / 2, 0) / selectedNodes.length;
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, x: avgX - NODE_WIDTH / 2 } } : node
        ));
        break;
      case 'center-v':
        const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y + (n.height || NODE_HEIGHT) / 2, 0) / selectedNodes.length;
        setNodes(nodes => nodes.map(node => 
          node.selected ? { ...node, position: { ...node.position, y: avgY - (node.height || NODE_HEIGHT) / 2 } } : node
        ));
        break;
    }
    
    toast.success(`Nodes aligned ${alignment}`);
  }, [getSelectedNodes, setNodes]);
  
  // Distribution functions
  const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 3) {
      toast.error('Select at least 3 nodes to distribute');
      return;
    }
    
    // Sort nodes by position
    const sortedNodes = [...selectedNodes].sort((a, b) => 
      direction === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
    );
    
    if (direction === 'horizontal') {
      const leftmost = sortedNodes[0].position.x;
      const rightmost = sortedNodes[sortedNodes.length - 1].position.x;
      const spacing = (rightmost - leftmost) / (sortedNodes.length - 1);
      
      setNodes(nodes => nodes.map(node => {
        const index = sortedNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          return { ...node, position: { ...node.position, x: leftmost + spacing * index } };
        }
        return node;
      }));
    } else {
      const topmost = sortedNodes[0].position.y;
      const bottommost = sortedNodes[sortedNodes.length - 1].position.y;
      const spacing = (bottommost - topmost) / (sortedNodes.length - 1);
      
      setNodes(nodes => nodes.map(node => {
        const index = sortedNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          return { ...node, position: { ...node.position, y: topmost + spacing * index } };
        }
        return node;
      }));
    }
    
    toast.success(`Nodes distributed ${direction}ly`);
  }, [getSelectedNodes, setNodes]);

  const onMove = useCallback((event: any, newViewport: any) => {
    saveViewportPreference(newViewport);
  }, [saveViewportPreference]);

  // Validate workflow structure
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // Check for start node
    const startNodes = nodes.filter(n => n.data?.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have a start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node');
    }
    
    // Check for end node
    const endNodes = nodes.filter(n => n.data?.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have an end node');
    } else if (endNodes.length > 1) {
      errors.push('Workflow can only have one end node');
    }
    
    // Check for orphaned nodes (not connected)
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const orphanedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && 
      node.data?.type !== 'start' // Start node can be unconnected initially
    );
    
    if (orphanedNodes.length > 0) {
      errors.push(`${orphanedNodes.length} node(s) are not connected`);
    }
    
    // Check if all paths lead to end
    if (startNodes.length === 1 && endNodes.length === 1) {
      const startId = startNodes[0].id;
      const endId = endNodes[0].id;
      const reachableFromStart = new Set<string>();
      const queue = [startId];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        reachableFromStart.add(current);
        
        edges.filter(e => e.source === current).forEach(edge => {
          if (!reachableFromStart.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      }
      
      if (!reachableFromStart.has(endId)) {
        errors.push('End node is not reachable from start node');
      }
    }
    
    return errors;
  }, [nodes, edges]);

  // Highlight nodes with errors
  const highlightErrors = useCallback((errorMessages: string[]) => {
    setNodes((nds) => nds.map(node => {
      let hasError = false;
      let errorMessage = '';
      
      // Check for orphaned nodes
      const connectedNodeIds = new Set<string>();
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      
      if (!connectedNodeIds.has(node.id) && node.data?.type !== 'start') {
        hasError = true;
        errorMessage = 'Node is not connected';
      }
      
      return {
        ...node,
        data: {
          ...node.data,
          hasError,
          errorMessage
        }
      };
    }));
  }, [edges, setNodes]);

  // Clear error highlights
  const clearErrorHighlights = useCallback(() => {
    setNodes((nds) => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        hasError: false,
        errorMessage: ''
      }
    })));
  }, [setNodes]);

  const saveWorkflow = useCallback(async () => {
    // Clear previous error highlights
    clearErrorHighlights();
    
    // Validate workflow first
    const errors = validateWorkflow();
    if (errors.length > 0) {
      highlightErrors(errors);
      toast.error(`Workflow validation failed:\n${errors.join('\n')}`);
      return;
    }
    
    const flow = {
      id: workflowId,
      name: `Workflow ${workflowId}`,
      nodes,
      edges,
      viewport,
      flowDirection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save to localStorage
    localStorage.setItem(`workflow-${workflowId}`, JSON.stringify(flow));
    
    // Also save to file system (this will be handled by the parent component)
    onSave(nodes, edges);
    
    toast.success('Workflow saved!');
  }, [nodes, edges, viewport, workflowId, flowDirection, onSave, validateWorkflow, highlightErrors, clearErrorHighlights]);

  const loadWorkflow = useCallback(() => {
    const saved = localStorage.getItem(`workflow-${workflowId}`);
    if (saved) {
      const flow = JSON.parse(saved);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      if (flow.viewport) {
        setViewport(flow.viewport);
      }
      toast.success('Workflow loaded!');
    }
  }, [workflowId, setNodes, setEdges, setViewport]);

  // Edge reconnection handlers
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    // First validate the new connection
    if (!isValidConnection(newConnection)) {
      edgeReconnectSuccessful.current = false;
      return;
    }
    
    edgeReconnectSuccessful.current = true;
    setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    toast.success('Connection updated');
  }, [setEdges, isValidConnection]);

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success('Edge deleted');
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <WorkflowSidebarEnhanced />

      {/* Main Flow Area */}
      <div className="flex-1 relative h-full w-full overflow-hidden" ref={reactFlowWrapper}>
        {/* Parallax background effect - same as postauth layout */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-75 ease-out"
          style={{
            backgroundImage: theme === 'dark' ? 'url("/images/dark-bg.webp")' : 'url("/images/light-bg.webp")',
            transform: 'scale(1.0)',
            zIndex: 1
          }}
        />
        <div 
          className="absolute inset-0 transition-all duration-75 ease-out"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)',
            zIndex: 2
          }}
        />
        {/* Glassmorphism overlay with 80% opacity */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            zIndex: 3
          }}
        />
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={onNodeClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMove={onMove}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            className={cn("touch-flow bg-transparent", isTouchDevice && "touch-device")}
            defaultEdgeOptions={getDefaultEdgeOptions(flowDirection)}
            connectionLineComponent={(props) => (
              <FlowDirectionConnectionLine {...props} flowDirection={flowDirection} />
            )}
            fitView={false}
            defaultViewport={initialViewport}
            style={{ background: 'transparent' }}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={null} // We handle delete ourselves
          selectionOnDrag
          panOnDrag={isTouchDevice ? true : [1]} // Enable pan on touch devices
          panOnScroll={false}
          zoomOnScroll={!isTouchDevice} // Disable zoom on scroll for touch
          zoomOnPinch={true} // Enable pinch zoom for touch
          zoomOnDoubleClick={false}
          preventScrolling={false}
          autoPanOnNodeDrag={false}
          autoPanOnConnect={false}
          selectionMode={SelectionMode.Partial}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={50}
          elevateEdgesOnSelect={false}
          edgesUpdatable={true}
          edgesFocusable={true}
          snapToGrid={snapToGrid}
          snapGrid={[gridSize, gridSize]}
          selectNodesOnDrag={false} // Prevent selection conflicts on touch
        >
          {showGrid && (
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={gridSize} 
              size={3}
              color={theme === 'light' ? '#3b82f6' : '#93c5fd'}
              style={{ opacity: theme === 'light' ? 0.4 : 0.6 }}
            />
          )}
          <MiniMap 
            nodeColor={node => {
              switch (node.data?.type) {
                case 'start': return '#10b981';
                case 'end': return '#ef4444';
                case 'action': return '#8b5cf6';
                case 'input': return '#3b82f6';
                default: return '#6b7280';
              }
            }}
            className="!bg-transparent"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(127, 127, 127, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            maskColor="var(--muted)"
            nodeStrokeColor={() => 'var(--border)'}
            nodeStrokeWidth={2}
            pannable
            zoomable
            position="bottom-right"
          />
        </ReactFlow>
        </div>

        {/* Flow Direction Toggle and Return to Start */}
        <div className="absolute top-4 left-4 flex flex-col gap-2" style={{ zIndex: 20 }}>
          <Card className="p-2" style={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(127, 127, 127, 0.2)'
          }}>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={flowDirection === 'TB' ? 'default' : 'outline'}
                onClick={() => handleFlowDirectionChange('TB')}
                className="h-8"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Top-Bottom
              </Button>
              <Button
                size="sm"
                variant={flowDirection === 'LR' ? 'default' : 'outline'}
                onClick={() => handleFlowDirectionChange('LR')}
                className="h-8"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Left-Right
              </Button>
            </div>
          </Card>
          <Card className="p-2" style={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(127, 127, 127, 0.2)'
          }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReturnToStart}
              className="h-8 w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Start
            </Button>
          </Card>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 20 }}>
          <Card className="p-2" style={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(127, 127, 127, 0.2)'
          }}>
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
          <Card className="p-2" style={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(127, 127, 127, 0.2)'
          }}>
            <div className="text-xs text-center font-mono">
              {Math.round(zoom * 100)}%
            </div>
          </Card>
          <Card className="p-2" style={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(127, 127, 127, 0.2)'
          }}>
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant={showGrid ? 'default' : 'outline'}
                onClick={() => setShowGrid(!showGrid)}
                className="h-8 w-8"
                title="Toggle Grid"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={snapToGrid ? 'default' : 'outline'}
                onClick={() => setSnapToGrid(!snapToGrid)}
                className="h-8 w-8"
                title="Toggle Snap to Grid"
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          
          {/* Touch Mode Indicator */}
          {isTouchDevice && (
            <Card className="p-2 mt-2" style={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(127, 127, 127, 0.2)'
            }}>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </Card>
          )}
        </div>
        
        {/* Save Status Indicator - Disabled to prevent continuous popover during Fast Refresh */}
        {/* {saveStatus !== 'saved' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <Card className="p-2 px-4" style={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(127, 127, 127, 0.2)'
            }}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  saveStatus === 'saving' ? "bg-yellow-500 animate-pulse" : "bg-orange-500"
                )} />
                <span className="text-xs">
                  {saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
                </span>
              </div>
            </Card>
          </div>
        )} */}

        {/* Alignment Controls - Show only when multiple nodes are selected */}
        {getSelectedNodes().length >= 2 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2" style={{ zIndex: 20 }}>
            <Card className="p-2" style={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(127, 127, 127, 0.2)'
            }}>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground mr-2">Align:</div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('left')}
                    className="h-8 w-8"
                    title="Align Left"
                  >
                    <AlignHorizontalJustifyStart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('center-h')}
                    className="h-8 w-8"
                    title="Align Center Horizontal"
                  >
                    <AlignHorizontalJustifyCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('right')}
                    className="h-8 w-8"
                    title="Align Right"
                  >
                    <AlignHorizontalJustifyEnd className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-8 mx-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('top')}
                    className="h-8 w-8"
                    title="Align Top"
                  >
                    <AlignVerticalJustifyStart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('center-v')}
                    className="h-8 w-8"
                    title="Align Center Vertical"
                  >
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => alignNodes('bottom')}
                    className="h-8 w-8"
                    title="Align Bottom"
                  >
                    <AlignVerticalJustifyEnd className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
            
            {getSelectedNodes().length >= 3 && (
              <Card className="p-2" style={{
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(127, 127, 127, 0.2)'
              }}>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground mr-2">Distribute:</div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => distributeNodes('horizontal')}
                      className="h-8 w-8"
                      title="Distribute Horizontally"
                    >
                      <Columns className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => distributeNodes('vertical')}
                      className="h-8 w-8"
                      title="Distribute Vertically"
                    >
                      <Rows className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Node Creation Popover */}
        {nodePopoverOpen && (() => {
          const hasEndNode = nodes.some(node => node.data?.type === 'end');
          
          return (
            <>
              {/* Backdrop to close popover when clicking outside */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                }}
                onClick={() => {
                  setNodePopoverOpen(false);
                  setPendingConnection(null);
                  connectionInProgress.current = false;
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: Math.max(10, Math.min(nodePopoverPosition.x - 150, window.innerWidth - 280)),
                  top: Math.max(10, Math.min(nodePopoverPosition.y - 100, window.innerHeight - 400)),
                  zIndex: 1000,
                }}
              >
                <Card className="p-4 shadow-lg w-64" style={{
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(127, 127, 127, 0.2)'
              }}>
                <h3 className="text-sm font-semibold mb-3">Add Node</h3>
                <div className="node-popover-content space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('message', 'Send Message')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('input', 'Collect Text Input', 'text')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Collect Input (Text)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('input', 'Collect Choice', 'choice')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Collect Input (Choice)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('input', 'Collect Multiple Choices', 'multiselect')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Collect Input (Multi)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('action', 'Perform Action')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Perform Action
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createNodeFromPopover('branch', 'Branch')}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Branch
                  </Button>
                  {!hasEndNode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => createNodeFromPopover('end', 'End')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      End Flow
                    </Button>
                  )}
                  <Separator className="my-2" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      setNodePopoverOpen(false);
                      setPendingConnection(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel (Esc)
                  </Button>
                </div>
              </Card>
            </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export function EnhancedWorkflowBuilderV2(props: EnhancedWorkflowBuilderV2Props) {
  return (
    <ReactFlowProvider>
      <FlowComponent {...props} />
    </ReactFlowProvider>
  );
}