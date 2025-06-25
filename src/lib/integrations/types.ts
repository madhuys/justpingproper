export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'tel' | 'url' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  tooltip?: string;
  readOnly?: boolean;
  value?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  fields: IntegrationField[];
  description?: string;
  constraints?: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description: string;
  idealFor: string;
  mcpSupported: boolean;
  cost: string;
  comingSoon?: boolean;
  providers?: IntegrationProvider[];
  subChannels?: IntegrationProvider[];
  fields?: IntegrationField[];
}

export interface WABAConfig {
  id: string;
  name: string;
  wabaId: string;
  phoneNumbers: PhoneNumberConfig[];
}

export interface PhoneNumberConfig {
  id: string;
  number: string;
  displayName?: string;
  verified: boolean;
}

export interface IntegrationConfig {
  id: string;
  integrationId: string;
  providerId?: string;
  fields: Record<string, any>;
  wabas?: WABAConfig[]; // For WhatsApp providers
  status: 'connected' | 'action_required' | 'not_connected';
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
  error?: string;
}

export interface IntegrationsState {
  configs: IntegrationConfig[];
  isLoading: boolean;
  error: string | null;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export type IntegrationStatus = 'connected' | 'action_required' | 'not_connected';

export interface WhatsAppProviderConstraints {
  provider: string;
  wabaPerApp: number | 'multiple';
  numbersPerWaba: number | 'multiple';
}