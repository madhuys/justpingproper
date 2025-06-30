import React, { useState, useEffect } from 'react';
import { X, Trash2, Variable, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Node } from 'reactflow';
import { WorkflowNodeData } from './WorkflowNode';
import { cn } from '@/lib/utils';

interface NodeConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<WorkflowNodeData> | null;
  onUpdate: (data: Partial<WorkflowNodeData>) => void;
  onDelete: () => void;
}

const validationTypes = [
  { id: 'email', label: 'Email Address', description: 'Validates email format' },
  { id: 'phone', label: 'Phone Number', description: 'Validates phone number format' },
  { id: 'address', label: 'Address', description: 'Validates address against database' },
  { id: 'postcode', label: 'Post Code', description: 'Validates postcode format and location' },
  { id: 'date', label: 'Date', description: 'Validates date format and range' },
  { id: 'number', label: 'Number', description: 'Validates numeric input' },
  { id: 'card', label: 'Credit Card', description: 'Validates card number' },
  { id: 'url', label: 'URL', description: 'Validates URL format' },
  { id: 'custom', label: 'Custom', description: 'Custom AI validation' },
];

export function NodeConfigDrawer({ isOpen, onClose, node, onUpdate, onDelete }: NodeConfigDrawerProps) {
  const [formData, setFormData] = useState<Partial<WorkflowNodeData>>({});
  const [customValidation, setCustomValidation] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');
  const [multiSelectOptions, setMultiSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (node) {
      setFormData(node.data);
      setVariables(node.data.variables || []);
      setMultiSelectOptions(node.data.options || []);
    }
  }, [node]);

  const handleUpdate = (field: keyof WorkflowNodeData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const addVariable = () => {
    if (newVariable.trim()) {
      const updated = [...variables, newVariable.trim()];
      setVariables(updated);
      handleUpdate('variables', updated);
      setNewVariable('');
    }
  };

  const removeVariable = (index: number) => {
    const updated = variables.filter((_, i) => i !== index);
    setVariables(updated);
    handleUpdate('variables', updated);
  };

  const addOption = () => {
    if (newOption.trim()) {
      const updated = [...multiSelectOptions, newOption.trim()];
      setMultiSelectOptions(updated);
      handleUpdate('options', updated);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    const updated = multiSelectOptions.filter((_, i) => i !== index);
    setMultiSelectOptions(updated);
    handleUpdate('options', updated);
  };

  if (!isOpen || !node) return null;

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50",
      "transform transition-transform duration-300",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Configure Node</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-64px)]">
        <div className="p-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="ai">AI Config</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>Node Label</Label>
                <Input
                  value={formData.label || ''}
                  onChange={(e) => handleUpdate('label', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Prompt/Message</Label>
                <Textarea
                  value={formData.prompt || ''}
                  onChange={(e) => handleUpdate('prompt', e.target.value)}
                  placeholder="Enter the message or prompt..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Variables Captured</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Define variables that this node will capture
                </p>
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Card className="flex-1 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm">{variable}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(index)}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Card>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="Variable name..."
                      onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                    />
                    <Button onClick={addVariable} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="input" className="space-y-4">
              {node.data.type === 'input' && (
                <>
                  <div>
                    <Label>Input Type</Label>
                    <Select
                      value={formData.inputType || 'text'}
                      onValueChange={(value) => handleUpdate('inputType', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Free Text</SelectItem>
                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                        <SelectItem value="ai-validated">AI Validated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.inputType === 'multiselect' && (
                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2 mt-2">
                        {multiSelectOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Card className="flex-1 px-3 py-2 flex items-center justify-between">
                              <span className="text-sm">{option}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index)}
                                className="h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Card>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="Add option..."
                            onKeyPress={(e) => e.key === 'Enter' && addOption()}
                          />
                          <Button onClick={addOption} size="sm">
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.inputType === 'ai-validated' && (
                    <div>
                      <Label>Validation Type</Label>
                      <Select
                        value={formData.validationType || ''}
                        onValueChange={(value) => handleUpdate('validationType', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select validation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {validationTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.validationType === 'custom' && (
                        <div className="mt-4">
                          <Label>Custom Validation Rule</Label>
                          <Textarea
                            value={customValidation}
                            onChange={(e) => setCustomValidation(e.target.value)}
                            placeholder="e.g., Validate postcode against address..."
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  System Prompt
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Context-sensitive instructions for AI behavior at this node
                </p>
                <Textarea
                  value={formData.systemPrompt || ''}
                  onChange={(e) => handleUpdate('systemPrompt', e.target.value)}
                  placeholder="You are a helpful assistant. At this step, you should..."
                  rows={6}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Available Variables</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  These variables can be used in the system prompt
                </p>
                <Card className="p-3 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {['{{user_name}}', '{{user_email}}', '{{user_phone}}', '{{current_date}}'].map((variable) => (
                      <code
                        key={variable}
                        className="px-2 py-1 bg-background rounded text-xs"
                      >
                        {variable}
                      </code>
                    ))}
                    {variables.map((variable) => (
                      <code
                        key={variable}
                        className="px-2 py-1 bg-primary/10 rounded text-xs"
                      >
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}