'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Globe, Phone, Key, Link } from 'lucide-react';
import publishStrings from '@/data/strings/publish.json';
import teamsData from '@/data/teams.json';
import integrationsData from '@/data/integrations.json';

interface PublishAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PublishData) => void;
  agent: {
    id: string;
    agentName: string;
    status: string;
    channels?: Array<{ type: string; provider?: string }>;
    teamAccess?: string[];
  };
}

interface PublishData {
  channels: Array<{
    type: string;
    provider?: string;
    config?: Record<string, any>;
  }>;
  teams: string[];
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-600" />,
  instagram: <MessageSquare className="h-4 w-4 text-pink-600" />,
  facebook: <MessageSquare className="h-4 w-4 text-blue-600" />,
  telegram: <MessageSquare className="h-4 w-4 text-blue-500" />,
  webchat: <Globe className="h-4 w-4 text-gray-600" />,
  sms: <Phone className="h-4 w-4 text-gray-600" />,
};

export function PublishAgentModal({ isOpen, onClose, onSubmit, agent }: PublishAgentModalProps) {
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [channelConfigs, setChannelConfigs] = useState<Record<string, any>>({});
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isUpdating = agent.status === 'published';

  useEffect(() => {
    // Pre-fill data if updating
    if (isUpdating && agent.channels) {
      const channels = new Set(agent.channels.map(c => c.type));
      setSelectedChannels(channels);
      
      // Set existing configs
      const configs: Record<string, any> = {};
      agent.channels.forEach(channel => {
        configs[channel.type] = channel;
      });
      setChannelConfigs(configs);
    }
    
    if (agent.teamAccess) {
      setSelectedTeams(agent.teamAccess);
    }
  }, [agent, isUpdating]);

  const teamOptions = teamsData.map(team => ({
    value: team.id,
    label: team.name
  }));

  const handleChannelToggle = (channel: string) => {
    const newChannels = new Set(selectedChannels);
    if (newChannels.has(channel)) {
      newChannels.delete(channel);
      // Remove config
      const newConfigs = { ...channelConfigs };
      delete newConfigs[channel];
      setChannelConfigs(newConfigs);
    } else {
      newChannels.add(channel);
    }
    setSelectedChannels(newChannels);
  };

  const handleConfigUpdate = (channel: string, field: string, value: string) => {
    setChannelConfigs({
      ...channelConfigs,
      [channel]: {
        ...channelConfigs[channel],
        [field]: value
      }
    });
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (selectedChannels.size === 0) {
      newErrors.channels = publishStrings.publish.messages.noChannels;
    }
    
    if (selectedTeams.length === 0) {
      newErrors.teams = publishStrings.publish.messages.noTeams;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const channels = Array.from(selectedChannels).map(channel => ({
      type: channel,
      ...channelConfigs[channel]
    }));
    
    onSubmit({
      channels,
      teams: selectedTeams
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdating ? publishStrings.publish.publishModal.updateTitle : publishStrings.publish.publishModal.title}
          </DialogTitle>
          <DialogDescription>
            {publishStrings.publish.publishModal.description}
          </DialogDescription>
          <div className="mt-2">
            <Badge variant="outline">{agent.agentName}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Channel Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              {publishStrings.publish.publishModal.channels.title}
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              {publishStrings.publish.publishModal.channels.description}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(publishStrings.publish.publishModal.channels).map(([key, label]) => {
                if (key === 'title' || key === 'description') return null;
                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedChannels.has(key)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    onClick={() => handleChannelToggle(key)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedChannels.has(key)}
                        onCheckedChange={() => handleChannelToggle(key)}
                      />
                      {channelIcons[key]}
                      <span className="font-medium">{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.channels && (
              <p className="text-sm text-destructive mt-2">{errors.channels}</p>
            )}
          </div>

          {/* WhatsApp Configuration */}
          {selectedChannels.has('whatsapp') && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="whatsapp">
                <AccordionTrigger>
                  {publishStrings.publish.publishModal.whatsappConfig.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label>{publishStrings.publish.publishModal.whatsappConfig.provider}</Label>
                      <Select
                        value={channelConfigs.whatsapp?.provider || ''}
                        onValueChange={(value) => handleConfigUpdate('whatsapp', 'provider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="gupshup">Gupshup</SelectItem>
                          <SelectItem value="whatsapp-cloud">WhatsApp Cloud API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{publishStrings.publish.publishModal.whatsappConfig.phoneNumber}</Label>
                      <Input
                        placeholder="+1234567890"
                        value={channelConfigs.whatsapp?.phoneNumber || ''}
                        onChange={(e) => handleConfigUpdate('whatsapp', 'phoneNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Team Access */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              {publishStrings.publish.publishModal.teams.title}
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              {publishStrings.publish.publishModal.teams.description}
            </p>
            <MultiSelectCombobox
              options={teamOptions}
              selected={selectedTeams}
              onSelect={setSelectedTeams}
              placeholder={publishStrings.publish.publishModal.teams.placeholder}
            />
            {errors.teams && (
              <p className="text-sm text-destructive mt-2">{errors.teams}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            {publishStrings.publish.publishModal.actions.cancel}
          </Button>
          <Button onClick={handleSubmit}>
            {isUpdating 
              ? publishStrings.publish.publishModal.actions.update
              : publishStrings.publish.publishModal.actions.publish
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}