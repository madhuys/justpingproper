import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarUpload } from '@/components/molecules/AvatarUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  User
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import agentsStrings from '@/data/strings/agents.json';
import toast from 'react-hot-toast';

interface FreeFlowAgentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (data: {
    name: string;
    tone: string;
    background: string;
    avatar?: string;
    conversationScope: string;
    knowledgeIndexId?: string;
    allowedTools: string[];
    aiModelId: string;
    mcpServerIds: string[];
  }) => void;
}

export function FreeFlowAgentWizard({ isOpen, onClose, onCreateAgent }: FreeFlowAgentWizardProps) {
  const { knowledgeIndexes, mcpServers, aiModels } = useAgents();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [name, setName] = useState('');
  const [tone, setTone] = useState('');
  const [background, setBackground] = useState('');
  const [avatar, setAvatar] = useState('');
  const [conversationScope, setConversationScope] = useState('');
  const [knowledgeIndexId, setKnowledgeIndexId] = useState('');
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [aiModelId, setAiModelId] = useState('');
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([]);

  const wizardSteps = [
    agentsStrings.wizard.freeflow.steps.persona,
    agentsStrings.wizard.freeflow.steps.scope,
    agentsStrings.wizard.freeflow.steps.model,
    agentsStrings.wizard.freeflow.steps.review
  ];

  const handleNext = () => {
    // Validation
    if (currentStep === 0 && (!name.trim() || !tone)) {
      toast.error(agentsStrings.validation.nameRequired);
      return;
    }
    if (currentStep === 1 && !conversationScope.trim()) {
      toast.error(agentsStrings.validation.scopeRequired);
      return;
    }
    if (currentStep === 2 && !aiModelId) {
      toast.error(agentsStrings.validation.modelRequired);
      return;
    }
    
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleTool = (tool: string) => {
    setAllowedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const toggleMcpServer = (serverId: string) => {
    setSelectedMcpServers(prev =>
      prev.includes(serverId) ? prev.filter(s => s !== serverId) : [...prev, serverId]
    );
  };

  const handleCreate = () => {
    onCreateAgent({
      name,
      tone,
      background,
      avatar,
      conversationScope,
      knowledgeIndexId: knowledgeIndexId === 'none' ? '' : knowledgeIndexId,
      allowedTools,
      aiModelId,
      mcpServerIds: selectedMcpServers
    });

    // Reset form
    setCurrentStep(0);
    setName('');
    setTone('');
    setBackground('');
    setAvatar('');
    setConversationScope('');
    setKnowledgeIndexId('');
    setAllowedTools([]);
    setAiModelId('');
    setSelectedMcpServers([]);
    onClose();
  };

  const generateSystemPrompt = () => {
    let prompt = `You are ${name}`;
    if (tone) {
      prompt += `, a ${tone} AI assistant`;
    }
    if (background) {
      prompt += `. ${background}`;
    }
    if (conversationScope) {
      prompt += `\n\nScope: ${conversationScope}`;
    }
    if (allowedTools.length > 0) {
      prompt += `\n\nYou have access to the following tools: ${allowedTools.join(', ')}`;
    }
    return prompt;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Persona Builder
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.freeflow.persona.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.freeflow.persona.description}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <AvatarUpload
                  currentAvatar={avatar || ''}
                  isEditing={true}
                  onUpload={(files) => {
                    if (files && files.length > 0) {
                      const file = files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  strings={{
                    uploadLabel: agentsStrings.wizard.freeflow.persona.uploadAvatar || 'Upload',
                    changeLabel: agentsStrings.wizard.freeflow.persona.changeAvatar || 'Change',
                    cropLabel: agentsStrings.wizard.freeflow.persona.cropAvatar || 'Crop',
                    noPhotoLabel: agentsStrings.wizard.freeflow.persona.noAvatar || 'No photo',
                  }}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Label>{agentsStrings.wizard.freeflow.persona.name}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={agentsStrings.wizard.freeflow.persona.namePlaceholder}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{agentsStrings.wizard.freeflow.persona.tone}</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a tone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(agentsStrings.wizard.freeflow.persona.toneOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>{agentsStrings.wizard.freeflow.persona.background}</Label>
              <Textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder={agentsStrings.wizard.freeflow.persona.backgroundPlaceholder}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 1: // Scope & Tools
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.freeflow.scope.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.freeflow.scope.description}
              </p>
            </div>

            <div>
              <Label>{agentsStrings.wizard.freeflow.scope.conversationScope}</Label>
              <Textarea
                value={conversationScope}
                onChange={(e) => setConversationScope(e.target.value)}
                placeholder={agentsStrings.wizard.freeflow.scope.scopePlaceholder}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label>{agentsStrings.wizard.freeflow.scope.knowledgeIndex}</Label>
              <Select value={knowledgeIndexId} onValueChange={setKnowledgeIndexId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={agentsStrings.wizard.freeflow.scope.knowledgeIndexPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {knowledgeIndexes.map(index => (
                    <SelectItem key={index.id} value={index.id}>
                      {index.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">{agentsStrings.wizard.freeflow.scope.allowedTools}</Label>
              <div className="space-y-2">
                {Object.entries(agentsStrings.wizard.freeflow.scope.toolOptions).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={allowedTools.includes(key)}
                      onCheckedChange={() => toggleTool(key)}
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Model & Channels
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.freeflow.model.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.freeflow.model.description}
              </p>
            </div>

            <div>
              <Label>{agentsStrings.wizard.freeflow.model.aiModel}</Label>
              <Select value={aiModelId} onValueChange={setAiModelId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an AI model..." />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">{agentsStrings.wizard.freeflow.model.mcpServers}</Label>
              <div className="space-y-2">
                {mcpServers.map(server => (
                  <label
                    key={server.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMcpServers.includes(server.id)}
                      onCheckedChange={() => toggleMcpServer(server.id)}
                    />
                    <span className="text-sm">{server.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Review
        const selectedModel = aiModels.find(m => m.id === aiModelId);
        const selectedKnowledgeIndex = knowledgeIndexes.find(k => k.id === knowledgeIndexId);
        
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.freeflow.review.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.freeflow.review.description}
              </p>
            </div>

            <Card className="p-4 space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">
                  {agentsStrings.wizard.freeflow.review.persona}
                </span>
                <div className="flex items-center space-x-3 mt-1">
                  {avatar && (
                    <img src={avatar} alt={name} className="h-8 w-8 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{tone}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">
                  {agentsStrings.wizard.freeflow.review.scope}
                </span>
                <p className="text-sm mt-1">{conversationScope}</p>
              </div>

              {selectedKnowledgeIndex && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.freeflow.review.knowledge}
                  </span>
                  <p className="font-medium">{selectedKnowledgeIndex.name}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-muted-foreground">
                  {agentsStrings.wizard.freeflow.review.model}
                </span>
                <p className="font-medium">{selectedModel?.name}</p>
              </div>

              {selectedMcpServers.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.freeflow.review.channels}
                  </span>
                  <p className="font-medium">{selectedMcpServers.length} channels selected</p>
                </div>
              )}

              {allowedTools.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.freeflow.review.tools}
                  </span>
                  <p className="font-medium">{allowedTools.length} tools enabled</p>
                </div>
              )}
            </Card>

            <div>
              <Label className="mb-2 block">
                {agentsStrings.wizard.freeflow.review.systemPrompt}
              </Label>
              <Card className="p-3 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap">{generateSystemPrompt()}</pre>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{agentsStrings.wizard.freeflow.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {wizardSteps.map((step, index) => (
                <span
                  key={index}
                  className={index <= currentStep ? 'text-primary' : 'text-muted-foreground'}
                >
                  {step}
                </span>
              ))}
            </div>
            <Progress value={(currentStep + 1) / wizardSteps.length * 100} />
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onClose : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? agentsStrings.actions.cancel : agentsStrings.actions.back}
            </Button>

            {currentStep < wizardSteps.length - 1 ? (
              <Button onClick={handleNext}>
                {agentsStrings.actions.next}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreate}>
                {agentsStrings.actions.create}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}