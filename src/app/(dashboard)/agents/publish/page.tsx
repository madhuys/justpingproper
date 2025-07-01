'use client';

import React, { useState, useEffect } from 'react';
import { Send, Search, Filter, MoreVertical, Globe, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { PublishAgentModal } from '@/components/organisms/modals/PublishAgentModal';
import { UnpublishAgentModal } from '@/components/organisms/modals/UnpublishAgentModal';
import publishStrings from '@/data/strings/publish.json';
import publishedAgentsData from '@/data/publishedAgents.json';
import workflowsData from '@/data/states/workflows/default.json';
import freeflowsData from '@/data/states/freeflows.json';
import channels from '@/data/channels.json';
import { getIntegrationIcon } from '@/lib/integrations/utils';

interface PublishedAgent {
  id: string;
  agentId: string;
  agentName: string;
  agentType: 'workflow' | 'freeflow';
  status: 'published' | 'unpublished';
  channels: Array<{ type: string; provider?: string }>;
  teamAccess: string[];
  publishedAt: string | null;
  createdAt?: string;
  lastUpdatedAt?: string;
  statistics: {
    totalConversations: number;
    activeConversations: number;
  };
}

export default function PublishPage() {
  const [publishedAgents, setPublishedAgents] = useState<PublishedAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<PublishedAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<PublishedAgent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load published agents
    setTimeout(() => {
      setPublishedAgents(publishedAgentsData);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let filtered = [...publishedAgents];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.agentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(agent => agent.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(agent => agent.agentType === typeFilter);
    }

    setFilteredAgents(filtered);
  }, [publishedAgents, searchQuery, statusFilter, typeFilter]);

  const handlePublish = (agent: PublishedAgent) => {
    setSelectedAgent(agent);
    setIsPublishModalOpen(true);
  };

  const handleUnpublish = (agent: PublishedAgent) => {
    setSelectedAgent(agent);
    setIsUnpublishModalOpen(true);
  };

  const handlePublishSubmit = (data: any) => {
    if (!selectedAgent) return;

    const updatedAgents = publishedAgents.map(agent =>
      agent.id === selectedAgent.id
        ? {
            ...agent,
            status: 'published' as const,
            channels: data.channels,
            teamAccess: data.teams,
            publishedAt: new Date().toISOString(),
          }
        : agent
    );

    setPublishedAgents(updatedAgents);
    
    const channelCount = data.channels.length;
    toast.success(publishStrings.publish.messages.publishSuccess.replace('{{channels}}', channelCount.toString()));
    
    setIsPublishModalOpen(false);
  };

  const handleUnpublishSubmit = () => {
    if (!selectedAgent) return;

    const updatedAgents = publishedAgents.map(agent =>
      agent.id === selectedAgent.id
        ? {
            ...agent,
            status: 'unpublished' as const,
            channels: [],
            teamAccess: [],
          }
        : agent
    );

    setPublishedAgents(updatedAgents);
    toast.success(publishStrings.publish.messages.unpublishSuccess);
    
    setIsUnpublishModalOpen(false);
  };

  const getChannelIcon = (channelType: string) => {
    const channelData = channels[channelType as keyof typeof channels];
    if (!channelData) return <MessageSquare className="h-4 w-4" />;
    
    const Icon = getIntegrationIcon(channelData.icon);
    
    // Extract gradient colors for icon styling with proper theme support
    const colorMap: Record<string, string> = {
      'from-green-500 to-green-600': 'text-green-600 dark:text-green-400',
      'from-pink-500 to-pink-600': 'text-pink-600 dark:text-pink-400',
      'from-blue-500 to-blue-600': 'text-blue-600 dark:text-blue-400',
      'from-purple-500 to-purple-600': 'text-purple-600 dark:text-purple-400',
      'from-gray-500 to-gray-600': 'text-gray-600 dark:text-gray-400',
      'from-cyan-500 to-cyan-600': 'text-cyan-600 dark:text-cyan-400',
      'from-orange-500 to-orange-600': 'text-orange-600 dark:text-orange-400',
      'from-red-500 to-red-600': 'text-red-600 dark:text-red-400',
      'from-indigo-500 to-indigo-600': 'text-indigo-600 dark:text-indigo-400'
    };
    
    const colorClass = colorMap[channelData.color] || 'text-gray-600 dark:text-gray-400';
    
    return <Icon className={`h-4 w-4 ${colorClass}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader 
        title={publishStrings.publish.title}
        subtitle={publishStrings.publish.subtitle}
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={publishStrings.publish.filters.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{publishStrings.publish.tabs.all}</SelectItem>
              <SelectItem value="workflow">{publishStrings.publish.tabs.workflow}</SelectItem>
              <SelectItem value="freeflow">{publishStrings.publish.tabs.freeflow}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{publishStrings.publish.filters.all}</SelectItem>
              <SelectItem value="published">{publishStrings.publish.filters.published}</SelectItem>
              <SelectItem value="unpublished">{publishStrings.publish.filters.unpublished}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAgents.length === 0 ? (
          <Card className="p-12 text-center">
            <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {publishStrings.publish.empty.title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {publishStrings.publish.empty.description}
            </p>
            <Button onClick={() => window.location.href = '/agents'}>
              {publishStrings.publish.empty.action}
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{publishStrings.publish.table.name}</TableHead>
                  <TableHead>{publishStrings.publish.table.type}</TableHead>
                  <TableHead>{publishStrings.publish.table.status}</TableHead>
                  <TableHead>{publishStrings.publish.table.channels}</TableHead>
                  <TableHead>{publishStrings.publish.table.teams}</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">{publishStrings.publish.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.agentName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {agent.agentType === 'workflow' ? 'Workflow' : 'Free-Flow'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.status === 'published' ? 'default' : 'secondary'}>
                        {publishStrings.publish.status[agent.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {agent.channels.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          agent.channels.map((channel, idx) => (
                            <div key={idx} className="flex items-center">
                              {getChannelIcon(channel.type)}
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.teamAccess.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span>{agent.teamAccess.length} teams</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{agent.statistics.totalConversations}</span>
                        <span className="text-muted-foreground"> total</span>
                        {agent.statistics.activeConversations > 0 && (
                          <Badge variant="default" className="ml-2 text-xs">
                            {agent.statistics.activeConversations} active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {agent.publishedAt ? new Date(agent.publishedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {agent.lastUpdatedAt ? new Date(agent.lastUpdatedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {agent.status === 'unpublished' ? (
                            <DropdownMenuItem onClick={() => handlePublish(agent)}>
                              <Send className="mr-2 h-4 w-4" />
                              {publishStrings.publish.actions.publish}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handlePublish(agent)}>
                                <Send className="mr-2 h-4 w-4" />
                                {publishStrings.publish.actions.update}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUnpublish(agent)}
                                className="text-destructive"
                              >
                                {publishStrings.publish.actions.unpublish}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {isPublishModalOpen && selectedAgent && (
        <PublishAgentModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onSubmit={handlePublishSubmit}
          agent={selectedAgent}
        />
      )}

      {isUnpublishModalOpen && selectedAgent && (
        <UnpublishAgentModal
          isOpen={isUnpublishModalOpen}
          onClose={() => setIsUnpublishModalOpen(false)}
          onConfirm={handleUnpublishSubmit}
          agent={selectedAgent}
        />
      )}
    </div>
  );
}