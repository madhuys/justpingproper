import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  MessageSquare,
  FileText,
  Zap,
  CheckCircle,
  GitBranch,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReactFlow } from 'reactflow';

const nodeTypes = [
  {
    category: 'Flow Control',
    items: [
      { type: 'start', label: 'Start', icon: Bot, description: 'Begin the workflow' },
      { type: 'branch', label: 'Branch', icon: GitBranch, description: 'Split flow into multiple paths' },
      { type: 'end', label: 'End', icon: CheckCircle, description: 'End the workflow' }
    ]
  },
  {
    category: 'Interaction',
    items: [
      { type: 'message', label: 'Send Message', icon: MessageSquare, description: 'Send a message to user' },
      { type: 'input', label: 'Collect Input (Text)', icon: FileText, description: 'Get free text input', inputType: 'text' },
      { type: 'input', label: 'Collect Input (Choice)', icon: FileText, description: 'Single choice selection', inputType: 'choice' },
      { type: 'input', label: 'Collect Input (Multi)', icon: FileText, description: 'Multiple choice selection', inputType: 'multiselect' }
    ]
  },
  {
    category: 'Actions',
    items: [
      { type: 'action', label: 'Perform Action', icon: Zap, description: 'Execute an action' }
    ]
  }
];

export function WorkflowSidebarEnhanced() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const { getNodes } = useReactFlow();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
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

  const onDragStart = (event: React.DragEvent, item: any) => {
    const nodeData = {
      type: item.type,
      label: item.label,
      prompt: '',
      ...(item.inputType && { inputType: item.inputType }),
      ...(item.type === 'branch' && { branchCount: 2 }) // Default to 2 branches
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Touch event handlers for mobile support
  const onTouchStart = (event: React.TouchEvent, item: any) => {
    // Don't prevent default on touchstart to avoid passive listener warning
    
    const touch = event.touches[0];
    const element = event.currentTarget as HTMLElement;
    
    // Store the item data
    setDraggedItem({
      type: item.type,
      label: item.label,
      prompt: '',
      ...(item.inputType && { inputType: item.inputType }),
      ...(item.type === 'branch' && { branchCount: 2 })
    });

    // Create a clone of the element for visual feedback
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'drag-ghost';
    clone.style.position = 'fixed';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '10000';
    clone.style.opacity = '0.8';
    clone.style.transform = 'scale(1.1)';
    clone.style.left = `${touch.clientX - element.offsetWidth / 2}px`;
    clone.style.top = `${touch.clientY - element.offsetHeight / 2}px`;
    clone.style.width = `${element.offsetWidth}px`;
    clone.style.transition = 'none';
    document.body.appendChild(clone);
    setDraggedElement(clone);

    // Add a class to the original element
    element.classList.add('dragging');
  };

  const onTouchMove = (event: React.TouchEvent) => {
    // Only prevent default if we have a dragged element
    if (draggedElement) {
      event.preventDefault();
    }
    
    if (!draggedElement) return;
    
    const touch = event.touches[0];
    draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
    draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!draggedElement || !draggedItem) return;

    // Remove the clone
    draggedElement.remove();
    setDraggedElement(null);

    // Remove dragging class
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('dragging');

    // Get the touch end position
    const touch = event.changedTouches[0];
    
    // Find element at touch position
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Check if we're over the React Flow canvas
    const reactFlowWrapper = elementAtPoint?.closest('.react-flow__viewport');
    
    if (reactFlowWrapper) {
      // Get the React Flow wrapper element for correct positioning
      const wrapper = document.querySelector('.react-flow__wrapper');
      if (wrapper) {
        const wrapperBounds = wrapper.getBoundingClientRect();
        
        // Trigger a custom event for React Flow to handle
        const dropEvent = new CustomEvent('customNodeDrop', {
          detail: {
            nodeData: draggedItem,
            clientX: touch.clientX,
            clientY: touch.clientY,
            wrapperX: touch.clientX - wrapperBounds.left,
            wrapperY: touch.clientY - wrapperBounds.top
          },
          bubbles: true
        });
        wrapper.dispatchEvent(dropEvent);
      }
    }

    // Clear the dragged item
    setDraggedItem(null);
  };

  // Set up non-passive touch event listeners
  // This useEffect must be called before any conditional returns
  useEffect(() => {
    if (!sidebarRef.current) return;
    
    const handleTouchStartWrapper = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const cardElement = target.closest('.workflow-sidebar-item') as HTMLElement;
      
      if (!cardElement || cardElement.classList.contains('opacity-50')) return;
      
      // Get item data from data attributes
      const item = {
        type: cardElement.dataset.nodeType,
        label: cardElement.dataset.nodeLabel,
        inputType: cardElement.dataset.nodeInputType || undefined
      };
      
      if (item.type === 'branch') {
        (item as any).branchCount = 2;
      }
      
      onTouchStart(e as any, item);
    };
    
    const handleTouchMoveWrapper = (e: TouchEvent) => {
      if (draggedElement) {
        e.preventDefault();
        onTouchMove(e as any);
      }
    };
    
    const handleTouchEndWrapper = (e: TouchEvent) => {
      onTouchEnd(e as any);
    };
    
    const sidebar = sidebarRef.current;
    sidebar.addEventListener('touchstart', handleTouchStartWrapper, { passive: false });
    sidebar.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false });
    sidebar.addEventListener('touchend', handleTouchEndWrapper, { passive: false });
    
    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStartWrapper);
      sidebar.removeEventListener('touchmove', handleTouchMoveWrapper);
      sidebar.removeEventListener('touchend', handleTouchEndWrapper);
    };
  }, [draggedElement, onTouchStart, onTouchMove, onTouchEnd]);

  // Early return must be after all hooks
  if (!mounted) {
    return <div className="w-64 border-r h-full" />;
  }

  // Check if start or end nodes already exist
  const nodes = getNodes();
  const hasStartNode = nodes.some(node => node.data?.type === 'start');
  const hasEndNode = nodes.some(node => node.data?.type === 'end');

  return (
    <aside 
      ref={sidebarRef}
      className="w-64 border-r h-full overflow-y-auto"
      style={{
        backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--foreground)'
      }}
    >
      <div className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Nodes
        </h3>
        
        <div className="space-y-6">
          {nodeTypes.map((category) => (
            <div key={category.category}>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {category.category}
              </Label>
              <div className="mt-2 space-y-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = (item.type === 'start' && hasStartNode) || (item.type === 'end' && hasEndNode);
                  
                  return (
                    <Card
                      key={`${item.type}-${item.label}`}
                      data-node-type={item.type}
                      data-node-label={item.label}
                      data-node-input-type={item.inputType || ''}
                      className={cn(
                        "workflow-sidebar-item p-3 transition-all duration-200",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-move hover:shadow-md hover:scale-105",
                        "border-muted/50"
                      )}
                      style={{
                        backgroundColor: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(127, 127, 127, 0.1)',
                        touchAction: 'none' // Prevent scrolling while dragging
                      }}
                      draggable={!isDisabled}
                      onDragStart={(e) => !isDisabled && onDragStart(e, item)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{
                          backgroundColor: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'
                        }}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.label}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                            {isDisabled && ' (Already exists)'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Tips
          </Label>
          <Card className="p-3" style={{
            backgroundColor: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(127, 127, 127, 0.1)'
          }}>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Drag nodes to canvas</li>
              <li>• Click nodes to configure</li>
              <li>• Connect nodes by dragging handles</li>
              <li>• Use conditions for branching</li>
            </ul>
          </Card>
        </div>
      </div>
    </aside>
  );
}