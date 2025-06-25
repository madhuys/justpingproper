'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  List, 
  Grid3X3, 
  Grid2X2,
  ChevronRight,
  Home,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader } from '@/components/atoms/Loader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { FileListView } from '@/components/molecules/FileListView';
import { FileCardView } from '@/components/molecules/FileCardView';
import { FileThumbnailView } from '@/components/molecules/FileThumbnailView';
import { FilePreviewModal } from '@/components/organisms/modals/FilePreviewModal';
import { FileBreadcrumb } from '@/components/molecules/FileBreadcrumb';
import { useFileManager } from '@/hooks/useFileManager';
import fileManagementStrings from '@/data/strings/fileManagement.json';
import { FolderOpen, FileX } from 'lucide-react';

interface FileExplorerProps {
  provider: string;
  onBack: () => void;
}

const viewModeIcons = {
  list: List,
  card: Grid2X2,
  thumbnail: Grid3X3
};

export function FileExplorer({ provider, onBack }: FileExplorerProps) {
  const {
    currentPath,
    files,
    viewMode,
    cardSize,
    searchQuery,
    isLoading,
    navigateToFolder,
    searchFiles,
    setViewMode,
    setCardSize,
    getFileById
  } = useFileManager();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isExpanded, setIsExpanded] = useState(() => {
    // Load expanded state from localStorage
    const saved = localStorage.getItem('fileExplorerExpanded');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Map cardSize to numeric value for slider
  const cardSizeToNumber = { sm: 0, md: 1, lg: 2 };
  const numberToCardSize = ['sm', 'md', 'lg'] as const;
  const cardSizeValue = cardSizeToNumber[cardSize];

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFiles(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, searchFiles]);

  // Save expanded state
  useEffect(() => {
    localStorage.setItem('fileExplorerExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const handleFileClick = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (file.type === 'folder') {
      navigateToFolder([...currentPath, file.name]);
    } else {
      setSelectedFile(fileId);
      setIsPreviewOpen(true);
    }
  };

  const handleBreadcrumbNavigate = (index: number) => {
    if (index === -1) {
      navigateToFolder([]);
    } else {
      navigateToFolder(currentPath.slice(0, index + 1));
    }
  };

  const handleViewModeChange = (mode: 'list' | 'card' | 'thumbnail') => {
    setViewMode(mode);
  };

  const selectedFileData = selectedFile ? getFileById(selectedFile) : null;

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg shadow-sm ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
      {/* Expand/Collapse button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-card shadow-lg border border-border hover:bg-accent"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse to default width" : "Expand to full width"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Header */}
      <div className="border-b px-6 py-4 bg-card/50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {provider.charAt(0).toUpperCase() + provider.slice(1).replace('-', ' ')}
            </h1>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b px-6 py-3 bg-background/50">
        <div className="flex items-center gap-4">
          {/* Breadcrumb */}
          <div className="flex-1 overflow-hidden">
            <FileBreadcrumb
              path={currentPath}
              onNavigate={handleBreadcrumbNavigate}
            />
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={fileManagementStrings.explorer.toolbar.search.placeholder}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center border rounded-md">
            {Object.entries(viewModeIcons).map(([mode, Icon]) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange(mode as any)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
                title={fileManagementStrings.explorer.toolbar.view[mode as keyof typeof fileManagementStrings.explorer.toolbar.view]}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-6 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size="lg" />
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={searchQuery ? FileX : FolderOpen}
            title={
              searchQuery 
                ? 'No files found' 
                : fileManagementStrings.explorer.emptyFolder.title
            }
            description={
              searchQuery
                ? `No files matching "${searchQuery}"`
                : fileManagementStrings.explorer.emptyFolder.description
            }
          />
        ) : (
          <>
            {viewMode === 'list' && (
              <FileListView
                files={files}
                onFileClick={handleFileClick}
              />
            )}
            {viewMode === 'card' && (
              <FileCardView
                files={files}
                onFileClick={handleFileClick}
                cardSize={cardSizeValue}
                onCardSizeChange={(value) => setCardSize(numberToCardSize[value] as 'sm' | 'md' | 'lg')}
                showSizeSlider={true}
              />
            )}
            {viewMode === 'thumbnail' && (
              <FileThumbnailView
                files={files}
                onFileClick={handleFileClick}
              />
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {selectedFileData && (
        <FilePreviewModal
          file={selectedFileData}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}