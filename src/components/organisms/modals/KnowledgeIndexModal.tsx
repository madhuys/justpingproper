import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileExplorerModal } from "@/components/organisms/modals/FileExplorerModal";
import { Badge } from "@/components/ui/badge";
import { FileText, Folder } from "lucide-react";
import toast from 'react-hot-toast';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import embeddingProviders from '@/data/embeddingProviders.json';

interface KnowledgeIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIndex: (data: {
    name: string;
    description?: string;
    selectedFiles: string[];
    provider: string;
    model: string;
  }) => void;
}

export function KnowledgeIndexModal({ isOpen, onClose, onCreateIndex }: KnowledgeIndexModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedFiles: [] as string[],
    provider: '',
    model: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

  const selectedProvider = embeddingProviders.find(p => p.id === formData.provider);
  const availableModels = selectedProvider?.models || [];

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (formData.selectedFiles.length === 0) {
        toast.error(knowledgebaseStrings.modals.knowledgeIndex.validation.filesRequired);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.name.trim()) {
        toast.error(knowledgebaseStrings.modals.knowledgeIndex.validation.nameRequired);
        return;
      }
      if (!formData.provider) {
        toast.error(knowledgebaseStrings.modals.knowledgeIndex.validation.providerRequired);
        return;
      }
      if (!formData.model) {
        toast.error(knowledgebaseStrings.modals.knowledgeIndex.validation.modelRequired);
        return;
      }
      setStep(3);
    }
  }, [step, formData]);

  const handleBack = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    await onCreateIndex(formData);
    setIsCreating(false);
    handleClose();
  }, [formData, onCreateIndex]);

  const handleClose = useCallback(() => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      selectedFiles: [],
      provider: '',
      model: ''
    });
    onClose();
  }, [onClose]);

  const handleFileSelection = useCallback((files: string[]) => {
    setFormData({ ...formData, selectedFiles: files });
    setIsFileExplorerOpen(false);
  }, [formData]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-3">Selected Files</h4>
              {formData.selectedFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No files selected yet
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total selected:</span>
                    <Badge variant="secondary">{formData.selectedFiles.length} items</Badge>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {formData.selectedFiles.slice(0, 10).map((fileId, index) => (
                      <div key={fileId} className="flex items-center gap-2 text-sm py-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate text-xs">{fileId}</span>
                      </div>
                    ))}
                    {formData.selectedFiles.length > 10 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        ... and {formData.selectedFiles.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => setIsFileExplorerOpen(true)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {formData.selectedFiles.length === 0 ? 'Select Files' : 'Change Selection'}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{knowledgebaseStrings.modals.knowledgeIndex.fields.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={knowledgebaseStrings.modals.knowledgeIndex.fields.namePlaceholder}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">{knowledgebaseStrings.modals.knowledgeIndex.fields.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={knowledgebaseStrings.modals.knowledgeIndex.fields.descriptionPlaceholder}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="provider">{knowledgebaseStrings.modals.knowledgeIndex.fields.provider}</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value, model: '' })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={knowledgebaseStrings.modals.knowledgeIndex.fields.providerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {embeddingProviders.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.provider && (
              <div>
                <Label htmlFor="model">{knowledgebaseStrings.modals.knowledgeIndex.fields.model}</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={knowledgebaseStrings.modals.knowledgeIndex.fields.modelPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Index Configuration Summary</h4>
              
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{formData.name}</p>
              </div>

              {formData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Selected Files</p>
                <p className="text-sm font-medium">{formData.selectedFiles.length} documents</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Embedding Provider</p>
                <p className="text-sm font-medium">{selectedProvider?.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-sm font-medium">
                  {availableModels.find(m => m.id === formData.model)?.name}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                The index will be built asynchronously. You'll see a progress bar at the bottom of the screen,
                and will be notified when the index is ready for use.
              </p>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    const steps = knowledgebaseStrings.modals.knowledgeIndex.steps;
    switch (step) {
      case 1: return steps.selectFiles;
      case 2: return steps.configure;
      case 3: return steps.confirm;
      default: return '';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl glassmorphic-modal">
          <DialogHeader>
            <DialogTitle>
              {knowledgebaseStrings.modals.knowledgeIndex.title} - {getStepTitle()}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {renderStepContent()}
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    {knowledgebaseStrings.actions.back}
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  {knowledgebaseStrings.actions.cancel}
                </Button>
                {step < 3 ? (
                  <Button onClick={handleNext}>
                    {knowledgebaseStrings.actions.next}
                  </Button>
                ) : (
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? 'Creating...' : knowledgebaseStrings.actions.createIndex}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileExplorerModal
        isOpen={isFileExplorerOpen}
        onClose={() => setIsFileExplorerOpen(false)}
        onConfirm={handleFileSelection}
        title="Select Files for Knowledge Index"
        confirmText="Select Files"
      />
    </>
  );

  return createPortal(modalContent, document.body);
}