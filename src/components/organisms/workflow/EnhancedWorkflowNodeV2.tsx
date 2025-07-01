import React, { useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStore } from 'reactflow';
import { BaseNode } from '@/components/ui/base-node';
import {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderIcon,
  NodeHeaderActions,
  NodeHeaderDeleteAction,
} from '@/components/ui/node-header';
import { NodeToolbar } from './WorkflowNodeToolbar';
import { FileIcon } from '@/components/atoms/FileIcon';
import { 
  MessageSquare, 
  GitBranch, 
  CheckCircle, 
  ArrowRight,
  Bot,
  FileText,
  Hash,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Globe,
  Shield,
  Zap,
  Send,
  BellRing,
  CalendarPlus,
  Database,
  Webhook,
  Plus,
  Settings,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowNodeData {
  label: string;
  type: 'start' | 'message' | 'input' | 'action' | 'end' | 'branch' | 'allocateToTeamInbox' | 'takeoverFromTeamInbox';
  inputType?: 'text' | 'multiselect' | 'choice';
  validationType?: string;
  prompt?: string;
  options?: string[];
  systemPrompt?: string;
  variable?: string;
  variables?: string[]; // Support multiple variables
  variableValidations?: Record<number, string>; // Validation type for each variable
  selected?: boolean;
  flowDirection?: 'TB' | 'LR';
  actionType?: string;
  exitConditions?: string[];
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  choices?: string[];
  hasError?: boolean;
  errorMessage?: string;
  branchCount?: number; // For branch node: 2-4 branches
  // Team Inbox specific fields
  teamInboxId?: string;
  teamInboxName?: string;
  teamInboxState?: string;
  // File attachments
  files?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  // Action node specific fields
  actionConfig?: {
    mcpServer?: string;
    mcpTool?: string;
    apiUrl?: string;
    apiMethod?: string;
    apiHeaders?: Record<string, string>;
    apiBody?: string;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    phoneNumber?: string;
    messageContent?: string;
    webhookUrl?: string;
    webhookMethod?: string;
    webhookHeaders?: Record<string, string>;
    webhookBody?: string;
  };
}

const iconMap = {
  start: Bot,
  message: MessageSquare,
  input: FileText,
  action: Zap,
  end: CheckCircle,
  branch: GitBranch,
  allocateToTeamInbox: Send,
  takeoverFromTeamInbox: BellRing,
  text: FileText,
  multiselect: Hash,
  email: Mail,
  phone: Phone,
  address: MapPin,
  date: Calendar,
  card: CreditCard,
  url: Globe,
  custom: Shield,
  sendEmail: Send,
  sendWhatsApp: MessageSquare,
  sendSMS: Phone,
  updateCalendar: CalendarPlus,
  updateCRM: Database,
  webhook: Webhook,
  notify: BellRing,
  mcpTool: Settings,
  apiCall: Globe,
  searchKnowledgebase: BookOpen,
  searchWeb: Search
};

const getValidationIcon = (validationType?: string) => {
  if (!validationType) return FileText;
  return iconMap[validationType as keyof typeof iconMap] || Shield;
};

const getActionIcon = (actionType?: string) => {
  if (!actionType) return Zap;
  return iconMap[actionType as keyof typeof iconMap] || Zap;
};

const truncateLabel = (label: string, maxLength: number = 30) => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength) + '...';
};

export function EnhancedWorkflowNodeV2({ data, selected, id }: NodeProps<WorkflowNodeData>) {
  const Icon = data.type === 'action' ? getActionIcon(data.actionType) : iconMap[data.type] || MessageSquare;
  const ValidationIcon = data.validationType ? getValidationIcon(data.validationType) : null;
  const { getNodes, setNodes, deleteElements } = useReactFlow();
  
  // Check if this node is highlighted due to intersection
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  const isTarget = connectionNodeId === id;
  
  // Check theme
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);
  
  // Refs for measuring elements
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const promptRef = React.useRef<HTMLDivElement>(null);
  const choicesRef = React.useRef<HTMLDivElement>(null);
  
  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);
  
  const handleDuplicate = useCallback(() => {
    const node = getNodes().find(n => n.id === id);
    if (node) {
      const newNode = {
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      };
      setNodes(nodes => [...nodes, newNode]);
    }
  }, [id, getNodes, setNodes]);
  
  // Force re-render when flowDirection changes
  const flowDirection = data.flowDirection || 'TB';
  
  // Calculate handle positions for choice nodes
  const [calculatedHandlePositions, setCalculatedHandlePositions] = React.useState<Record<string, number>>({});
  
  React.useEffect(() => {
    const calculatePositions = () => {
      if (data.type === 'input' && data.inputType === 'choice' && nodeRef.current) {
        const positions: Record<string, number> = {};
        
        // Calculate position for default handle (aligned with prompt)
        if (promptRef.current) {
          const nodeRect = nodeRef.current.getBoundingClientRect();
          const promptRect = promptRef.current.getBoundingClientRect();
          const promptCenter = promptRect.top + promptRect.height / 2 - nodeRect.top;
          positions['default'] = (promptCenter / nodeRect.height) * 100;
        }
        
        // Calculate positions for choice handles
        if (choicesRef.current) {
          const nodeRect = nodeRef.current.getBoundingClientRect();
          const choiceElements = choicesRef.current.querySelectorAll('[data-choice-index]');
          
          choiceElements.forEach((el, index) => {
            const choiceRect = el.getBoundingClientRect();
            const choiceCenter = choiceRect.top + choiceRect.height / 2 - nodeRect.top;
            positions[`choice-${index}`] = (choiceCenter / nodeRect.height) * 100;
          });
        }
        
        // Only update if positions have actually changed
        const positionsChanged = Object.keys(positions).length !== Object.keys(calculatedHandlePositions).length ||
          Object.entries(positions).some(([key, value]) => calculatedHandlePositions[key] !== value);
        
        if (positionsChanged) {
          setCalculatedHandlePositions(positions);
        }
      }
    };
    
    // Calculate immediately and after a short delay to ensure DOM is ready
    calculatePositions();
    const timer = setTimeout(calculatePositions, 100);
    
    return () => clearTimeout(timer);
  }, [data.type, data.inputType, data.choices, data.options, data.prompt]);

  const getNodeColor = () => {
    // Use darker colors for dark mode - with better opacity for glassmorphic effect
    if (isDarkMode) {
      if (data.hasError) return 'from-red-500/30 to-red-600/30 border-red-500/60';
      if (isTarget) return 'from-purple-500/30 to-purple-600/30 border-purple-500/60';
      
      switch (data.type) {
        case 'start': return 'from-green-500/20 to-green-600/20 border-green-500/40';
        case 'end': return 'from-red-500/20 to-red-600/20 border-red-500/40';
        case 'action': return 'from-purple-500/20 to-purple-600/20 border-purple-500/40';
        case 'input': return 'from-blue-500/20 to-blue-600/20 border-blue-500/40';
        case 'allocateToTeamInbox': return 'from-teal-500/20 to-teal-600/20 border-teal-500/40';
        case 'takeoverFromTeamInbox': return 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/40';
        default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/40';
      }
    }
    
    // Light mode - subtle colors that work with glassmorphic background
    if (data.hasError) return 'from-red-500/20 to-red-600/20 border-red-500/50';
    if (isTarget) return 'from-purple-500/20 to-purple-600/20 border-purple-500/50';
    
    switch (data.type) {
      case 'start': return 'from-green-500/10 to-green-600/10 border-green-500/30';
      case 'end': return 'from-red-500/10 to-red-600/10 border-red-500/30';
      case 'action': return 'from-purple-500/10 to-purple-600/10 border-purple-500/30';
      case 'input': return 'from-blue-500/10 to-blue-600/10 border-blue-500/30';
      case 'allocateToTeamInbox': return 'from-teal-500/10 to-teal-600/10 border-teal-500/30';
      case 'takeoverFromTeamInbox': return 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/30';
      default: return 'from-gray-500/10 to-gray-600/10 border-gray-500/30';
    }
  };

  const handlePositions = flowDirection === 'LR' 
    ? { target: Position.Left, source: Position.Right }
    : { target: Position.Top, source: Position.Bottom };

  // Determine if we need multiple handles based on node type
  const choices = data.choices || data.options || [];
  const hasChoices = data.type === 'input' && data.inputType === 'choice' && choices.length > 0;
  
  // Multiple outputs for:
  // - input nodes with choices
  // - branch nodes (2-4 outputs)
  const hasMultipleOutputs = hasChoices || data.type === 'branch';
  
  let outputCount = 1;
  if (hasChoices) {
    outputCount = choices.length + 1; // +1 for default
  } else if (data.type === 'branch') {
    outputCount = data.branchCount || 2; // Default to 2 branches
  }

  return (
    <>
      {/* Node Toolbar */}
      {data.type !== 'start' && data.type !== 'end' && (
        <NodeToolbar
          nodeId={id}
          isVisible={selected}
          position={flowDirection === 'LR' ? Position.Top : Position.Right}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* Target Handle */}
      {data.type !== 'start' && (
        <Handle 
          type="target" 
          position={handlePositions.target}
          style={{
            background: 'var(--primary)',
            width: 12,
            height: 12,
            border: '2px solid var(--background)',
            position: 'absolute',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
      
      <BaseNode 
        ref={nodeRef}
        selected={selected}
        className={cn(
          "w-[280px] cursor-pointer transition-all duration-200",
          "bg-gradient-to-br backdrop-blur-md backdrop-saturate-150",
          "shadow-lg",
          getNodeColor(),
          isTarget && "scale-105 shadow-xl",
          "hover:shadow-xl hover:scale-105"
        )}
        style={{
          backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <NodeHeader className="border-b border-border/50">
          <NodeHeaderIcon>
            <Icon className="h-4 w-4" />
          </NodeHeaderIcon>
          <NodeHeaderTitle>
            {data.type === 'start' ? 'Start' : 
             data.type === 'end' ? 'End' :
             data.type === 'input' ? `Collect ${data.inputType === 'choice' ? 'Choice' : data.inputType === 'multiselect' ? 'Multi-Select' : 'Text'} Input` :
             data.type === 'action' ? 'Action' :
             data.type === 'message' ? 'Send Message' : 
             data.type === 'branch' ? `Branch (${data.branchCount || 2} paths)` :
             data.type === 'allocateToTeamInbox' ? 'Allocate to Team Inbox' :
             data.type === 'takeoverFromTeamInbox' ? 'Takeover from Team Inbox' : 'Node'}
          </NodeHeaderTitle>
          <NodeHeaderActions>
            {data.type !== 'start' && data.type !== 'end' && (
              <NodeHeaderDeleteAction onDelete={handleDelete} />
            )}
          </NodeHeaderActions>
        </NodeHeader>
        <div className="p-4">
          <div className="space-y-3">
            {/* Custom Label (if different from default) */}
            {data.label && !['Start', 'End', 'Send Message', 'Collect Input', 'Collect Text Input', 'Collect Choice', 'Collect Multiple Choices', 'Action'].includes(data.label) && (
              <div>
                <h3 className="font-medium text-sm line-clamp-2 break-words">{data.label}</h3>
              </div>
            )}
            
            {/* Message/Prompt Content */}
            {data.prompt && (
              <div ref={promptRef}>
                <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                  {data.prompt}
                </p>
              </div>
            )}
            
            {/* Variables being captured */}
            {(data.variables && data.variables.length > 0) || data.variable ? (
              <div>
                <div className="flex flex-wrap gap-1">
                  {(data.variables || [data.variable].filter(Boolean)).map((variable, index) => {
                    const validationType = data.variableValidations?.[index] || (index === 0 ? data.validationType : null);
                    const ValidationIconForVar = validationType ? getValidationIcon(validationType) : null;
                    return (
                      <span key={index} className={cn("text-xs font-mono px-2 py-0.5 rounded inline-flex items-center gap-1", isDarkMode ? "bg-primary/10" : "bg-primary/20")}>
                        {`{{${variable}}}`}
                        {ValidationIconForVar && validationType !== 'none' && (
                          <ValidationIconForVar className="h-3 w-3" />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
            
            {/* Choices/Options for input nodes */}
            {hasChoices && choices.length > 0 && (
              <div ref={choicesRef}>
                <div className="text-xs text-muted-foreground mb-1">Options:</div>
                <div className="space-y-1">
                  {choices.map((choice, index) => (
                    <div 
                      key={index} 
                      data-choice-index={index}
                      className={cn("text-xs px-2 py-1 rounded border flex items-start gap-2", isDarkMode ? "bg-primary/10 border-primary/20" : "bg-primary/20 border-primary/30")}
                    >
                      <span className="font-mono text-muted-foreground flex-shrink-0">{index + 1}.</span>
                      <span className="line-clamp-2 break-words flex-1">{choice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File Attachments */}
            {data.files && data.files.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Attachments:</div>
                <div className="space-y-1">
                  {data.files.map((file, index) => (
                    <div 
                      key={file.id || index}
                      className={cn(
                        "text-xs px-2 py-1 rounded border flex items-center gap-2",
                        isDarkMode ? "bg-primary/10 border-primary/20" : "bg-primary/20 border-primary/30"
                      )}
                    >
                      <FileIcon type="file" mimeType={file.type} size="sm" />
                      <span className="truncate flex-1">{truncateLabel(file.name, 25)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Type and Details */}
            {data.actionType && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Action:</span>
                  <span className="text-xs font-medium">{data.actionType}</span>
                </div>
                {/* Show action-specific details */}
                {data.actionConfig && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {data.actionType === 'mcpTool' && data.actionConfig.mcpServer && (
                      <div>Server: {data.actionConfig.mcpServer}</div>
                    )}
                    {data.actionType === 'mcpTool' && data.actionConfig.mcpTool && (
                      <div>Tool: {data.actionConfig.mcpTool}</div>
                    )}
                    {(data.actionType === 'apiCall' || data.actionType === 'webhook') && data.actionConfig.apiUrl && (
                      <div>URL: {data.actionConfig.apiUrl || data.actionConfig.webhookUrl}</div>
                    )}
                    {data.actionType === 'sendEmail' && data.actionConfig.emailTo && (
                      <div>To: {data.actionConfig.emailTo}</div>
                    )}
                    {(data.actionType === 'sendSMS' || data.actionType === 'sendWhatsApp') && data.actionConfig.phoneNumber && (
                      <div>To: {data.actionConfig.phoneNumber}</div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Team Inbox Information */}
            {(data.type === 'allocateToTeamInbox' || data.type === 'takeoverFromTeamInbox') && (
              <div className="space-y-2">
                {data.teamInboxId && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Team Inbox: </span>
                    <span className="font-medium">
                      {data.teamInboxId === 'sales-inbox' ? 'Sales Team' :
                       data.teamInboxId === 'support-inbox' ? 'Customer Support' :
                       data.teamInboxId === 'billing-inbox' ? 'Billing Team' :
                       data.teamInboxId === 'technical-inbox' ? 'Technical Team' :
                       data.teamInboxId}
                    </span>
                  </div>
                )}
                {data.teamInboxState && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">
                      {data.type === 'allocateToTeamInbox' ? 'Initial State: ' : 'Trigger State: '}
                    </span>
                    <span className={cn(
                      "font-medium px-2 py-0.5 rounded",
                      isDarkMode ? "bg-primary/10" : "bg-primary/20"
                    )}>
                      {data.teamInboxState}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* AI Model (if not default) */}
            {data.aiModel && data.aiModel !== 'gpt-3.5-turbo' && (
              <div className="text-xs text-muted-foreground">
                Model: {data.aiModel}
              </div>
            )}
            
            {/* Error State */}
            {data.hasError && data.errorMessage && (
              <div className="text-xs text-red-500 font-medium">
                ⚠️ {data.errorMessage}
              </div>
            )}
          </div>
        </div>
      </BaseNode>

      {/* Source Handles */}
      {data.type !== 'end' && (
        hasMultipleOutputs ? (
          // Multiple handles for branching
          Array.from({ length: outputCount }).map((_, index) => {
            const offset = 100 / (outputCount + 1);
            const defaultPosition = offset * (index + 1);
            
            // Determine handle label for tooltip
            let handleLabel = '';
            let handleId = '';
            if (hasChoices) {
              if (index < choices.length) {
                handleLabel = choices[index] || '';
                handleId = `choice-${index}`;
              } else {
                handleLabel = 'Default';
                handleId = 'default';
              }
            } else if (data.type === 'branch') {
              handleLabel = `Branch ${index + 1}`;
              handleId = `branch-${index}`;
            } else {
              handleId = 'output';
            }
            
            // Use calculated position if available, otherwise use default
            const position = calculatedHandlePositions[handleId] || defaultPosition;
            
            return (
              <React.Fragment key={`source-${index}`}>
                <Handle
                  type="source"
                  position={handlePositions.source}
                  id={handleId}
                  title={handleLabel}
                  style={{
                    background: index === choices.length ? '#6b7280' : 'var(--primary)',
                    width: 10,
                    height: 10,
                    border: '2px solid var(--background)',
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                    [flowDirection === 'LR' ? 'top' : 'left']: `${position}%`
                  }}
                />
                {handleLabel && data.type !== 'input' && (
                  <div
                    className="absolute whitespace-nowrap pointer-events-none"
                    style={{
                      [flowDirection === 'LR' ? 'top' : 'left']: `${position}%`,
                      [flowDirection === 'LR' ? 'left' : 'top']: flowDirection === 'LR' ? '100%' : '100%',
                      [flowDirection === 'LR' ? 'marginLeft' : 'marginTop']: '20px',
                      transform: flowDirection === 'LR' ? 'translateY(-50%)' : 'translateX(-50%)',
                      zIndex: 1000
                    }}
                  >
                    <div 
                      className="px-2 py-1 rounded text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      {truncateLabel(handleLabel)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        ) : (
          // Single handle
          <Handle 
            type="source" 
            position={handlePositions.source}
            id="output"
            style={{
              background: 'var(--primary)',
              width: 12,
              height: 12,
              border: '2px solid var(--background)',
              position: 'absolute',
              transform: 'translate(+50%, -50%)'
            }}
          />
        )
      )}

      {/* AI Magic button when selected */}
      {selected && data.type !== 'start' && data.type !== 'end' && (
        <div 
          className="absolute -top-12 right-0 transition-all duration-200"
          style={{ zIndex: 1000 }}
        >
          <button 
            className="group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              console.log('AI Edit button clicked', { id, data });
              console.log('openOmniChat function:', (window as any).openOmniChat);
              // Trigger OmniChat in node-editor context
              if ((window as any).openOmniChat) {
                (window as any).openOmniChat('node-editor', {
                  node: { id, data }
                });
              } else {
                console.error('openOmniChat function not found on window object');
              }
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium">AI Edit</span>
          </button>
        </div>
      )}

      {/* Add node button on hover */}
      {data.type === 'input' && selected && (
        <div 
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity"
        >
          <button className="p-1 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}