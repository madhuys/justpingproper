import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Settings, 
  Globe, 
  Mail, 
  MessageSquare, 
  Phone, 
  Webhook,
  BellRing,
  CalendarPlus,
  Database,
  Search,
  BookOpen
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import mcpServersData from '@/data/mcpServers.json';
import knowledgebaseState from '@/data/states/knowledgebase.json';

interface WorkflowNodeActionConfigProps {
  actionType: string;
  actionConfig: Record<string, any>;
  onActionTypeChange: (value: string) => void;
  onActionConfigChange: (config: Record<string, any>) => void;
}

const searchProviders = [
  { id: 'google', label: 'Google', description: 'Google Search API' },
  { id: 'bing', label: 'Bing', description: 'Microsoft Bing Search' },
  { id: 'perplexity', label: 'Perplexity', description: 'Perplexity AI Search' },
  { id: 'duckduckgo', label: 'DuckDuckGo', description: 'Privacy-focused search' },
  { id: 'serpapi', label: 'SerpAPI', description: 'Multiple search engines' },
];

const actionTypes = [
  { id: 'searchKnowledgebase', label: 'Search Knowledgebase', icon: BookOpen, description: 'Search across knowledge indexes' },
  { id: 'searchWeb', label: 'Search Web', icon: Search, description: 'Search the web for information' },
  { id: 'mcpTool', label: 'MCP Tool', icon: Settings, description: 'Use Model Context Protocol tools' },
  { id: 'apiCall', label: 'API Call', icon: Globe, description: 'Make HTTP API requests' },
  { id: 'sendEmail', label: 'Send Email', icon: Mail, description: 'Send email messages' },
  { id: 'sendWhatsApp', label: 'Send WhatsApp', icon: MessageSquare, description: 'Send WhatsApp messages' },
  { id: 'sendSMS', label: 'Send SMS', icon: Phone, description: 'Send SMS messages' },
  { id: 'webhook', label: 'Webhook', icon: Webhook, description: 'Call external webhooks' },
  { id: 'notify', label: 'Send Notification', icon: BellRing, description: 'Send in-app notifications' },
  { id: 'updateCalendar', label: 'Update Calendar', icon: CalendarPlus, description: 'Create calendar events' },
  { id: 'updateCRM', label: 'Update CRM', icon: Database, description: 'Update CRM records' },
];

export function WorkflowNodeActionConfig({
  actionType,
  actionConfig,
  onActionTypeChange,
  onActionConfigChange
}: WorkflowNodeActionConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onActionConfigChange({
      ...actionConfig,
      [key]: value
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Action Configuration</h3>
      </div>

      {/* Action Type Selection */}
      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select value={actionType} onValueChange={onActionTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select action type" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Action-specific Configuration */}
      {actionType === 'searchKnowledgebase' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Knowledge Indexes</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {knowledgebaseState.indexes.knowledge.map((index) => (
                <div key={index.id} className="flex items-start gap-2">
                  <Checkbox
                    id={index.id}
                    checked={(actionConfig.knowledgeIndexes || []).includes(index.id)}
                    onCheckedChange={(checked) => {
                      const current = actionConfig.knowledgeIndexes || [];
                      const updated = checked 
                        ? [...current, index.id]
                        : current.filter((id: string) => id !== index.id);
                      updateConfig('knowledgeIndexes', updated);
                    }}
                  />
                  <Label 
                    htmlFor={index.id} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div>
                      <div className="font-medium">{index.name}</div>
                      {index.description && (
                        <div className="text-xs text-muted-foreground">{index.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {index.documentCount} documents • {index.provider}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Search Query</Label>
            <Textarea
              value={actionConfig.searchQuery || ''}
              onChange={(e) => updateConfig('searchQuery', e.target.value)}
              placeholder="Search for {{topic}} in the knowledge base"
              className="w-full"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Use variables like {`{{variable}}`} to make dynamic searches
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max Results</Label>
            <Input
              type="number"
              value={actionConfig.maxResults || 5}
              onChange={(e) => updateConfig('maxResults', parseInt(e.target.value) || 5)}
              min={1}
              max={20}
              className="w-full"
            />
          </div>
        </div>
      )}

      {actionType === 'searchWeb' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Provider</Label>
            <Select 
              value={actionConfig.searchProvider || 'google'} 
              onValueChange={(value) => updateConfig('searchProvider', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex flex-col">
                      <span>{provider.label}</span>
                      <span className="text-xs text-muted-foreground">{provider.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Keyword Parsing Logic</Label>
            <Textarea
              value={actionConfig.keywordPrompt || 'Extract the main search keywords from: {{query}}'}
              onChange={(e) => updateConfig('keywordPrompt', e.target.value)}
              placeholder="Describe how to extract keywords from the user's query"
              className="w-full"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This prompt will be used to extract search keywords from the conversation
            </p>
          </div>

          <div className="space-y-2">
            <Label>Search Query Template</Label>
            <Input
              value={actionConfig.searchTemplate || '{{keywords}}'}
              onChange={(e) => updateConfig('searchTemplate', e.target.value)}
              placeholder="{{keywords}} site:example.com"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Template for the final search query. Use {`{{keywords}}`} for extracted keywords
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max Results</Label>
            <Input
              type="number"
              value={actionConfig.maxResults || 10}
              onChange={(e) => updateConfig('maxResults', parseInt(e.target.value) || 10)}
              min={1}
              max={50}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Search Options</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="safeSearch"
                  checked={actionConfig.safeSearch !== false}
                  onCheckedChange={(checked) => updateConfig('safeSearch', checked)}
                />
                <Label htmlFor="safeSearch" className="cursor-pointer font-normal">
                  Enable safe search
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeSnippets"
                  checked={actionConfig.includeSnippets !== false}
                  onCheckedChange={(checked) => updateConfig('includeSnippets', checked)}
                />
                <Label htmlFor="includeSnippets" className="cursor-pointer font-normal">
                  Include result snippets
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionType === 'mcpTool' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>MCP Server</Label>
            <Select 
              value={actionConfig.mcpServer || ''} 
              onValueChange={(value) => updateConfig('mcpServer', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select MCP server" />
              </SelectTrigger>
              <SelectContent>
                {mcpServersData.servers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    <div className="flex flex-col">
                      <span>{server.name}</span>
                      <span className="text-xs text-muted-foreground">{server.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Tool Name</Label>
            <Input
              value={actionConfig.mcpTool || ''}
              onChange={(e) => updateConfig('mcpTool', e.target.value)}
              placeholder="e.g., search_files, execute_command"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Tool Parameters (JSON)</Label>
            <Textarea
              value={actionConfig.mcpToolParams ? JSON.stringify(actionConfig.mcpToolParams, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value);
                  updateConfig('mcpToolParams', params);
                } catch (err) {
                  // Invalid JSON, store as string for now
                  updateConfig('mcpToolParams', e.target.value);
                }
              }}
              placeholder='{"query": "example search"}'
              className="w-full font-mono text-xs"
              rows={4}
            />
          </div>
        </div>
      )}

      {actionType === 'apiCall' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API URL</Label>
            <Input
              value={actionConfig.apiUrl || ''}
              onChange={(e) => updateConfig('apiUrl', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Method</Label>
            <Select 
              value={actionConfig.apiMethod || 'GET'} 
              onValueChange={(value) => updateConfig('apiMethod', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Headers (JSON)</Label>
            <Textarea
              value={actionConfig.apiHeaders ? JSON.stringify(actionConfig.apiHeaders, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  updateConfig('apiHeaders', headers);
                } catch (err) {
                  updateConfig('apiHeaders', e.target.value);
                }
              }}
              placeholder='{"Authorization": "Bearer token"}'
              className="w-full font-mono text-xs"
              rows={3}
            />
          </div>

          {(actionConfig.apiMethod === 'POST' || actionConfig.apiMethod === 'PUT' || actionConfig.apiMethod === 'PATCH') && (
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                value={actionConfig.apiBody || ''}
                onChange={(e) => updateConfig('apiBody', e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full font-mono text-xs"
                rows={4}
              />
            </div>
          )}
        </div>
      )}

      {actionType === 'sendEmail' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To Email</Label>
            <Input
              value={actionConfig.emailTo || ''}
              onChange={(e) => updateConfig('emailTo', e.target.value)}
              placeholder="recipient@example.com or {{email}}"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={actionConfig.emailSubject || ''}
              onChange={(e) => updateConfig('emailSubject', e.target.value)}
              placeholder="Email subject with {{variables}}"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={actionConfig.emailBody || ''}
              onChange={(e) => updateConfig('emailBody', e.target.value)}
              placeholder="Email body content. You can use {{variables}} here."
              className="w-full"
              rows={4}
            />
          </div>
        </div>
      )}

      {(actionType === 'sendWhatsApp' || actionType === 'sendSMS') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={actionConfig.phoneNumber || ''}
              onChange={(e) => updateConfig('phoneNumber', e.target.value)}
              placeholder="+1234567890 or {{phone}}"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={actionConfig.messageContent || ''}
              onChange={(e) => updateConfig('messageContent', e.target.value)}
              placeholder="Message content with {{variables}}"
              className="w-full"
              rows={3}
            />
          </div>

          {actionType === 'sendWhatsApp' && (
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select 
                value={actionConfig.whatsappProvider || 'justping'} 
                onValueChange={(value) => updateConfig('whatsappProvider', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="justping">JustPing</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="whatsapp_business">WhatsApp Business API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {actionType === 'webhook' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              value={actionConfig.webhookUrl || ''}
              onChange={(e) => updateConfig('webhookUrl', e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Method</Label>
            <Select 
              value={actionConfig.webhookMethod || 'POST'} 
              onValueChange={(value) => updateConfig('webhookMethod', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Headers (JSON)</Label>
            <Textarea
              value={actionConfig.webhookHeaders ? JSON.stringify(actionConfig.webhookHeaders, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  updateConfig('webhookHeaders', headers);
                } catch (err) {
                  updateConfig('webhookHeaders', e.target.value);
                }
              }}
              placeholder='{"X-Webhook-Secret": "secret"}'
              className="w-full font-mono text-xs"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Body (JSON)</Label>
            <Textarea
              value={actionConfig.webhookBody || '{}'}
              onChange={(e) => updateConfig('webhookBody', e.target.value)}
              placeholder='{"event": "workflow_action", "data": {{variables}}}'
              className="w-full font-mono text-xs"
              rows={4}
            />
          </div>
        </div>
      )}

      {actionType === 'notify' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notification Title</Label>
            <Input
              value={actionConfig.notifyTitle || ''}
              onChange={(e) => updateConfig('notifyTitle', e.target.value)}
              placeholder="Notification title"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Notification Body</Label>
            <Textarea
              value={actionConfig.notifyBody || ''}
              onChange={(e) => updateConfig('notifyBody', e.target.value)}
              placeholder="Notification message"
              className="w-full"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={actionConfig.notifyType || 'info'} 
              onValueChange={(value) => updateConfig('notifyType', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Tool Calling Configuration for AI Models */}
      {(actionType === 'mcpTool' || actionType === 'apiCall' || actionType === 'searchKnowledgebase' || actionType === 'searchWeb') && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI Tool Calling</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The AI model will automatically determine when to call this tool based on the conversation context.
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="enableToolCalling"
              checked={actionConfig.enableToolCalling || false}
              onChange={(e) => updateConfig('enableToolCalling', e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="enableToolCalling" className="text-sm cursor-pointer">
              Enable automatic tool calling
            </Label>
          </div>
        </div>
      )}
    </Card>
  );
}