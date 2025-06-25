'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, subYears } from 'date-fns';
import { 
  MessageCircle, 
  Phone, 
  Send, 
  CheckCheck, 
  Eye, 
  MessageSquare,
  AlertCircle,
  Clock,
  Loader2,
  Inbox,
  UserCheck,
  Users,
  HandHelping,
  UserX,
  PauseCircle,
  CheckCircle2,
  Instagram,
  Globe,
  MessageCircleIcon,
  Linkedin,
  ShoppingBag,
  Layout,
  ShoppingCart,
  Box
} from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ConversationsData {
  total: number;
  inbound: number;
  outbound: number;
  channels?: {
    whatsapp?: number;
    instagram?: number;
    telegram?: number;
    messenger?: number;
    web?: number;
    shopify?: number;
    wix?: number;
    bigcommerce?: number;
    magento?: number;
    linkedin?: number;
  };
  outboundStats?: {
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    sending: number;
    failed: number;
    processing: number;
    queued: number;
  };
  inboundStats?: {
    received: number;
    acknowledged: number;
    assigned: number;
    inProgress: number;
    manualIntervention: number;
    pendingCustomer: number;
    onHold: number;
    resolved: number;
  };
}

interface ConversationsWidgetExpandedProps {
  conversations: ConversationsData;
  onDateRangeChange?: (range: string) => void;
}

const outboundStatusConfig = [
  { key: 'sent', label: 'Sent', icon: Send, color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'delivered', label: 'Delivered', icon: CheckCheck, color: 'bg-green-500', textColor: 'text-green-600' },
  { key: 'read', label: 'Read', icon: Eye, color: 'bg-purple-500', textColor: 'text-purple-600' },
  { key: 'replied', label: 'Replied', icon: MessageSquare, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
  { key: 'sending', label: 'Sending', icon: Loader2, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { key: 'failed', label: 'Failed', icon: AlertCircle, color: 'bg-red-500', textColor: 'text-red-600' },
  { key: 'processing', label: 'Processing', icon: Clock, color: 'bg-orange-500', textColor: 'text-orange-600' },
  { key: 'queued', label: 'Queued', icon: Inbox, color: 'bg-gray-500', textColor: 'text-gray-600' }
];

const inboundStatusConfig = [
  { key: 'received', label: 'Received', icon: Inbox, color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'acknowledged', label: 'Acknowledged', icon: CheckCheck, color: 'bg-green-500', textColor: 'text-green-600' },
  { key: 'assigned', label: 'Assigned', icon: UserCheck, color: 'bg-purple-500', textColor: 'text-purple-600' },
  { key: 'inProgress', label: 'In Progress', icon: Loader2, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { key: 'manualIntervention', label: 'Manual Intervention', icon: HandHelping, color: 'bg-orange-500', textColor: 'text-orange-600' },
  { key: 'pendingCustomer', label: 'Pending Customer', icon: UserX, color: 'bg-pink-500', textColor: 'text-pink-600' },
  { key: 'onHold', label: 'On Hold', icon: PauseCircle, color: 'bg-gray-500', textColor: 'text-gray-600' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'bg-teal-500', textColor: 'text-teal-600' }
];

const channelIcons = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  telegram: Send,
  messenger: MessageCircleIcon,
  web: Globe,
  shopify: ShoppingBag,
  wix: Layout,
  bigcommerce: ShoppingCart,
  magento: Box,
  linkedin: Linkedin
};

const channelNames = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram DMs',
  telegram: 'Telegram',
  messenger: 'FB Messenger',
  web: 'Web Agent',
  shopify: 'Shopify',
  wix: 'Wix',
  bigcommerce: 'BigCommerce',
  magento: 'Magento',
  linkedin: 'LinkedIn'
};

export function ConversationsWidgetExpanded({ conversations, onDateRangeChange }: ConversationsWidgetExpandedProps) {
  const { content } = useContent('home');
  const [mainTab, setMainTab] = useState('outbound');
  const [channelTab, setChannelTab] = useState('all');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Mock data - replace with real data
  const mockData = {
    channels: {
      whatsapp: 45,
      instagram: 23,
      telegram: 12,
      messenger: 18,
      web: 44,
      shopify: 15,
      wix: 8,
      bigcommerce: 6,
      magento: 4,
      linkedin: 0
    },
    outboundStats: {
      sent: 120,
      delivered: 115,
      read: 98,
      replied: 76,
      sending: 5,
      failed: 3,
      processing: 8,
      queued: 12
    },
    inboundStats: {
      received: 156,
      acknowledged: 145,
      assigned: 142,
      inProgress: 23,
      manualIntervention: 8,
      pendingCustomer: 15,
      onHold: 5,
      resolved: 89
    }
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Inbound',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Outbound',
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  const getChannelStats = () => {
    if (channelTab === 'all') {
      return mainTab === 'outbound' ? mockData.outboundStats : mockData.inboundStats;
    }
    // Return channel-specific stats (mock for now)
    return mainTab === 'outbound' ? mockData.outboundStats : mockData.inboundStats;
  };

  const statusConfig = mainTab === 'outbound' ? outboundStatusConfig : inboundStatusConfig;
  const currentStats = getChannelStats();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Conversations Overview</CardTitle>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(dates: [Date | null, Date | null]) => {
              const [start, end] = dates;
              if (start) setStartDate(start);
              if (end) setEndDate(end);
            }}
            minDate={subYears(new Date(), 1)}
            maxDate={new Date()}
            dateFormat="MMM dd, yyyy"
            customInput={
              <Button variant="outline" className="justify-start text-left font-normal">
                {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
              </Button>
            }
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Section */}
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="inbound" 
              className="flex items-center gap-2 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Phone className="h-4 w-4" />
              Inbound ({conversations.inbound})
            </TabsTrigger>
            <TabsTrigger 
              value="outbound" 
              className="flex items-center gap-2 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Send className="h-4 w-4" />
              Outbound ({conversations.outbound})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={mainTab} className="space-y-4">
            {/* Channel Sub-tabs */}
            <Tabs value={channelTab} onValueChange={setChannelTab}>
              <div className="w-full flex justify-center">
                <div className="w-full max-w-[1440px] overflow-x-auto">
                  <TabsList className="flex w-full justify-between gap-2 h-auto bg-transparent p-0">
                  <TabsTrigger 
                    value="all" 
                    className="flex flex-col items-center gap-1 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg min-w-[80px]"
                  >
                    <span className="text-lg font-semibold">{conversations.total}</span>
                    <Users className="h-5 w-5" />
                    <span className="text-xs">All</span>
                  </TabsTrigger>
                  {Object.entries(mockData.channels).map(([channel, count]) => {
                    const Icon = channelIcons[channel as keyof typeof channelIcons];
                    const isLinkedIn = channel === 'linkedin';
                    const name = channelNames[channel as keyof typeof channelNames];
                    
                    return (
                      <TabsTrigger 
                        key={channel} 
                        value={channel}
                        className={cn(
                          "flex flex-col items-center gap-1 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg min-w-[80px]",
                          isLinkedIn && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isLinkedIn}
                      >
                        <span className="text-lg font-semibold">{isLinkedIn ? '-' : count}</span>
                        <Icon className="h-5 w-5" />
                        <span className="text-xs whitespace-nowrap">
                          {name}{isLinkedIn && <span className="text-[10px] text-muted-foreground ml-1">(Soon)</span>}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                  </TabsList>
                </div>
              </div>

              <TabsContent value={channelTab} className="mt-6">
                {/* Status Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {statusConfig.map((status) => {
                    const Icon = status.icon;
                    const value = currentStats[status.key as keyof typeof currentStats] || 0;
                    
                    return (
                      <Card key={status.key} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                {status.label}
                              </p>
                              <p className="text-2xl font-bold">{value}</p>
                            </div>
                            <div className={cn(
                              "p-2 rounded-lg",
                              status.color,
                              "bg-opacity-10"
                            )}>
                              <Icon className={cn("h-5 w-5", status.textColor)} />
                            </div>
                          </div>
                          {/* Accent bar at bottom */}
                          <div className={cn(
                            "absolute bottom-0 left-0 right-0 h-1",
                            status.color
                          )} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}