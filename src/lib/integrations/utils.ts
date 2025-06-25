import { Integration, IntegrationProvider, WhatsAppProviderConstraints, IntegrationField } from './types';
import * as Icons from 'lucide-react';

// WhatsApp provider constraints
export const WHATSAPP_CONSTRAINTS: Record<string, WhatsAppProviderConstraints> = {
  justping: {
    provider: 'WhatsApp JustPing',
    wabaPerApp: 1,
    numbersPerWaba: 'multiple'
  },
  gupshup: {
    provider: 'Gupshup',
    wabaPerApp: 'multiple',
    numbersPerWaba: 1
  },
  wati: {
    provider: 'WATI',
    wabaPerApp: 1,
    numbersPerWaba: 'multiple'
  },
  karix: {
    provider: 'Karix',
    wabaPerApp: 'multiple',
    numbersPerWaba: 'multiple'
  },
  twilio: {
    provider: 'Twilio',
    wabaPerApp: 1,
    numbersPerWaba: 'multiple'
  }
};

// Map icon names to Lucide icons
export const getIntegrationIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'MessageCircle': Icons.MessageCircle,
    'Instagram': Icons.Instagram,
    'Send': Icons.Send,
    'Facebook': Icons.Facebook,
    'Globe': Icons.Globe,
    'ShoppingBag': Icons.ShoppingBag,
    'Layout': Icons.Layout,
    'ShoppingCart': Icons.ShoppingCart,
    'Box': Icons.Box,
    'Linkedin': Icons.Linkedin
  };
  
  return iconMap[iconName] || Icons.MessageCircle;
};

// Get display name for provider
export const getProviderDisplayName = (providerId: string): string => {
  const providerNames: Record<string, string> = {
    gupshup: 'Gupshup',
    wati: 'WATI',
    karix: 'Karix',
    twilio: 'Twilio',
    justping_meta: 'JustPing Meta',
    direct: 'WhatsApp Direct',
    shopifyInbox: 'Shopify Inbox',
    shopifyWhatsApp: 'WhatsApp (SuperLemon)'
  };
  
  return providerNames[providerId] || providerId;
};

// Format date for last sync display
export const formatLastSync = (date: Date | undefined): string => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

// Mock delay for simulating API calls
export const mockDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Simulate API response with random success/failure
export const mockApiResponse = (successRate: number = 0.8): boolean => {
  return Math.random() < successRate;
};

// Validate required fields
export const validateFields = (
  fields: Array<{ name: string; required?: boolean }>,
  values: Record<string, any>
): string[] => {
  const errors: string[] = [];
  
  fields.forEach(field => {
    if (field.required && !values[field.name]) {
      errors.push(`${field.name} is required`);
    }
  });
  
  return errors;
};

// Replace template variables in strings
export const replaceTemplateVars = (
  template: string,
  vars: Record<string, string>
): string => {
  let result = template;
  
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  // Replace environment variables
  result = result.replace(/\${baseUrl}/g, window.location.origin);
  
  return result;
};

// Generate a unique configuration ID
export const generateConfigId = (): string => {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if integration has sub-providers or sub-channels
export const hasSubProviders = (integration: Integration): boolean => {
  return !!((integration.providers && integration.providers.length > 0) || 
            (integration.subChannels && integration.subChannels.length > 0));
};

// Get fields for a specific provider or sub-channel
export const getProviderFields = (
  integration: Integration,
  providerId?: string
): IntegrationField[] => {
  if (!providerId) {
    return integration.fields || [];
  }
  
  // Check in providers first
  const provider = integration.providers?.find(p => p.id === providerId);
  if (provider) return provider.fields || [];
  
  // Check in subChannels
  const subChannel = integration.subChannels?.find(s => s.id === providerId);
  return subChannel?.fields || [];
};

// Get all providers/sub-channels for an integration
export const getAllProviders = (integration: Integration): IntegrationProvider[] => {
  return [...(integration.providers || []), ...(integration.subChannels || [])];
};