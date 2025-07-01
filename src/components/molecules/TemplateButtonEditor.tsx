'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Phone, Link, Reply, MessageSquare } from 'lucide-react';
import templatesStrings from '@/data/strings/templates.json';
import { cn } from '@/lib/utils';

interface TemplateButton {
  type: 'quickReply' | 'url' | 'phone' | 'callToAction';
  text: string;
  value?: string;
}

interface TemplateButtonEditorProps {
  buttons: TemplateButton[];
  onChange: (buttons: TemplateButton[]) => void;
  provider: string;
  limits: any;
}

export default function TemplateButtonEditor({
  buttons,
  onChange,
  provider,
  limits
}: TemplateButtonEditorProps) {
  const maxButtons = limits?.total || limits?.quickReply || limits?.callToAction || 0;

  const addButton = () => {
    if (buttons.length >= maxButtons) return;
    
    const newButton: TemplateButton = {
      type: 'quickReply',
      text: ''
    };
    
    onChange([...buttons, newButton]);
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const updated = buttons.map((btn, i) => 
      i === index ? { ...btn, ...updates } : btn
    );
    onChange(updated);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'url':
        return <Link className="h-4 w-4" />;
      case 'quickReply':
        return <Reply className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getAvailableTypes = () => {
    const types = [
      { value: 'quickReply', label: templatesStrings.templates.builder.editor.buttons.types.quickReply }
    ];
    
    if (provider === 'whatsapp' || provider === 'messenger') {
      types.push(
        { value: 'url', label: templatesStrings.templates.builder.editor.buttons.types.url },
        { value: 'phone', label: templatesStrings.templates.builder.editor.buttons.types.phone }
      );
    } else if (provider === 'instagram') {
      types.push(
        { value: 'url', label: templatesStrings.templates.builder.editor.buttons.types.url }
      );
    }
    
    return types;
  };

  return (
    <div className="space-y-3">
      {buttons.map((button, index) => (
        <div key={index} className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getButtonIcon(button.type)}
              <span className="text-sm font-medium">Button {index + 1}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeButton(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={button.type}
                onValueChange={(value) => updateButton(index, { type: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTypes().map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">Button Text</Label>
              <Input
                value={button.text}
                onChange={(e) => updateButton(index, { text: e.target.value })}
                placeholder={templatesStrings.templates.builder.editor.buttons.placeholder.text}
                className="h-8"
                maxLength={20}
              />
            </div>
          </div>
          
          {(button.type === 'url' || button.type === 'phone') && (
            <div>
              <Label className="text-xs">
                {button.type === 'url' ? 'URL' : 'Phone Number'}
              </Label>
              <Input
                value={button.value || ''}
                onChange={(e) => updateButton(index, { value: e.target.value })}
                placeholder={
                  button.type === 'url' 
                    ? templatesStrings.templates.builder.editor.buttons.placeholder.url
                    : templatesStrings.templates.builder.editor.buttons.placeholder.phone
                }
                className="h-8"
              />
            </div>
          )}
        </div>
      ))}
      
      {buttons.length < maxButtons && (
        <Button
          variant="outline"
          size="sm"
          onClick={addButton}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          {templatesStrings.templates.builder.editor.buttons.add}
        </Button>
      )}
      
      {buttons.length >= maxButtons && (
        <p className="text-sm text-muted-foreground text-center">
          {templatesStrings.templates.builder.editor.buttons.max.replace('{{count}}', maxButtons.toString())}
        </p>
      )}
    </div>
  );
}