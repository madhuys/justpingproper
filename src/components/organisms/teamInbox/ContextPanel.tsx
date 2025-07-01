'use client';

import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Tag, Plus, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import teamInboxStrings from '@/data/strings/teamInbox.json';

interface ContextPanelProps {
  conversation: any;
  onStatusChange: (status: string) => void;
}

export function ContextPanel({ conversation, onStatusChange }: ContextPanelProps) {
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'private' | 'shared'>('private');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    
    // In a real app, this would save the note
    console.log('Adding note:', { text: noteText, type: noteType });
    setNoteText('');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="details">{teamInboxStrings.teamInbox.contextPanel.tabs.details}</TabsTrigger>
          <TabsTrigger value="notes">{teamInboxStrings.teamInbox.contextPanel.tabs.notes}</TabsTrigger>
          <TabsTrigger value="data">{teamInboxStrings.teamInbox.contextPanel.tabs.data}</TabsTrigger>
          <TabsTrigger value="history">{teamInboxStrings.teamInbox.contextPanel.tabs.history}</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="details" className="p-4 space-y-4 mt-0">
            {/* Customer Avatar and Name */}
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarImage src={conversation.customerAvatar} />
                <AvatarFallback>
                  {conversation.customerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{conversation.customerName}</h3>
            </div>

            {/* Customer Details */}
            <Card className="p-4 space-y-3">
              <h4 className="font-medium text-sm">
                {teamInboxStrings.teamInbox.contextPanel.details.title}
              </h4>
              
              {conversation.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.customerPhone}</span>
                </div>
              )}
              
              {conversation.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.customerEmail}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>India</span>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">
                  {teamInboxStrings.teamInbox.contextPanel.details.tags}
                </h4>
                <Button size="sm" variant="ghost">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {conversation.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-4">
              <h4 className="font-medium text-sm mb-3">Actions</h4>
              <div className="space-y-2">
                <Select value={conversation.status} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{teamInboxStrings.teamInbox.states.default.open}</SelectItem>
                    <SelectItem value="inProgress">{teamInboxStrings.teamInbox.states.default.inProgress}</SelectItem>
                    <SelectItem value="closed">{teamInboxStrings.teamInbox.states.default.closed}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full">
                  {teamInboxStrings.teamInbox.contextPanel.actions.addToContact}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="p-4 space-y-4 mt-0">
            <Card className="p-4">
              <h4 className="font-medium text-sm mb-3">
                {teamInboxStrings.teamInbox.contextPanel.notes.title}
              </h4>
              
              <div className="space-y-3">
                <Select value={noteType} onValueChange={(value: 'private' | 'shared') => setNoteType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">{teamInboxStrings.teamInbox.contextPanel.notes.private}</SelectItem>
                    <SelectItem value="shared">{teamInboxStrings.teamInbox.contextPanel.notes.shared}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder={teamInboxStrings.teamInbox.contextPanel.notes.placeholder}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                
                <Button onClick={handleAddNote} className="w-full">
                  {teamInboxStrings.teamInbox.contextPanel.notes.add}
                </Button>
              </div>
            </Card>

            {/* Existing Notes */}
            <div className="space-y-3">
              {conversation.notes?.map((note: any) => (
                <Card key={note.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={note.type === 'private' ? 'secondary' : 'default'} className="text-xs">
                      {note.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {teamInboxStrings.teamInbox.contextPanel.notes.by.replace('{{author}}', note.author)}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data" className="p-4 mt-0">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">
                  {teamInboxStrings.teamInbox.contextPanel.capturedData.title}
                </h4>
                <Button size="sm" variant="ghost">
                  <Download className="h-3 w-3 mr-1" />
                  {teamInboxStrings.teamInbox.contextPanel.capturedData.export}
                </Button>
              </div>
              
              {conversation.capturedData && Object.keys(conversation.capturedData).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(conversation.capturedData).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 py-2 border-b last:border-0">
                      <span className="text-sm font-medium">{key}</span>
                      <span className="text-sm text-muted-foreground">{value as string}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {teamInboxStrings.teamInbox.contextPanel.capturedData.empty}
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm">
                    {teamInboxStrings.teamInbox.contextPanel.history.stateChanged.replace('{{state}}', 'Open')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(conversation.createdAt)}
                  </p>
                </div>
              </div>
              
              {conversation.assignedTo && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm">
                      {teamInboxStrings.teamInbox.contextPanel.history.assigned.replace('{{agent}}', conversation.assignedToName || 'Agent')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}