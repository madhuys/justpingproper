'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContent } from '@/hooks/useContent';
import { Info, Copy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import toast from 'react-hot-toast';

interface ConnectChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: any;
  onConnect: (config: any) => void;
}

export function ConnectChannelModal({ isOpen, onClose, channel, onConnect }: ConnectChannelModalProps) {
  const { content } = useContent('home');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState('');

  if (!channel) return null;

  const handleSubmit = () => {
    // Validate required fields
    const currentFields = channel.providers ? 
      channel.providers.find((p: any) => p.id === selectedProvider)?.fields : 
      channel.fields;

    const missingFields = currentFields?.filter((field: any) => 
      field.required && !formData[field.name]
    );

    if (missingFields?.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onConnect({
      channelId: channel.id,
      provider: selectedProvider,
      ...formData
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderField = (field: any) => {
    const value = field.value?.replace('${baseUrl}', window.location.origin) || formData[field.name] || '';

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{field.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {field.type === 'textarea' ? (
          <div className="relative">
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => !field.readOnly && setFormData({...formData, [field.name]: e.target.value})}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              className={field.readOnly ? 'pr-10' : ''}
            />
            {field.readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(value)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : field.type === 'select' ? (
          <Select
            value={formData[field.name]}
            onValueChange={(value) => setFormData({...formData, [field.name]: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="relative">
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => !field.readOnly && setFormData({...formData, [field.name]: e.target.value})}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              className={field.readOnly ? 'pr-10' : ''}
            />
            {field.readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6"
                onClick={() => copyToClipboard(value)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic-modal max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect {channel?.name}</DialogTitle>
          <DialogDescription>
            {content?.widgets?.quickConnect?.channels?.[channel?.id]?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {channel?.providers ? (
            <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${channel.providers.length}, 1fr)` }}>
                {channel.providers.map((provider: any) => (
                  <TabsTrigger key={provider.id} value={provider.id}>
                    {provider.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {channel.providers.map((provider: any) => (
                <TabsContent key={provider.id} value={provider.id} className="space-y-4 mt-4">
                  {provider.fields?.map(renderField)}
                </TabsContent>
              ))}
            </Tabs>
          ) : channel?.subChannels ? (
            <Tabs defaultValue={channel.subChannels[0].id}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${channel.subChannels.length}, 1fr)` }}>
                {channel.subChannels.map((sub: any) => (
                  <TabsTrigger key={sub.id} value={sub.id}>
                    {sub.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {channel.subChannels.map((sub: any) => (
                <TabsContent key={sub.id} value={sub.id} className="space-y-4 mt-4">
                  {sub.fields?.map(renderField)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-4">
              {channel?.fields?.map(renderField)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}