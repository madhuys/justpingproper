'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Plus, 
  Brain, 
  Tag, 
  Search, 
  TestTube,
  Calendar,
  MoreVertical,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useKnowledgebase } from '@/hooks/useKnowledgebase';
import { KnowledgeIndexModal } from '@/components/organisms/modals/KnowledgeIndexModal';
import { ClassifierIndexModal } from '@/components/organisms/modals/ClassifierIndexModal';
import { SearchTester } from '@/components/molecules/SearchTester';
import { ClassificationTester } from '@/components/molecules/ClassificationTester';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import embeddingProviders from '@/data/embeddingProviders.json';
import classifierModels from '@/data/classifierModels.json';

export default function KnowledgebasePage() {
  const {
    knowledgeIndexes,
    classifierIndexes,
    activeTab,
    createModalOpen,
    createModalType,
    buildStatus,
    searchResults,
    isSearching,
    classificationResult,
    isClassifying,
    setActiveTab,
    setCreateModalOpen,
    setCreateModalType,
    createKnowledgeIndex,
    createClassifierIndex,
    cancelBuild,
    searchKnowledgeIndex,
    classifyText,
    deleteIndex
  } = useKnowledgebase();

  const [expandedIndexes, setExpandedIndexes] = useState<Set<string>>(new Set());

  const toggleIndexExpanded = (indexId: string) => {
    setExpandedIndexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indexId)) {
        newSet.delete(indexId);
      } else {
        newSet.add(indexId);
      }
      return newSet;
    });
  };

  const openCreateModal = (type: 'knowledge' | 'classifier') => {
    setCreateModalType(type);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateModalType(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProviderName = (providerId: string) => {
    return embeddingProviders.find(p => p.id === providerId)?.name || providerId;
  };

  const getModelName = (modelId: string) => {
    return classifierModels.find(m => m.id === modelId)?.name || modelId;
  };

  const renderKnowledgeIndexes = () => {
    if (knowledgeIndexes.length === 0) {
      return (
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Brain}
            title={knowledgebaseStrings.emptyState.knowledge.title}
            description={knowledgebaseStrings.emptyState.knowledge.description}
            action={
              <Button onClick={() => openCreateModal('knowledge')}>
                <Plus className="h-4 w-4 mr-2" />
                {knowledgebaseStrings.emptyState.knowledge.action}
              </Button>
            }
          />
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {knowledgeIndexes.map(index => (
          <Card key={index.id} className="overflow-hidden">
            <Collapsible
              open={expandedIndexes.has(index.id)}
              onOpenChange={() => toggleIndexExpanded(index.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{index.name}</h3>
                      {index.description && (
                        <p className="text-sm text-muted-foreground">{index.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {index.status === 'building' && (
                      <div className="flex items-center space-x-2">
                        <Progress value={buildStatus.progress} className="w-24 h-2" />
                        <span className="text-xs text-muted-foreground">Building...</span>
                      </div>
                    )}
                    {index.status === 'ready' && (
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          <TestTube className="h-4 w-4 mr-2" />
                          {knowledgebaseStrings.actions.testSearch}
                          {expandedIndexes.has(index.id) ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteIndex(index.id, 'knowledge')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(index.createdAt)}</span>
                  </div>
                  <div>{getProviderName(index.provider)}</div>
                  <div>{index.model}</div>
                  <div>{index.documentCount} documents</div>
                </div>
              </div>
              <CollapsibleContent>
                <div className="border-t p-4 bg-muted/30">
                  <SearchTester
                    indexId={index.id}
                    onSearch={searchKnowledgeIndex}
                    searchResults={searchResults}
                    isSearching={isSearching}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    );
  };

  const renderClassifierIndexes = () => {
    if (classifierIndexes.length === 0) {
      return (
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Tag}
            title={knowledgebaseStrings.emptyState.classifier.title}
            description={knowledgebaseStrings.emptyState.classifier.description}
            action={
              <Button onClick={() => openCreateModal('classifier')}>
                <Plus className="h-4 w-4 mr-2" />
                {knowledgebaseStrings.emptyState.classifier.action}
              </Button>
            }
          />
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {classifierIndexes.map(index => (
          <Card key={index.id} className="overflow-hidden">
            <Collapsible
              open={expandedIndexes.has(index.id)}
              onOpenChange={() => toggleIndexExpanded(index.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{index.name}</h3>
                      {index.description && (
                        <p className="text-sm text-muted-foreground">{index.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {index.status === 'building' && (
                      <div className="flex items-center space-x-2">
                        <Progress value={buildStatus.progress} className="w-24 h-2" />
                        <span className="text-xs text-muted-foreground">Training...</span>
                      </div>
                    )}
                    {index.status === 'ready' && (
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          <TestTube className="h-4 w-4 mr-2" />
                          {knowledgebaseStrings.actions.testClassifier}
                          {expandedIndexes.has(index.id) ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteIndex(index.id, 'classifier')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(index.createdAt)}</span>
                  </div>
                  <div>{getModelName(index.model)}</div>
                  <div>{index.datasetSize} samples</div>
                </div>
              </div>
              <CollapsibleContent>
                <div className="border-t p-4 bg-muted/30">
                  <ClassificationTester
                    indexId={index.id}
                    onClassify={classifyText}
                    classificationResult={classificationResult}
                    isClassifying={isClassifying}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-background p-8">
      <div className="container mx-auto max-w-full h-full flex flex-col">
        <PageHeader
          title={knowledgebaseStrings.page.title}
          description={knowledgebaseStrings.page.description}
          className="mb-6"
        />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'knowledge' | 'classifier')} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {knowledgebaseStrings.tabs.knowledge}
              </TabsTrigger>
              <TabsTrigger value="classifier" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {knowledgebaseStrings.tabs.classifier}
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'knowledge' && (
              <Button onClick={() => openCreateModal('knowledge')}>
                <Plus className="h-4 w-4 mr-2" />
                {knowledgebaseStrings.actions.newKnowledgeIndex}
              </Button>
            )}
            
            {activeTab === 'classifier' && (
              <Button onClick={() => openCreateModal('classifier')}>
                <Plus className="h-4 w-4 mr-2" />
                {knowledgebaseStrings.actions.newClassifierIndex}
              </Button>
            )}
          </div>
          
          <TabsContent value="knowledge" className="flex-1">
            {renderKnowledgeIndexes()}
          </TabsContent>
          
          <TabsContent value="classifier" className="flex-1">
            {renderClassifierIndexes()}
          </TabsContent>
        </Tabs>
      </div>

      {createModalType === 'knowledge' && (
        <KnowledgeIndexModal
          isOpen={createModalOpen}
          onClose={closeCreateModal}
          onCreateIndex={createKnowledgeIndex}
        />
      )}

      {createModalType === 'classifier' && (
        <ClassifierIndexModal
          isOpen={createModalOpen}
          onClose={closeCreateModal}
          onCreateClassifier={createClassifierIndex}
        />
      )}

    </div>
  );
}