import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileExplorerModal } from "@/components/organisms/modals/FileExplorerModal";
import { Badge } from "@/components/ui/badge";
import toast from 'react-hot-toast';
import { Upload, FileText, Folder } from 'lucide-react';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import classifierModels from '@/data/classifierModels.json';

interface ClassifierIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClassifier: (data: {
    name: string;
    description?: string;
    model: string;
    datasetFile: File | string[] | null;
  }) => void;
}

export function ClassifierIndexModal({ isOpen, onClose, onCreateClassifier }: ClassifierIndexModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model: '',
    datasetFile: null as File | null,
    datasetFiles: [] as string[]
  });
  const [datasetSource, setDatasetSource] = useState<'upload' | 'select'>('upload');
  const [isCreating, setIsCreating] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = classifierModels.find(m => m.id === formData.model);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error(knowledgebaseStrings.modals.classifierIndex.validation.nameRequired);
        return;
      }
      if (!formData.model) {
        toast.error(knowledgebaseStrings.modals.classifierIndex.validation.modelRequired);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (datasetSource === 'upload' && !formData.datasetFile) {
        toast.error(knowledgebaseStrings.modals.classifierIndex.validation.datasetRequired);
        return;
      }
      if (datasetSource === 'select' && formData.datasetFiles.length === 0) {
        toast.error(knowledgebaseStrings.modals.classifierIndex.validation.datasetRequired);
        return;
      }
      setStep(3);
    }
  }, [step, formData, datasetSource]);

  const handleBack = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    await onCreateClassifier({
      ...formData,
      datasetFile: datasetSource === 'upload' ? formData.datasetFile : formData.datasetFiles
    });
    setIsCreating(false);
    handleClose();
  }, [formData, datasetSource, onCreateClassifier]);

  const handleClose = useCallback(() => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      model: '',
      datasetFile: null,
      datasetFiles: []
    });
    setDatasetSource('upload');
    onClose();
  }, [onClose]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.jsonl') || file.name.endsWith('.json')) {
        setFormData({ ...formData, datasetFile: file });
      } else {
        toast.error('Please upload a CSV or JSONL file');
      }
    }
  }, [formData]);

  const handleFileSelection = useCallback((files: string[]) => {
    setFormData({ ...formData, datasetFiles: files });
    setIsFileExplorerOpen(false);
  }, [formData]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{knowledgebaseStrings.modals.classifierIndex.fields.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={knowledgebaseStrings.modals.classifierIndex.fields.namePlaceholder}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">{knowledgebaseStrings.modals.classifierIndex.fields.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={knowledgebaseStrings.modals.classifierIndex.fields.descriptionPlaceholder}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="model">{knowledgebaseStrings.modals.classifierIndex.fields.model}</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder={knowledgebaseStrings.modals.classifierIndex.fields.modelPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {classifierModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>{knowledgebaseStrings.modals.classifierIndex.fields.dataset}</Label>
              <div className="mt-2 space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={datasetSource === 'upload' ? 'default' : 'outline'}
                    onClick={() => setDatasetSource('upload')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {knowledgebaseStrings.modals.classifierIndex.fields.uploadDataset}
                  </Button>
                  <Button
                    type="button"
                    variant={datasetSource === 'select' ? 'default' : 'outline'}
                    onClick={() => setDatasetSource('select')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {knowledgebaseStrings.modals.classifierIndex.fields.selectDataset}
                  </Button>
                </div>

                {datasetSource === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.jsonl,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.datasetFile ? (
                        <div className="space-y-2">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm font-medium">{formData.datasetFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.datasetFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CSV or JSONL files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-3">Selected Dataset Files</h4>
                      {formData.datasetFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No files selected yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total selected:</span>
                            <Badge variant="secondary">{formData.datasetFiles.length} files</Badge>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {formData.datasetFiles.slice(0, 5).map((fileId) => (
                              <div key={fileId} className="flex items-center gap-2 text-sm py-1">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate text-xs">{fileId}</span>
                              </div>
                            ))}
                            {formData.datasetFiles.length > 5 && (
                              <p className="text-xs text-muted-foreground pl-5">
                                ... and {formData.datasetFiles.length - 5} more
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
                        {formData.datasetFiles.length === 0 ? 'Select Dataset Files' : 'Change Selection'}
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Classifier Configuration Summary</h4>
              
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
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-sm font-medium">{selectedModel?.name}</p>
                {selectedModel?.description && (
                  <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Training Dataset</p>
                <p className="text-sm font-medium">
                  {datasetSource === 'upload' 
                    ? formData.datasetFile?.name 
                    : `${formData.datasetFiles.length} files selected`}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                The classifier will be trained asynchronously. You'll see a progress bar at the bottom of the screen,
                and will be notified when the classifier is ready for use.
              </p>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    const steps = knowledgebaseStrings.modals.classifierIndex.steps;
    switch (step) {
      case 1: return steps.configure;
      case 2: return steps.dataset;
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
              {knowledgebaseStrings.modals.classifierIndex.title} - {getStepTitle()}
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
                    {isCreating ? 'Creating...' : knowledgebaseStrings.actions.createClassifier}
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
        title="Select Dataset Files"
        confirmText="Select Files"
      />
    </>
  );

  return createPortal(modalContent, document.body);
}