'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/atoms/PageHeader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Copy, 
  Archive,
  MessageSquare,
  FileText
} from 'lucide-react';
import templatesStrings from '@/data/strings/templates.json';
import templatesState from '@/data/states/templates.json';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getIntegrationIcon } from '@/lib/integrations/utils';

interface Template {
  id: string;
  name: string;
  provider: string;
  language: string;
  versions: any[];
  currentVersion: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load templates from localStorage or state
    const savedTemplates = localStorage.getItem('jp-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(templatesState.templates);
    }
    setLoading(false);
  }, []);

  const handleCreateTemplate = () => {
    router.push('/templates/new');
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/templates/${templateId}`);
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      versions: [{
        ...template.versions[template.currentVersion],
        version: 1,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      currentVersion: 0
    };
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('jp-templates', JSON.stringify(updatedTemplates));
    toast.success('Template duplicated successfully');
    
    // Navigate to edit the new template
    router.push(`/templates/${newTemplate.id}`);
  };

  const handleArchiveTemplate = (templateId: string) => {
    const updatedTemplates = templates.map(t => {
      if (t.id === templateId) {
        const versions = [...t.versions];
        versions[t.currentVersion] = {
          ...versions[t.currentVersion],
          status: 'archived',
          updatedAt: new Date().toISOString()
        };
        return { ...t, versions };
      }
      return t;
    });
    
    setTemplates(updatedTemplates);
    localStorage.setItem('jp-templates', JSON.stringify(updatedTemplates));
    toast.success('Template archived successfully');
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const currentVersion = template.versions[template.currentVersion];
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = providerFilter === 'all' || template.provider === providerFilter;
    const matchesStatus = statusFilter === 'all' || currentVersion?.status === statusFilter;
    const matchesLanguage = languageFilter === 'all' || template.language === languageFilter;
    
    return matchesSearch && matchesProvider && matchesStatus && matchesLanguage;
  });

  const getProviderIcon = (providerId: string) => {
    const provider = templatesState.providers.find(p => p.id === providerId);
    if (provider) {
      const Icon = getIntegrationIcon(provider.icon);
      return <Icon className="h-4 w-4" />;
    }
    return <MessageSquare className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      submitted: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      approved: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'secondary' as const, className: 'bg-red-100 text-red-800' },
      archived: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {templatesStrings.templates.dashboard.status[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={templatesStrings.templates.title}
        subtitle={templatesStrings.templates.subtitle}
        actions={
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            {templatesStrings.templates.dashboard.createButton}
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={templatesStrings.templates.dashboard.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{templatesStrings.templates.dashboard.filters.all}</SelectItem>
              {templatesState.providers.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{templatesStrings.templates.dashboard.filters.all}</SelectItem>
              {Object.keys(templatesStrings.templates.dashboard.status).map(status => (
                <SelectItem key={status} value={status}>
                  {templatesStrings.templates.dashboard.status[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{templatesStrings.templates.dashboard.filters.all}</SelectItem>
              {templatesState.languages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Templates Table */}
      <Card>
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={templatesStrings.templates.dashboard.empty.title}
            description={templatesStrings.templates.dashboard.empty.description}
            action={
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                {templatesStrings.templates.dashboard.createButton}
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.name}</TableHead>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.provider}</TableHead>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.language}</TableHead>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.status}</TableHead>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.versions}</TableHead>
                <TableHead>{templatesStrings.templates.dashboard.table.columns.updated}</TableHead>
                <TableHead className="text-right">{templatesStrings.templates.dashboard.table.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => {
                const currentVersion = template.versions[template.currentVersion];
                return (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getProviderIcon(template.provider)}
                        <span>{templatesState.providers.find(p => p.id === template.provider)?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {templatesState.languages.find(l => l.code === template.language)?.name}
                    </TableCell>
                    <TableCell>{getStatusBadge(currentVersion?.status || 'draft')}</TableCell>
                    <TableCell>v{currentVersion?.version || 1}</TableCell>
                    <TableCell>{formatDate(currentVersion?.updatedAt || new Date().toISOString())}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {templatesStrings.templates.dashboard.table.actions.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {templatesStrings.templates.dashboard.table.actions.duplicate}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleArchiveTemplate(template.id)}
                            className="text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {templatesStrings.templates.dashboard.table.actions.archive}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}