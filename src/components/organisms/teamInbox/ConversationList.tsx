'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, MessageSquare, Globe, Phone, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import teamInboxStrings from '@/data/strings/teamInbox.json';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
  selectedInbox: string | null;
  availableInboxes: Array<{ id: string; name: string; teamCount: number }>;
  onInboxChange: (inboxId: string) => void;
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-600" />,
  instagram: <MessageSquare className="h-4 w-4 text-pink-600" />,
  facebook: <MessageSquare className="h-4 w-4 text-blue-600" />,
  telegram: <MessageSquare className="h-4 w-4 text-blue-500" />,
  webchat: <Globe className="h-4 w-4 text-gray-600" />,
  sms: <Phone className="h-4 w-4 text-gray-600" />,
};

const statusColors: Record<string, string> = {
  open: 'bg-green-500',
  inProgress: 'bg-yellow-500',
  closed: 'bg-gray-500',
};

export function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  selectedInbox,
  availableInboxes,
  onInboxChange
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  // Sort conversations
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.lastMessage.timestamp).getTime() - new Date(b.lastMessage.timestamp).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col text-white">
      {/* Inbox Selector */}
      <div className="p-4 border-b border-white/10">
        <Select value={selectedInbox || ''} onValueChange={onInboxChange}>
          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
            <SelectValue placeholder={teamInboxStrings.teamInbox.selector.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {availableInboxes.map((inbox) => (
              <SelectItem key={inbox.id} value={inbox.id}>
                {inbox.name} ({inbox.teamCount} teams)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
          <Input
            placeholder={teamInboxStrings.teamInbox.conversationList.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{teamInboxStrings.teamInbox.filters.state.all}</SelectItem>
              <SelectItem value="open">{teamInboxStrings.teamInbox.filters.state.open}</SelectItem>
              <SelectItem value="inProgress">{teamInboxStrings.teamInbox.filters.state.inProgress}</SelectItem>
              <SelectItem value="closed">{teamInboxStrings.teamInbox.filters.state.closed}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{teamInboxStrings.teamInbox.filters.channel.all}</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="webchat">Web Chat</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{teamInboxStrings.teamInbox.conversationList.sort.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                {teamInboxStrings.teamInbox.conversationList.sort.newest}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                {teamInboxStrings.teamInbox.conversationList.sort.oldest}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>
                {teamInboxStrings.teamInbox.conversationList.sort.priority}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {sortedConversations.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">{teamInboxStrings.teamInbox.conversationList.empty.title}</p>
            <p className="text-sm">{teamInboxStrings.teamInbox.conversationList.empty.description}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-white/10 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-white/10' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.customerAvatar} />
                    <AvatarFallback>
                      {conversation.customerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{conversation.customerName}</h4>
                        {channelIcons[conversation.channel]}
                      </div>
                      <span className="text-xs text-white/60">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-white/80 truncate">
                      {conversation.lastMessage.text}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[conversation.status]}`} />
                      <span className="text-xs text-white/60">
                        {teamInboxStrings.teamInbox.states.default[conversation.status]}
                      </span>
                      {conversation.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">High</Badge>
                      )}
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs ml-auto">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}