import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import knowledgebaseState from '@/data/states/knowledgebase.json';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import embeddingProviders from '@/data/embeddingProviders.json';
import classifierModels from '@/data/classifierModels.json';

export interface KnowledgeIndex {
  id: string;
  name: string;
  description?: string;
  provider: string;
  model: string;
  documentCount: number;
  createdAt: string;
  status: 'ready' | 'building' | 'failed';
}

export interface ClassifierIndex {
  id: string;
  name: string;
  description?: string;
  model: string;
  datasetSize: number;
  createdAt: string;
  status: 'ready' | 'building' | 'failed';
}

export interface BuildStatus {
  isBuilding: boolean;
  buildType: 'knowledge' | 'classifier' | null;
  indexId: string | null;
  progress: number;
  message: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface ClassificationResult {
  label: string;
  confidence: number;
}

export function useKnowledgebase() {
  const [knowledgeIndexes, setKnowledgeIndexes] = useState<KnowledgeIndex[]>(knowledgebaseState.indexes.knowledge);
  const [classifierIndexes, setClassifierIndexes] = useState<ClassifierIndex[]>(knowledgebaseState.indexes.classifier);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'classifier'>(knowledgebaseState.activeTab);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'knowledge' | 'classifier' | null>(null);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>(knowledgebaseState.buildStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [classificationInput, setClassificationInput] = useState('');
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedIndexes = localStorage.getItem('knowledgebase-indexes');
    if (savedIndexes) {
      const parsed = JSON.parse(savedIndexes);
      setKnowledgeIndexes(parsed.knowledge || []);
      setClassifierIndexes(parsed.classifier || []);
    }
  }, []);

  // Save indexes to localStorage
  useEffect(() => {
    localStorage.setItem('knowledgebase-indexes', JSON.stringify({
      knowledge: knowledgeIndexes,
      classifier: classifierIndexes
    }));
  }, [knowledgeIndexes, classifierIndexes]);

  // Create knowledge index
  const createKnowledgeIndex = useCallback(async (data: {
    name: string;
    description?: string;
    selectedFiles: string[];
    provider: string;
    model: string;
  }) => {
    const newIndex: KnowledgeIndex = {
      id: `ki-${Date.now()}`,
      name: data.name,
      description: data.description,
      provider: data.provider,
      model: data.model,
      documentCount: data.selectedFiles.length,
      createdAt: new Date().toISOString(),
      status: 'building'
    };

    setKnowledgeIndexes(prev => [...prev, newIndex]);
    setBuildStatus({
      isBuilding: true,
      buildType: 'knowledge',
      indexId: newIndex.id,
      progress: 0,
      message: knowledgebaseStrings.notifications.indexBuildStarted
    });

    toast(knowledgebaseStrings.notifications.indexBuildStarted);

    // Simulate build process
    simulateBuildProcess(newIndex.id, 'knowledge');
  }, []);

  // Create classifier index
  const createClassifierIndex = useCallback(async (data: {
    name: string;
    description?: string;
    model: string;
    datasetFile: File | string[] | null;
  }) => {
    const newIndex: ClassifierIndex = {
      id: `ci-${Date.now()}`,
      name: data.name,
      description: data.description,
      model: data.model,
      datasetSize: data.datasetFile instanceof File ? 1000 : Array.isArray(data.datasetFile) ? data.datasetFile.length * 100 : 0,
      createdAt: new Date().toISOString(),
      status: 'building'
    };

    setClassifierIndexes(prev => [...prev, newIndex]);
    setBuildStatus({
      isBuilding: true,
      buildType: 'classifier',
      indexId: newIndex.id,
      progress: 0,
      message: knowledgebaseStrings.notifications.classifierBuildStarted
    });

    toast(knowledgebaseStrings.notifications.classifierBuildStarted);

    // Simulate build process
    simulateBuildProcess(newIndex.id, 'classifier');
  }, []);

  // Simulate build process
  const simulateBuildProcess = useCallback((indexId: string, type: 'knowledge' | 'classifier') => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update index status
        if (type === 'knowledge') {
          setKnowledgeIndexes(prev => {
            const updated = prev.map(idx => 
              idx.id === indexId ? { ...idx, status: 'ready' } : idx
            );
            const index = updated.find(idx => idx.id === indexId);
            
            // Show success toast
            toast.success(
              knowledgebaseStrings.notifications.indexReady.replace('{{name}}', index?.name || '')
            );
            
            return updated;
          });
        } else {
          setClassifierIndexes(prev => {
            const updated = prev.map(idx => 
              idx.id === indexId ? { ...idx, status: 'ready' } : idx
            );
            const index = updated.find(idx => idx.id === indexId);
            
            // Show success toast
            toast.success(
              knowledgebaseStrings.notifications.classifierReady.replace('{{name}}', index?.name || '')
            );
            
            return updated;
          });
        }

        // Clear build status
        setBuildStatus({
          isBuilding: false,
          buildType: null,
          indexId: null,
          progress: 0,
          message: ''
        });
      } else {
        setBuildStatus(prev => ({ ...prev, progress }));
      }
    }, 500);
  }, []);

  // Cancel build
  const cancelBuild = useCallback(() => {
    if (buildStatus.indexId && buildStatus.buildType) {
      // Update index status to failed
      if (buildStatus.buildType === 'knowledge') {
        setKnowledgeIndexes(prev => prev.map(idx => 
          idx.id === buildStatus.indexId ? { ...idx, status: 'failed' } : idx
        ));
      } else {
        setClassifierIndexes(prev => prev.map(idx => 
          idx.id === buildStatus.indexId ? { ...idx, status: 'failed' } : idx
        ));
      }
    }

    setBuildStatus({
      isBuilding: false,
      buildType: null,
      indexId: null,
      progress: 0,
      message: ''
    });

    toast(knowledgebaseStrings.notifications.buildCancelled);
  }, [buildStatus]);

  // Search in knowledge index
  const searchKnowledgeIndex = useCallback(async (indexId: string, query: string) => {
    setIsSearching(true);
    setSearchQuery(query);

    // Simulate search
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Document about ' + query,
          content: 'This is a relevant document containing information about ' + query + '...',
          score: 0.95
        },
        {
          id: '2',
          title: 'Another document mentioning ' + query,
          content: 'Additional information related to ' + query + ' can be found here...',
          score: 0.87
        },
        {
          id: '3',
          title: 'Reference material for ' + query,
          content: 'Comprehensive guide covering various aspects of ' + query + '...',
          score: 0.82
        }
      ];

      setSearchResults(query ? mockResults : []);
      setIsSearching(false);
    }, 1000);
  }, []);

  // Classify text
  const classifyText = useCallback(async (indexId: string, text: string) => {
    setIsClassifying(true);
    setClassificationInput(text);

    // Simulate classification
    setTimeout(() => {
      const labels = ['Technology', 'Business', 'Science', 'Health', 'Education', 'Entertainment'];
      const mockResult: ClassificationResult = {
        label: labels[Math.floor(Math.random() * labels.length)],
        confidence: 0.75 + Math.random() * 0.24
      };

      setClassificationResult(mockResult);
      setIsClassifying(false);
    }, 800);
  }, []);

  // Delete index
  const deleteIndex = useCallback((indexId: string, type: 'knowledge' | 'classifier') => {
    if (type === 'knowledge') {
      setKnowledgeIndexes(prev => prev.filter(idx => idx.id !== indexId));
    } else {
      setClassifierIndexes(prev => prev.filter(idx => idx.id !== indexId));
    }
    toast.success('Index deleted successfully');
  }, []);

  return {
    // State
    knowledgeIndexes,
    classifierIndexes,
    activeTab,
    createModalOpen,
    createModalType,
    buildStatus,
    searchQuery,
    searchResults,
    isSearching,
    classificationInput,
    classificationResult,
    isClassifying,
    embeddingProviders,
    classifierModels,
    
    // Actions
    setActiveTab,
    setCreateModalOpen,
    setCreateModalType,
    createKnowledgeIndex,
    createClassifierIndex,
    cancelBuild,
    searchKnowledgeIndex,
    classifyText,
    deleteIndex,
    setSearchQuery,
    setClassificationInput
  };
}