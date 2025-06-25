'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/atoms/Loader';
import { FileExplorer } from '@/components/organisms/FileExplorer';
import { DriveConfigModal } from '@/components/organisms/modals/DriveConfigModal';
import { useFileManager } from '@/hooks/useFileManager';
import fileProviders from '@/data/fileProviders.json';
import fileManagementStrings from '@/data/strings/fileManagement.json';
import stateConfig from '@/data/states/fileManagement.json';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Cloud, 
  FolderOpen,
  HardDrive,
  Plus,
  X
} from 'lucide-react';

// Icon mapping for providers
const providerIcons: Record<string, React.ElementType> = {
  'google-drive': HardDrive,
  'dropbox': Cloud,
  'onedrive': FolderOpen
};

export default function FileManagerPage() {
  const {
    connectedProviders,
    currentProvider,
    isLoading,
    error,
    connectProvider,
    disconnectProvider,
    setCurrentProvider
  } = useFileManager();

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showProviderGallery, setShowProviderGallery] = useState(false);
  const [openDrives, setOpenDrives] = useState<string[]>(() => {
    // Initialize with connected providers or currentProvider
    if (currentProvider && connectedProviders[currentProvider]) {
      return [currentProvider];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    return currentProvider || 'gallery';
  });

  const providers = Object.values(fileProviders.providers);
  const hasConnectedProviders = Object.keys(connectedProviders).length > 0;

  // Update open drives when a provider is connected
  useEffect(() => {
    if (currentProvider && connectedProviders[currentProvider] && !openDrives.includes(currentProvider)) {
      setOpenDrives(prev => [...prev, currentProvider]);
      setActiveTab(currentProvider);
    }
  }, [currentProvider, connectedProviders]);

  const handleProviderAction = (providerId: string) => {
    setSelectedProvider(providerId);
    setIsConfigModalOpen(true);
  };

  const handleConnect = async (providerId: string, tokens: any) => {
    try {
      await connectProvider(providerId, tokens);
      setIsConfigModalOpen(false);
      // Automatically open the file explorer after connection
      setCurrentProvider(providerId);
    } catch (error) {
      // Error is handled in the modal
      throw error;
    }
  };

  const handleDisconnect = async (providerId: string) => {
    try {
      await disconnectProvider(providerId);
      setIsConfigModalOpen(false);
    } catch (error) {
      // Error is handled in the modal
      throw error;
    }
  };
  
  // Component for provider gallery
  const ProviderGallery = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {providers.map((provider) => {
        const isConnected = !!connectedProviders[provider.id];
        const Icon = providerIcons[provider.id] || HardDrive;
        
        return (
          <Card
            key={provider.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (isConnected) {
                setCurrentProvider(provider.id);
              } else {
                handleProviderAction(provider.id);
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${provider.color}20` }}
                  >
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: provider.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    {isConnected && (
                      <Badge variant="default" className="bg-green-500 mt-1">
                        {fileManagementStrings.providers.connected}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                {provider.description}
              </CardDescription>
              <Button
                variant={isConnected ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProviderAction(provider.id);
                }}
              >
                {isConnected 
                  ? fileManagementStrings.providers.manage 
                  : fileManagementStrings.providers.connect}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
  
  // If we have connected providers and active tabs, show the tabbed interface
  if (hasConnectedProviders || openDrives.length > 0) {
    return (
      <div className="h-full bg-background p-8">
        <div className="container mx-auto max-w-full h-full flex flex-col">
          <PageHeader
            title={fileManagementStrings.page.title}
            description={fileManagementStrings.page.description}
            className="mb-4"
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-fit">
              {openDrives.map(driveId => {
                const provider = fileProviders.providers[driveId];
                const Icon = providerIcons[driveId] || HardDrive;
                return (
                  <TabsTrigger key={driveId} value={driveId} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: provider?.color }} />
                    <span>{provider?.name || driveId}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDrives(prev => prev.filter(id => id !== driveId));
                        if (activeTab === driveId) {
                          const remaining = openDrives.filter(id => id !== driveId);
                          setActiveTab(remaining.length > 0 ? remaining[0] : 'gallery');
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Drive</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 mt-4">
              {openDrives.map(driveId => (
                <TabsContent key={driveId} value={driveId} className="h-full mt-0">
                  <FileExplorer 
                    provider={driveId}
                    onBack={() => {
                      // Don't go back to gallery, stay in tabs
                    }}
                  />
                </TabsContent>
              ))}
              <TabsContent value="gallery" className="h-full mt-0">
                <ProviderGallery />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <PageHeader
          title={fileManagementStrings.page.title}
          description={fileManagementStrings.page.description}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            {!hasConnectedProviders && (
              <div className="mb-8">
                <EmptyState
                  icon={Cloud}
                  title={fileManagementStrings.page.emptyState.title}
                  description={fileManagementStrings.page.emptyState.description}
                />
              </div>
            )}

            <ProviderGallery />
          </>
        )}

        {selectedProvider && (
          <DriveConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => {
              setIsConfigModalOpen(false);
              setSelectedProvider(null);
            }}
            provider={fileProviders.providers[selectedProvider]}
            isConnected={!!connectedProviders[selectedProvider]}
            onConnect={(tokens) => handleConnect(selectedProvider, tokens)}
            onDisconnect={() => handleDisconnect(selectedProvider)}
          />
        )}
      </div>
    </div>
  );
}