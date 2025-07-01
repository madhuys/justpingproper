'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Upload,
  Type,
  Image,
  Video,
  FileText,
  Smartphone,
  Monitor,
  Clock
} from 'lucide-react';
import templatesStrings from '@/data/strings/templates.json';
import templatesState from '@/data/states/templates.json';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getIntegrationIcon } from '@/lib/integrations/utils';
import TemplatePreview from '@/components/molecules/TemplatePreview';
import TemplateVariableInput from '@/components/molecules/TemplateVariableInput';
import TemplateComplianceCheck from '@/components/molecules/TemplateComplianceCheck';
import TemplateButtonEditor from '@/components/molecules/TemplateButtonEditor';

interface TemplateBuilderProps {
  templateId?: string;
}

interface TemplateVersion {
  version: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
  body: string;
  header?: { type: 'text' | 'media'; value: string };
  footer?: string;
  buttons?: any[];
  providerParams: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Template {
  id: string;
  name: string;
  provider: string;
  language: string;
  versions: TemplateVersion[];
  currentVersion: number;
}

export default function TemplateBuilder({ templateId }: TemplateBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  
  // Form state
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [language, setLanguage] = useState('en');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [messageTag, setMessageTag] = useState('');
  
  // Content state
  const [headerType, setHeaderType] = useState<'text' | 'media'>('text');
  const [headerText, setHeaderText] = useState('');
  const [headerMedia, setHeaderMedia] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState<any[]>([]);
  
  // Variable preview state
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  // Compliance state
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);
  
  // Approval polling
  const [pollingStatus, setPollingStatus] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = (id: string) => {
    const savedTemplates = localStorage.getItem('jp-templates');
    if (savedTemplates) {
      const templates = JSON.parse(savedTemplates);
      const found = templates.find((t: Template) => t.id === id);
      if (found) {
        setTemplate(found);
        const currentVersion = found.versions[found.currentVersion];
        
        // Load template data
        setName(found.name);
        setProvider(found.provider);
        setLanguage(found.language);
        setBody(currentVersion.body);
        setFooter(currentVersion.footer || '');
        setButtons(currentVersion.buttons || []);
        
        if (currentVersion.header) {
          setHeaderType(currentVersion.header.type);
          if (currentVersion.header.type === 'text') {
            setHeaderText(currentVersion.header.value);
          } else {
            setHeaderMedia(currentVersion.header.value);
          }
        }
        
        // Load provider params
        if (currentVersion.providerParams.category) {
          setCategory(currentVersion.providerParams.category as string);
        }
        if (currentVersion.providerParams.messageTag) {
          setMessageTag(currentVersion.providerParams.messageTag as string);
        }
      }
    }
  };

  const selectedProvider = templatesState.providers.find(p => p.id === provider);
  
  const validateTemplate = () => {
    const issues: string[] = [];
    
    if (!name.trim()) {
      issues.push('Template name is required');
    }
    
    if (!provider) {
      issues.push('Provider selection is required');
    }
    
    if (!body.trim()) {
      issues.push('Message body is required');
    }
    
    if (selectedProvider) {
      // Character limit checks
      if (body.length > selectedProvider.limits.body) {
        issues.push(`Body exceeds character limit (${body.length}/${selectedProvider.limits.body})`);
      }
      
      if (selectedProvider.limits.footer && footer.length > selectedProvider.limits.footer) {
        issues.push(`Footer exceeds character limit (${footer.length}/${selectedProvider.limits.footer})`);
      }
      
      // WhatsApp specific
      if (provider === 'whatsapp' && !category) {
        issues.push('Category is required for WhatsApp');
      }
      
      // Messenger specific
      if (provider === 'messenger' && !messageTag) {
        issues.push('Message tag required for Messenger');
      }
      
      // Button limits
      if (buttons.length > 0) {
        const maxButtons = selectedProvider.limits.buttons?.total || 
                          selectedProvider.limits.buttons?.quickReply || 
                          selectedProvider.limits.buttons?.callToAction || 0;
        if (buttons.length > maxButtons) {
          issues.push(`Too many buttons (${buttons.length}/${maxButtons})`);
        }
      }
    }
    
    // Check for duplicate placeholders
    const placeholders = body.match(/\{\{\d+\}\}/g) || [];
    const uniquePlaceholders = new Set(placeholders);
    if (placeholders.length !== uniquePlaceholders.size) {
      issues.push('Duplicate placeholders found');
    }
    
    setComplianceIssues(issues);
    return issues.length === 0;
  };

  const handleSave = async (status: 'draft' | 'submitted' | 'approved' = 'draft') => {
    if (!validateTemplate() && status !== 'draft') {
      toast.error('Please fix all compliance issues before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const version: TemplateVersion = {
        version: template ? template.versions.length + 1 : 1,
        status,
        body,
        footer: footer || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        providerParams: {
          ...(category && { category }),
          ...(messageTag && { messageTag })
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user' // Would come from auth context
      };
      
      if (headerType === 'text' && headerText) {
        version.header = { type: 'text', value: headerText };
      } else if (headerType === 'media' && headerMedia) {
        version.header = { type: 'media', value: headerMedia };
      }
      
      let savedTemplate: Template;
      
      if (template) {
        // Update existing template
        savedTemplate = {
          ...template,
          versions: [...template.versions, version],
          currentVersion: template.versions.length
        };
      } else {
        // Create new template
        savedTemplate = {
          id: Date.now().toString(),
          name,
          provider,
          language,
          versions: [version],
          currentVersion: 0
        };
      }
      
      // Save to localStorage
      const savedTemplates = localStorage.getItem('jp-templates');
      const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
      
      if (template) {
        const index = templates.findIndex((t: Template) => t.id === template.id);
        if (index !== -1) {
          templates[index] = savedTemplate;
        }
      } else {
        templates.push(savedTemplate);
      }
      
      localStorage.setItem('jp-templates', JSON.stringify(templates));
      
      toast.success(templatesStrings.templates.builder.messages.saveSuccess);
      
      // If submitted to WhatsApp, start polling
      if (status === 'submitted' && provider === 'whatsapp') {
        startApprovalPolling(savedTemplate.id);
      }
      
      // Navigate back to dashboard
      router.push('/templates');
      
    } catch (error) {
      toast.error(templatesStrings.templates.builder.messages.error);
    } finally {
      setLoading(false);
    }
  };

  const startApprovalPolling = (templateId: string) => {
    setPollingStatus(true);
    
    // Simulate approval polling
    const pollInterval = setInterval(() => {
      const random = Math.random();
      if (random > 0.7) {
        // Approved
        updateTemplateStatus(templateId, 'approved');
        clearInterval(pollInterval);
        toast.success(templatesStrings.templates.approvalStatus.approved.replace('{{provider}}', 'WhatsApp'));
      } else if (random < 0.1) {
        // Rejected
        updateTemplateStatus(templateId, 'rejected');
        clearInterval(pollInterval);
        toast.error(templatesStrings.templates.approvalStatus.rejected.replace('{{reason}}', 'Invalid format'));
      }
    }, 5000);
    
    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingStatus(false);
    }, 60000);
  };

  const updateTemplateStatus = (templateId: string, status: 'approved' | 'rejected') => {
    const savedTemplates = localStorage.getItem('jp-templates');
    if (savedTemplates) {
      const templates = JSON.parse(savedTemplates);
      const template = templates.find((t: Template) => t.id === templateId);
      if (template) {
        template.versions[template.currentVersion].status = status;
        template.versions[template.currentVersion].updatedAt = new Date().toISOString();
        localStorage.setItem('jp-templates', JSON.stringify(templates));
      }
    }
    setPollingStatus(false);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to server and get URL
      const url = URL.createObjectURL(file);
      setHeaderMedia(url);
      toast.success('Media uploaded successfully');
    }
  };

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{\d+\}\}/g) || [];
    return [...new Set(matches)].sort();
  };

  const allVariables = [
    ...extractVariables(headerText),
    ...extractVariables(body),
    ...extractVariables(footer)
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{templatesStrings.templates.builder.title}</h1>
            {template && (
              <p className="text-sm text-muted-foreground">
                {templatesStrings.templates.builder.version.label} {template.versions[template.currentVersion].version}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {pollingStatus && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              {templatesStrings.templates.approvalStatus.polling}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {templatesStrings.templates.builder.actions.saveDraft}
          </Button>
          {provider === 'whatsapp' ? (
            <Button
              onClick={() => handleSave('submitted')}
              disabled={loading || complianceIssues.length > 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {templatesStrings.templates.builder.actions.submit}
            </Button>
          ) : (
            <Button
              onClick={() => handleSave('approved')}
              disabled={loading || complianceIssues.length > 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {templatesStrings.templates.builder.actions.activate}
            </Button>
          )}
        </div>
      </div>

      {/* Cost Banner */}
      <Alert>
        <AlertDescription>{templatesStrings.templates.cost.banner}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{templatesStrings.templates.builder.metadata.title}</h3>
            <div className="space-y-4">
              <div>
                <Label>{templatesStrings.templates.builder.metadata.name.label}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={templatesStrings.templates.builder.metadata.name.placeholder}
                  disabled={!!template}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{templatesStrings.templates.providers.whatsapp}</Label>
                  <Select value={provider} onValueChange={setProvider} disabled={!!template}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesState.providers.map(p => (
                        <SelectItem 
                          key={p.id} 
                          value={p.id}
                          disabled={p.comingSoon}
                        >
                          <div className="flex items-center gap-2">
                            {React.createElement(getIntegrationIcon(p.icon), { className: 'h-4 w-4' })}
                            {p.name}
                            {p.comingSoon && <Badge variant="secondary">Soon</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{templatesStrings.templates.builder.metadata.language.label}</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={!!template}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesState.languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {provider === 'whatsapp' && (
                <div>
                  <Label>{templatesStrings.templates.builder.metadata.category.label}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={templatesStrings.templates.builder.metadata.category.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesState.categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {provider === 'messenger' && (
                <div>
                  <Label>Message Tag</Label>
                  <Select value={messageTag} onValueChange={setMessageTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select message tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesState.messageTags.map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>{templatesStrings.templates.builder.metadata.description.label}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={templatesStrings.templates.builder.metadata.description.placeholder}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Message Editor */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{templatesStrings.templates.builder.editor.title}</h3>
            <Accordion type="multiple" defaultValue={['body']} className="space-y-2">
              {/* Header */}
              {selectedProvider?.supportedHeaderTypes && selectedProvider.supportedHeaderTypes.length > 0 && (
                <AccordionItem value="header">
                  <AccordionTrigger>{templatesStrings.templates.builder.editor.header.label}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex gap-2">
                      {selectedProvider.supportedHeaderTypes.includes('text') && (
                        <Button
                          variant={headerType === 'text' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHeaderType('text')}
                        >
                          <Type className="h-4 w-4 mr-1" />
                          {templatesStrings.templates.builder.editor.header.types.text}
                        </Button>
                      )}
                      {selectedProvider.supportedHeaderTypes.includes('image') && (
                        <Button
                          variant={headerType === 'media' && headerMedia.includes('image') ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHeaderType('media')}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          {templatesStrings.templates.builder.editor.header.types.image}
                        </Button>
                      )}
                      {selectedProvider.supportedHeaderTypes.includes('video') && (
                        <Button
                          variant={headerType === 'media' && headerMedia.includes('video') ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHeaderType('media')}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          {templatesStrings.templates.builder.editor.header.types.video}
                        </Button>
                      )}
                      {selectedProvider.supportedHeaderTypes.includes('document') && (
                        <Button
                          variant={headerType === 'media' && headerMedia.includes('document') ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setHeaderType('media')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {templatesStrings.templates.builder.editor.header.types.document}
                        </Button>
                      )}
                    </div>
                    
                    {headerType === 'text' ? (
                      <Input
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder={templatesStrings.templates.builder.editor.header.placeholder}
                        maxLength={selectedProvider.limits.header?.text}
                      />
                    ) : (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" asChild>
                          <label>
                            <Upload className="h-4 w-4 mr-2" />
                            {templatesStrings.templates.builder.editor.header.mediaUpload}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,video/*,.pdf,.doc,.docx"
                              onChange={handleMediaUpload}
                            />
                          </label>
                        </Button>
                        {headerMedia && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate flex-1">Media uploaded</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setHeaderMedia('')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Body */}
              <AccordionItem value="body">
                <AccordionTrigger>
                  {templatesStrings.templates.builder.editor.body.label}
                  <span className="text-sm text-muted-foreground ml-2">
                    {body.length}/{selectedProvider?.limits.body || 0}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={templatesStrings.templates.builder.editor.body.placeholder}
                    rows={6}
                    maxLength={selectedProvider?.limits.body}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {templatesStrings.templates.builder.editor.body.charCount
                      .replace('{{count}}', body.length.toString())
                      .replace('{{max}}', selectedProvider?.limits.body?.toString() || '0')}
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              {/* Footer */}
              {provider === 'whatsapp' && (
                <AccordionItem value="footer">
                  <AccordionTrigger>{templatesStrings.templates.builder.editor.footer.label}</AccordionTrigger>
                  <AccordionContent>
                    <Input
                      value={footer}
                      onChange={(e) => setFooter(e.target.value)}
                      placeholder={templatesStrings.templates.builder.editor.footer.placeholder}
                      maxLength={selectedProvider?.limits.footer}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Buttons */}
              {selectedProvider?.limits.buttons && (
                <AccordionItem value="buttons">
                  <AccordionTrigger>
                    {templatesStrings.templates.builder.editor.buttons.label}
                    <span className="text-sm text-muted-foreground ml-2">
                      {buttons.length} buttons
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TemplateButtonEditor
                      buttons={buttons}
                      onChange={setButtons}
                      provider={provider}
                      limits={selectedProvider.limits.buttons}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </Card>

          {/* Compliance Check */}
          <TemplateComplianceCheck
            issues={complianceIssues}
            onValidate={validateTemplate}
          />
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {/* Variable Values */}
          {allVariables.length > 0 && (
            <TemplateVariableInput
              variables={allVariables}
              values={variableValues}
              onChange={setVariableValues}
            />
          )}

          {/* Preview */}
          <Card className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{templatesStrings.templates.builder.preview.title}</h3>
              <TooltipProvider>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mobile View</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Desktop View</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
            
            <TemplatePreview
              provider={provider}
              header={headerType === 'text' ? { type: 'text', value: headerText } : 
                      headerMedia ? { type: 'media', value: headerMedia } : undefined}
              body={body}
              footer={footer}
              buttons={buttons}
              variables={variableValues}
              device={previewDevice}
            />
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}