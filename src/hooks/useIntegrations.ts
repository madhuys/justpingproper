'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  IntegrationConfig, 
  IntegrationsState, 
  TestResult 
} from '@/lib/integrations/types';
import { 
  generateConfigId, 
  mockDelay, 
  mockApiResponse,
  validateFields,
  getProviderFields
} from '@/lib/integrations/utils';
import integrationsStrings from '@/data/strings/integrations.json';
import channels from '@/data/channels.json';

const STORAGE_KEY = 'justping_integrations';

export function useIntegrations() {
  const [state, setState] = useState<IntegrationsState>({
    configs: [],
    isLoading: false,
    error: null
  });

  // Load configs from localStorage on mount
  useEffect(() => {
    const loadConfigs = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const configs = JSON.parse(stored);
          // Convert date strings back to Date objects
          const parsedConfigs = configs.map((config: any) => ({
            ...config,
            createdAt: new Date(config.createdAt),
            updatedAt: new Date(config.updatedAt),
            lastSync: config.lastSync ? new Date(config.lastSync) : undefined
          }));
          setState(prev => ({ ...prev, configs: parsedConfigs }));
        }
      } catch (error) {
        console.error('Failed to load integrations:', error);
        setState(prev => ({ ...prev, error: 'Failed to load integrations' }));
      }
    };

    loadConfigs();
  }, []);

  // Save configs to localStorage whenever they change
  useEffect(() => {
    if (state.configs.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.configs));
      } catch (error) {
        console.error('Failed to save integrations:', error);
      }
    }
  }, [state.configs]);

  // Save configuration
  const saveConfig = useCallback(async (configData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await mockDelay(1500);

      const existingIndex = state.configs.findIndex(
        c => c.integrationId === configData.integrationId
      );

      const now = new Date();
      
      // Extract WABAs from configData if present
      const { wabas, integrationId, provider, ...fields } = configData;
      
      const config: IntegrationConfig = {
        id: existingIndex >= 0 ? state.configs[existingIndex].id : generateConfigId(),
        integrationId: integrationId,
        providerId: provider,
        fields: fields,
        wabas: wabas || undefined,
        status: 'connected',
        createdAt: existingIndex >= 0 ? state.configs[existingIndex].createdAt : now,
        updatedAt: now,
        lastSync: now,
        error: undefined
      };

      setState(prev => {
        const newConfigs = [...prev.configs];
        if (existingIndex >= 0) {
          newConfigs[existingIndex] = config;
        } else {
          newConfigs.push(config);
        }
        return { ...prev, configs: newConfigs, isLoading: false };
      });

      toast.success(integrationsStrings.modal.messages.save_success);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to save configuration' }));
      toast.error('Failed to save configuration');
      throw error;
    }
  }, [state.configs]);

  // Remove configuration
  const removeConfig = useCallback(async (integrationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await mockDelay(1000);

      setState(prev => ({
        ...prev,
        configs: prev.configs.filter(c => c.integrationId !== integrationId),
        isLoading: false
      }));

      // Clear from localStorage if no configs left
      if (state.configs.length === 1) {
        localStorage.removeItem(STORAGE_KEY);
      }

      toast.success(integrationsStrings.modal.messages.remove_success);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to remove configuration' }));
      toast.error('Failed to remove configuration');
      throw error;
    }
  }, [state.configs]);

  // Test connection
  const testConnection = useCallback(async (configData: any): Promise<TestResult> => {
    try {
      await mockDelay(2000);

      // Get the integration and validate fields
      const integration = (channels as any)[configData.integrationId];
      if (!integration) {
        throw new Error('Integration not found');
      }

      const fields = getProviderFields(integration, configData.provider);
      const errors = validateFields(fields, configData);

      if (errors.length > 0) {
        return {
          success: false,
          message: integrationsStrings.modal.messages.required_fields,
          details: errors
        };
      }
      
      // Additional validation for WhatsApp WABAs
      if (configData.integrationId === 'whatsapp' && configData.wabas) {
        if (configData.wabas.length === 0) {
          return {
            success: false,
            message: 'At least one WABA is required for WhatsApp integration',
            details: 'Please add a WABA configuration'
          };
        }
        
        // Validate each WABA has required fields
        for (const waba of configData.wabas) {
          if (!waba.name || !waba.wabaId) {
            return {
              success: false,
              message: 'Invalid WABA configuration',
              details: 'Each WABA must have a name and WABA ID'
            };
          }
          
          if (waba.phoneNumbers.length === 0) {
            return {
              success: false,
              message: 'Invalid WABA configuration',
              details: `WABA "${waba.name}" must have at least one phone number`
            };
          }
        }
      }

      // Simulate API response
      const success = mockApiResponse(0.8);

      if (success) {
        return {
          success: true,
          message: integrationsStrings.modal.messages.test_success
        };
      } else {
        return {
          success: false,
          message: integrationsStrings.modal.messages.test_failure,
          details: 'Invalid credentials or connection timeout'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Update configuration status
  const updateConfigStatus = useCallback((
    integrationId: string, 
    status: IntegrationConfig['status'],
    error?: string
  ) => {
    setState(prev => {
      const newConfigs = prev.configs.map(config => {
        if (config.integrationId === integrationId) {
          return {
            ...config,
            status,
            error,
            updatedAt: new Date()
          };
        }
        return config;
      });
      return { ...prev, configs: newConfigs };
    });
  }, []);

  return {
    configs: state.configs,
    isLoading: state.isLoading,
    error: state.error,
    saveConfig,
    removeConfig,
    testConnection,
    updateConfigStatus
  };
}