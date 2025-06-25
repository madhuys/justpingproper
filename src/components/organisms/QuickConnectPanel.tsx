'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { ConnectChannelModal } from './modals/ConnectChannelModal';
import { useContent } from '@/hooks/useContent';
import channels from '@/data/channels.json';

interface QuickConnectPanelProps {
  connectedChannels?: string[];
  onChannelConnect?: (channelId: string, config: any) => void;
}

export function QuickConnectPanel({ connectedChannels = [], onChannelConnect }: QuickConnectPanelProps) {
  const { content } = useContent('home');
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const handleChannelClick = (channel: any) => {
    setSelectedChannel(channel);
  };

  const handleConnect = (config: any) => {
    if (selectedChannel) {
      onChannelConnect?.(selectedChannel.id, config);
      setSelectedChannel(null);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold">
              {content?.widgets?.quickConnect?.title || 'Quick Connect'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {content?.widgets?.quickConnect?.subtitle || 'Connect your communication channels'}
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            {content?.widgets?.quickConnect?.addChannel || '+ Add Channel'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(channels).map((channel: any) => (
              <ChannelCard
                key={channel.id}
                channel={{
                  ...channel,
                  description: content?.widgets?.quickConnect?.channels?.[channel.id]?.description
                }}
                onClick={() => handleChannelClick(channel)}
                tooltip={content?.tooltips?.[channel.id]}
                connected={connectedChannels.includes(channel.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <ConnectChannelModal
        isOpen={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        channel={selectedChannel}
        onConnect={handleConnect}
      />
    </>
  );
}