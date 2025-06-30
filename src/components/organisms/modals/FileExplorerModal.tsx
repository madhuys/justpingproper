import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  List, 
  Grid3X3, 
  Grid2X2,
  ChevronRight,
  ChevronDown,
  Home,
  Folder,
  File,
  FileText,
  FolderOpen,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileIcon } from '@/components/atoms/FileIcon';
import { FileListView } from '@/components/molecules/FileListView';
import { FileCardView } from '@/components/molecules/FileCardView';
import { FileThumbnailView } from '@/components/molecules/FileThumbnailView';
import { FileBreadcrumb } from '@/components/molecules/FileBreadcrumb';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Loader } from '@/components/atoms/Loader';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFiles: string[]) => void;
  title: string;
  confirmText?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  children?: FileItem[];
  path?: string[];
}

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  path: string[];
}

export function FileExplorerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  confirmText = "Select Files"
}: FileExplorerModalProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'thumbnail'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Load files from API based on current path
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      
      try {
        const pathString = '/' + currentPath.join('/');
        const response = await fetch(`/api/files?path=${encodeURIComponent(pathString)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        
        const data = await response.json();
        let fileList: FileItem[] = data.files || [];
        
        // Apply search filter if needed
        if (searchQuery) {
          const filterFiles = (files: FileItem[]): FileItem[] => {
            return files.reduce((acc: FileItem[], file) => {
              const matches = file.name.toLowerCase().includes(searchQuery.toLowerCase());
              
              if (file.type === 'folder' && file.children) {
                const filteredChildren = filterFiles(file.children);
                if (filteredChildren.length > 0 || matches) {
                  acc.push({ ...file, children: filteredChildren });
                }
              } else if (matches) {
                acc.push(file);
              }
              
              return acc;
            }, []);
          };
          
          fileList = filterFiles(fileList);
        }
        
        setFiles(fileList);
      } catch (error) {
        console.error('Error loading files:', error);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFiles();
  }, [currentPath, searchQuery]);
  
  const navigateToFolder = (path: string[]) => {
    setCurrentPath(path);
  };
  
  const searchFiles = (query: string) => {
    setSearchQuery(query);
  };

  // Build hierarchy tree from selected files
  const buildHierarchyTree = useCallback((): TreeNode[] => {
    const tree: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // Helper to find file by id in the current files
    const findFileById = (id: string, fileList: FileItem[]): FileItem | null => {
      for (const file of fileList) {
        if (file.id === id) return file;
        if (file.children) {
          const found = findFileById(id, file.children);
          if (found) return found;
        }
      }
      return null;
    };

    // Build tree from selected files
    Array.from(selectedFiles).forEach(fileId => {
      const fileData = findFileById(fileId, files);
      if (!fileData) return;

      // Parse the path from the file id (which is the relative path)
      const pathSegments = fileId.split('/');
      
      // Create nodes for each level of the path
      let currentLevel = tree;
      let currentPath: string[] = [];

      pathSegments.forEach((segment, index) => {
        currentPath.push(segment);
        const nodeId = currentPath.join('/');
        
        let node = currentLevel.find(n => n.name === segment);
        
        if (!node) {
          node = {
            id: nodeId,
            name: segment,
            type: index === pathSegments.length - 1 ? fileData.type : 'folder',
            children: [],
            path: [...currentPath]
          };
          currentLevel.push(node);
          nodeMap.set(nodeId, node);
        }
        
        currentLevel = node.children;
      });
    });

    return tree;
  }, [selectedFiles, files]);

  const hierarchyTree = buildHierarchyTree();

  // Toggle file/folder selection
  const toggleSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  // Toggle all files in current view
  const toggleSelectAll = useCallback(() => {
    const allFileIds = files.map(f => f.id);
    const allSelected = allFileIds.every(id => selectedFiles.has(id));
    
    if (allSelected) {
      // Deselect all files in current view
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        allFileIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all files in current view
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        allFileIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [files, selectedFiles]);

  const handleConfirm = () => {
    onConfirm(Array.from(selectedFiles));
    handleClose();
  };

  const handleClose = () => {
    setSelectedFiles(new Set());
    setSearchQuery('');
    onClose();
  };

  const handleBreadcrumbNavigate = (index: number) => {
    if (index === -1) {
      navigateToFolder([]);
    } else {
      navigateToFolder(currentPath.slice(0, index + 1));
    }
  };

  // Render hierarchy tree node
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div 
          className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              setExpandedFolders(prev => {
                const newSet = new Set(prev);
                if (newSet.has(node.id)) {
                  newSet.delete(node.id);
                } else {
                  newSet.add(node.id);
                }
                return newSet;
              });
            }
          }}
        >
          {hasChildren && (
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 mr-1">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          {node.type === 'folder' ? (
            <Folder className="h-4 w-4 text-blue-500 mr-2" />
          ) : (
            <FileIcon mimeType="" className="h-4 w-4 mr-2" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Custom file view with checkboxes
  const renderFileView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <EmptyState
            icon={FolderOpen}
            title="No files found"
            description="This folder is empty or no files match your search"
          />
        </div>
      );
    }

    // Add checkbox to each file
    const filesWithSelection = files.map(file => ({
      ...file,
      isSelected: selectedFiles.has(file.id),
      onToggleSelect: () => toggleSelection(file.id)
    }));

    switch (viewMode) {
      case 'list':
        return <FileListViewWithCheckbox files={filesWithSelection} onFileClick={handleFileClick} />;
      case 'card':
        return <FileCardViewWithCheckbox files={filesWithSelection} onFileClick={handleFileClick} />;
      case 'thumbnail':
        return <FileThumbnailViewWithCheckbox files={filesWithSelection} onFileClick={handleFileClick} />;
    }
  };

  const handleFileClick = (fileId: string) => {
    // Find file recursively
    const findFile = (fileList: FileItem[], id: string): FileItem | null => {
      for (const file of fileList) {
        if (file.id === id) return file;
        if (file.children) {
          const found = findFile(file.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const file = findFile(files, fileId);
    if (!file) return;

    if (file.type === 'folder') {
      // Navigate to the folder's path
      const pathSegments = file.id.split('/');
      navigateToFolder(pathSegments);
    }
  };

  const viewModeIcons = {
    list: List,
    card: Grid2X2,
    thumbnail: Grid3X3
  };

  if (!isOpen) return null;

  const modalContent = (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] translate-x-[-50%] translate-y-[-50%] rounded-lg glassmorphic-modal duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] p-0 gap-0"
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main file explorer area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="px-6 py-3 border-b flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateToFolder([])}
                >
                  <Home className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <FileBreadcrumb
                  path={currentPath}
                  onNavigate={handleBreadcrumbNavigate}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchFiles(e.target.value);
                    }}
                    className="pl-8 w-64"
                  />
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                  {Object.entries(viewModeIcons).map(([mode, Icon]) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode(mode as 'list' | 'card' | 'thumbnail')}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  Select All
                </Button>
              </div>
            </div>

            {/* File list */}
            <ScrollArea className="flex-1 px-6 py-4">
              {renderFileView()}
            </ScrollArea>
          </div>

          {/* Right panel - Selected files hierarchy */}
          <div className="w-80 border-l flex flex-col bg-muted/30">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Items</h3>
                <Badge variant="secondary">{selectedFiles.size}</Badge>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {hierarchyTree.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No items selected</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {hierarchyTree.map(node => renderTreeNode(node))}
                </div>
              )}
            </ScrollArea>
          </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={selectedFiles.size === 0}
              >
                {confirmText} ({selectedFiles.size} items)
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );

  return createPortal(modalContent, document.body);
}

// Extended file views with checkboxes
function FileListViewWithCheckbox({ files, onFileClick }: any) {
  return (
    <div className="space-y-1">
      {files.map((file: any) => (
        <div key={file.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded">
          <Checkbox
            checked={file.isSelected}
            onCheckedChange={file.onToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => onFileClick(file.id)}
          >
            <FileListView files={[file]} onFileClick={() => {}} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FileCardViewWithCheckbox({ files, onFileClick }: any) {
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {files.map((file: any) => (
        <div key={file.id} onClick={() => onFileClick(file.id)} className="group cursor-pointer">
          <Card className="hover:shadow-md transition-all duration-200 p-4 relative">
            <div className="absolute top-2 right-2 z-10">
              <Checkbox
                checked={file.isSelected}
                onCheckedChange={file.onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/80 border-2 shadow-sm backdrop-blur-sm"
              />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <FileIcon
                  type={file.type}
                  mimeType={file.mimeType}
                  size="md"
                />
              </div>
              <div className="text-center">
                <p className="font-medium truncate max-w-[150px] text-sm" title={file.name}>
                  {file.name}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {file.type === 'folder' ? 'Folder' : file.size ? formatFileSize(file.size) : ''}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

function FileThumbnailViewWithCheckbox({ files, onFileClick }: any) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {files.map((file: any) => (
        <div key={file.id} className="relative">
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={file.isSelected}
              onCheckedChange={file.onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border-2 w-4 h-4"
            />
          </div>
          <div onClick={() => onFileClick(file.id)}>
            <FileThumbnailView files={[file]} onFileClick={() => {}} />
          </div>
        </div>
      ))}
    </div>
  );
}