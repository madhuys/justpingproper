'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationCard } from '@/components/molecules/IntegrationCard';
import { IntegrationConfigModal } from '@/components/organisms/modals/IntegrationConfigModal';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Integration } from '@/lib/integrations/types';
import integrationsStrings from '@/data/strings/integrations.json';
import channels from '@/data/channels.json';

export default function IntegrationsPage() {
  const { configs, saveConfig, removeConfig, testConnection } = useIntegrations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert channels.json to array format for easier iteration
  const integrations = useMemo(() => {
    return Object.entries(channels).map(([key, value]) => ({
      ...value,
      id: key,
    })) as Integration[];
  }, []);

  // Filter integrations based on search query
  const filteredIntegrations = useMemo(() => {
    if (!searchQuery) return integrations;
    
    const query = searchQuery.toLowerCase();
    return integrations.filter(integration => 
      integration.name.toLowerCase().includes(query) ||
      integration.idealFor.toLowerCase().includes(query) ||
      integration.description.toLowerCase().includes(query)
    );
  }, [integrations, searchQuery]);

  // Get integration status
  const getIntegrationStatus = (integrationId: string) => {
    const config = configs.find(c => c.integrationId === integrationId);
    if (!config) return 'not_connected';
    return config.status;
  };

  // Handle integration card click
  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedIntegration(null);
    setIsModalOpen(false);
  };

  // Handle save configuration
  const handleSaveConfig = async (config: any) => {
    await saveConfig(config);
    handleModalClose();
  };

  // Handle remove configuration
  const handleRemoveConfig = async () => {
    if (selectedIntegration) {
      await removeConfig(selectedIntegration.id);
      handleModalClose();
    }
  };

  // Get existing configuration for selected integration
  const getExistingConfig = () => {
    if (!selectedIntegration) return undefined;
    return configs.find(c => c.integrationId === selectedIntegration.id);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title={integrationsStrings.page.title}
        subtitle={integrationsStrings.page.subtitle}
      />

      {/* Search Bar */}
      <div className="mt-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={integrationsStrings.page.search.placeholder}
            className="pl-9"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            status={getIntegrationStatus(integration.id)}
            onClick={() => handleIntegrationClick(integration)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No integrations found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Integration Configuration Modal */}
      {selectedIntegration && (
        <IntegrationConfigModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          integration={selectedIntegration}
          existingConfig={getExistingConfig()}
          onSave={handleSaveConfig}
          onRemove={getExistingConfig() ? handleRemoveConfig : undefined}
          onTest={testConnection}
        />
      )}
    </div>
  );
}