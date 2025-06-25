'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/atoms/PasswordInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Integration,
  IntegrationConfig,
  IntegrationField,
  TestResult,
  WABAConfig
} from '@/lib/integrations/types';
import {
  getProviderDisplayName,
  hasSubProviders,
  getProviderFields,
  replaceTemplateVars,
  getAllProviders,
  WHATSAPP_CONSTRAINTS
} from '@/lib/integrations/utils';
import { WhatsAppProviderConfig } from '@/components/pages/integrations/WhatsAppProviderConfig';
import integrationsStrings from '@/data/strings/integrations.json';

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration;
  existingConfig?: IntegrationConfig;
  onSave: (config: any) => Promise<void>;
  onRemove?: () => Promise<void>;
  onTest: (config: any) => Promise<TestResult>;
}

type ConfigStep = 'provider' | 'configuration';

export function IntegrationConfigModal({
  isOpen,
  onClose,
  integration,
  existingConfig,
  onSave,
  onRemove,
  onTest
}: IntegrationConfigModalProps) {
  const [step, setStep] = useState<ConfigStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [wabas, setWabas] = useState<WABAConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const isEditMode = !!existingConfig;
  const hasProviders = hasSubProviders(integration);

  // Initialize form data on mount or when config changes
  useEffect(() => {
    if (existingConfig) {
      setFormData(existingConfig.fields);
      setWabas(existingConfig.wabas || []);
      if (existingConfig.providerId) {
        setSelectedProvider(existingConfig.providerId);
      }
      // Skip provider selection for existing configs
      setStep(hasProviders && !existingConfig.providerId ? 'provider' : 'configuration');
    } else {
      setFormData({});
      setWabas([]);
      setSelectedProvider('');
      setStep(hasProviders ? 'provider' : 'configuration');
    }
    setTestResult(null);
  }, [existingConfig, integration, hasProviders]);

  // Get current fields based on selected provider
  const currentFields = getProviderFields(integration, selectedProvider);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(integrationsStrings.modal.messages.copied);
  };

  // Handle provider selection
  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setFormData({});
    setWabas([]);
    setTestResult(null);
    // Automatically move to configuration step
    setStep('configuration');
  };

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setTestResult(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (hasProviders && !selectedProvider) {
      toast.error(integrationsStrings.modal.messages.select_provider);
      return false;
    }

    const missingFields = currentFields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(integrationsStrings.modal.messages.required_fields);
      return false;
    }

    return true;
  };

  // Handle test connection
  const handleTest = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const configData = {
        integrationId: integration.id,
        provider: selectedProvider,
        ...formData,
        // Include WABAs for WhatsApp integrations
        ...(integration.id === 'whatsapp' && { wabas })
      };

      const result = await onTest(configData);
      setTestResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Test failed');
      setTestResult({
        success: false,
        message: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    // Additional validation for WhatsApp WABAs
    if (integration.id === 'whatsapp' && wabas.length === 0) {
      toast.error('Please add at least one WABA');
      return;
    }

    setIsLoading(true);
    try {
      const configData = {
        integrationId: integration.id,
        provider: selectedProvider,
        ...formData,
        // Include WABAs for WhatsApp integrations
        ...(integration.id === 'whatsapp' && { wabas })
      };

      await onSave(configData);
      onClose();
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove
  const handleRemove = async () => {
    if (!onRemove) return;

    setIsLoading(true);
    try {
      await onRemove();
      setShowRemoveDialog(false);
      onClose();
    } catch (error) {
      toast.error('Failed to remove integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Render field
  const renderField = (field: IntegrationField) => {
    const value = field.value 
      ? replaceTemplateVars(field.value, { widgetKey: 'demo_key' })
      : formData[field.name] || '';

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{field.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {field.type === 'textarea' ? (
          <div className="relative">
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => !field.readOnly && handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              className={cn(field.readOnly && 'pr-10', 'min-h-[100px] font-mono text-sm')}
            />
            {field.readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(value)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : field.type === 'select' ? (
          <Select
            value={formData[field.name]}
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'password' ? (
          <PasswordInput
            id={field.name}
            value={value}
            onChange={(e) => !field.readOnly && handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
          />
        ) : (
          <div className="relative">
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => !field.readOnly && handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              className={field.readOnly ? 'pr-10' : ''}
            />
            {field.readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6"
                onClick={() => copyToClipboard(value)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {field.readOnly && (
          <p className="text-xs text-muted-foreground">
            {integrationsStrings.modal.fields.help.readonly}
          </p>
        )}
      </div>
    );
  };

  // Render provider selection
  const renderProviderSelection = () => {
    // Support both providers and subChannels
    const allProviders = getAllProviders(integration);
    if (!allProviders || allProviders.length === 0) return null;

    const isWhatsApp = integration.id === 'whatsapp';
    const strings = isWhatsApp ? integrationsStrings.modal.providers.whatsapp : null;

    return (
      <div className="space-y-4">
        {isWhatsApp && (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">{strings?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{strings?.subtitle}</p>
          </div>
        )}

        <div className="grid gap-3">
          {allProviders.map((provider) => {
            const providerStrings = isWhatsApp ? (strings as any)[provider.id] : null;
            const constraints = isWhatsApp ? WHATSAPP_CONSTRAINTS[provider.id] : null;
            
            return (
              <Card
                key={provider.id}
                className={cn(
                  "cursor-pointer transition-all",
                  "hover:border-primary hover:shadow-sm",
                  selectedProvider === provider.id && "border-primary shadow-sm"
                )}
                onClick={() => handleProviderSelect(provider.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    {selectedProvider === provider.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {provider.description || providerStrings?.description || ''}
                  </CardDescription>
                </CardHeader>
                {constraints && providerStrings?.constraints && (
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      {providerStrings.constraints}
                    </Badge>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Render configuration form
  const renderConfigurationForm = () => {
    const isWhatsApp = integration.id === 'whatsapp';
    
    return (
      <div className="space-y-6">
        {/* Provider info (if applicable) */}
        {selectedProvider && (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">
                Provider: {getProviderDisplayName(selectedProvider)}
              </span>
              {!isEditMode && hasProviders && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('provider')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form fields */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            {currentFields.map(renderField)}
          </CardContent>
        </Card>

        {/* WhatsApp WABA Configuration */}
        {isWhatsApp && selectedProvider && (
          <WhatsAppProviderConfig
            providerId={selectedProvider}
            wabas={wabas}
            onChange={setWabas}
            apiKey={formData.apiKey || formData.authToken || formData.accessToken}
          />
        )}

        {/* Test result */}
        {testResult && (
          <Card className={cn(
            testResult.success 
              ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/20"
              : "border-red-500/50 bg-red-50/50 dark:bg-red-900/20"
          )}>
            <CardContent className="flex items-start gap-3 p-4">
              {testResult.success ? (
                <Check className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" />
              ) : (
                <X className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className={cn(
                  "font-medium",
                  testResult.success 
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                )}>
                  {testResult.message}
                </p>
                {testResult.details && (
                  <p className="text-sm mt-1 opacity-90">
                    {typeof testResult.details === 'string' 
                      ? testResult.details 
                      : JSON.stringify(testResult.details)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const modalTitle = replaceTemplateVars(
    isEditMode 
      ? integrationsStrings.modal.title.manage 
      : integrationsStrings.modal.title.connect,
    { name: integration.name }
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>
              {integration.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {step === 'provider' ? renderProviderSelection() : renderConfigurationForm()}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {/* Left side actions */}
            <div className="flex-1">
              {isEditMode && onRemove && (
                <Button
                  variant="destructive"
                  onClick={() => setShowRemoveDialog(true)}
                  disabled={isLoading}
                >
                  {integrationsStrings.modal.actions.remove}
                </Button>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isLoading || isTesting}>
                  {integrationsStrings.modal.actions.cancel}
                </Button>
              </DialogClose>

              {step === 'configuration' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleTest}
                    disabled={isLoading || isTesting}
                  >
                    {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isTesting 
                      ? integrationsStrings.modal.actions.testing 
                      : integrationsStrings.modal.actions.test}
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={isLoading || isTesting}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading 
                      ? integrationsStrings.modal.actions.saving 
                      : integrationsStrings.modal.actions.save}
                  </Button>
                </>
              )}

            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration</AlertDialogTitle>
            <AlertDialogDescription>
              {integrationsStrings.modal.messages.remove_confirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {integrationsStrings.modal.actions.cancel}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading 
                ? integrationsStrings.modal.actions.removing 
                : integrationsStrings.modal.actions.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}