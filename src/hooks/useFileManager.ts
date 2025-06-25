'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import fileManagementStrings from '@/data/strings/fileManagement.json';
import stateConfig from '@/data/states/fileManagement.json';

interface ConnectedProvider {
  id: string;
  accessToken: string;
  refreshToken?: string;
  connectedAt: Date;
  expiresAt?: Date;
}

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  path: string;
  modifiedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  children?: FileItem[];
}

interface FileManagerState {
  connectedProviders: Record<string, ConnectedProvider>;
  currentProvider: string | null;
  currentPath: string[];
  files: FileItem[];
  viewMode: 'list' | 'card' | 'thumbnail';
  cardSize: 'sm' | 'md' | 'lg';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'justping_file_manager';

// Fetch files from API
const fetchFiles = async (path: string = '/'): Promise<FileItem[]> => {
  try {
    const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
};

// Mock OAuth function
const mockOAuth = async (providerId: string): Promise<{ accessToken: string; refreshToken: string }> => {
  return new Promise((resolve, reject) => {
    // Simulate OAuth popup
    const authWindow = window.open(
      `about:blank`,
      'oauth',
      'width=500,height=600'
    );
    
    if (authWindow) {
      authWindow.document.write('<html><body><h2>Authorizing...</h2><p>Please wait...</p></body></html>');
      
      setTimeout(() => {
        authWindow.close();
        
        // 90% success rate
        if (Math.random() > 0.1) {
          resolve({
            accessToken: `mock_access_${providerId}_${Date.now()}`,
            refreshToken: `mock_refresh_${providerId}_${Date.now()}`
          });
        } else {
          reject(new Error('Authorization failed'));
        }
      }, 2000);
    } else {
      reject(new Error('Failed to open authorization window'));
    }
  });
};

export function useFileManager() {
  const [state, setState] = useState<FileManagerState>({
    connectedProviders: {},
    currentProvider: null,
    currentPath: [],
    files: [],
    viewMode: stateConfig.defaultState.viewMode as 'list' | 'card' | 'thumbnail',
    cardSize: stateConfig.defaultState.cardSize as 'sm' | 'md' | 'lg',
    searchQuery: '',
    isLoading: false,
    error: null
  });

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        // First try to load from API
        const response = await fetch('/api/states/file-management');
        if (response.ok) {
          const data = await response.json();
          if (data.defaultState) {
            setState(prev => ({
              ...prev,
              connectedProviders: data.defaultState.connectedProviders || {},
              viewMode: data.defaultState.viewMode || prev.viewMode,
              cardSize: data.defaultState.cardSize || prev.cardSize,
              currentProvider: data.defaultState.currentProvider || null
            }));
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load from API:', error);
      }
      
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            connectedProviders: parsed.connectedProviders || {},
            viewMode: parsed.viewMode || prev.viewMode,
            cardSize: parsed.cardSize || prev.cardSize
          }));
        }
      } catch (error) {
        console.error('Failed to load file manager state:', error);
      }
    };
    
    loadState();
  }, []);

  // Save state changes
  useEffect(() => {
    const saveState = async () => {
      const toSave = {
        connectedProviders: state.connectedProviders,
        viewMode: state.viewMode,
        cardSize: state.cardSize,
        currentProvider: state.currentProvider
      };
      
      // Save to API
      try {
        await fetch('/api/states/file-management', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave)
        });
      } catch (error) {
        console.error('Failed to save to API:', error);
      }
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save file manager state:', error);
      }
    };
    
    saveState();
  }, [state.connectedProviders, state.viewMode, state.cardSize, state.currentProvider]);

  // Connect a provider
  const connectProvider = useCallback(async (providerId: string, tokens?: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // If tokens not provided, initiate OAuth
      const authTokens = tokens || await mockOAuth(providerId);
      
      const provider: ConnectedProvider = {
        id: providerId,
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        connectedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      setState(prev => ({
        ...prev,
        connectedProviders: {
          ...prev.connectedProviders,
          [providerId]: provider
        },
        isLoading: false
      }));
      
      toast.success(
        fileManagementStrings.success.connected.replace('{{provider}}', providerId)
      );
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Connection failed' }));
      throw error;
    }
  }, []);

  // Disconnect a provider
  const disconnectProvider = useCallback(async (providerId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => {
        const { [providerId]: removed, ...rest } = prev.connectedProviders;
        return {
          ...prev,
          connectedProviders: rest,
          currentProvider: prev.currentProvider === providerId ? null : prev.currentProvider,
          isLoading: false
        };
      });
      
      toast.success(
        fileManagementStrings.success.disconnected.replace('{{provider}}', providerId)
      );
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Disconnection failed' }));
      throw error;
    }
  }, []);

  // Set current provider
  const setCurrentProvider = useCallback(async (providerId: string | null) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    if (providerId) {
      const files = await fetchFiles('/');
      setState(prev => ({
        ...prev,
        currentProvider: providerId,
        currentPath: [],
        files,
        isLoading: false
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentProvider: null,
        currentPath: [],
        files: [],
        isLoading: false
      }));
    }
  }, []);

  // Navigate to a folder
  const navigateToFolder = useCallback(async (path: string[]) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const pathString = '/' + path.join('/');
    const files = await fetchFiles(pathString);
    
    setState(prev => ({
      ...prev,
      currentPath: path,
      files,
      isLoading: false
    }));
  }, []);

  // Search files
  const searchFiles = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    if (!query) {
      // Reset to current path files
      const pathString = '/' + state.currentPath.join('/');
      const files = await fetchFiles(pathString);
      setState(prev => ({ ...prev, files }));
      return;
    }
    
    // Client-side filtering for now
    // In a real app, this would be server-side search
    const filterFiles = (items: FileItem[]): FileItem[] => {
      const results: FileItem[] = [];
      
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.children) {
          const childResults = filterFiles(item.children);
          if (childResults.length > 0) {
            results.push({
              ...item,
              children: childResults
            });
          }
        }
      }
      
      return results;
    };
    
    setState(prev => ({ ...prev, files: filterFiles(prev.files) }));
  }, [state.currentPath]);

  // Change view mode
  const setViewMode = useCallback((mode: 'list' | 'card' | 'thumbnail') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  // Change card size
  const setCardSize = useCallback((size: 'sm' | 'md' | 'lg') => {
    setState(prev => ({ ...prev, cardSize: size }));
  }, []);

  // Get file by ID
  const getFileById = useCallback((fileId: string): FileItem | null => {
    const findInTree = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === fileId) return item;
        if (item.children) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInTree(state.files);
  }, [state.files]);

  return {
    // State
    connectedProviders: state.connectedProviders,
    currentProvider: state.currentProvider,
    currentPath: state.currentPath,
    files: state.files,
    viewMode: state.viewMode,
    cardSize: state.cardSize,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    connectProvider,
    disconnectProvider,
    setCurrentProvider,
    navigateToFolder,
    searchFiles,
    setViewMode,
    setCardSize,
    getFileById
  };
}