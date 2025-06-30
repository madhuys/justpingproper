'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUploadArea } from '@/components/molecules/FileUploadArea';
import { useContent } from '@/hooks/useContent';
import toast from 'react-hot-toast';
import { X, Plus, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CreateKnowledgebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: any;
}

export function CreateKnowledgebaseModal({ 
  isOpen, 
  onClose,
  businessProfile 
}: CreateKnowledgebaseModalProps) {
  const { content } = useContent('businessProfile');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    useExistingDocs: true,
    additionalDocs: [] as File[],
    urls: [] as string[]
  });
  const [currentUrl, setCurrentUrl] = useState('');

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error(content?.validation?.required || 'Knowledgebase name is required');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, make API call to create knowledgebase
      // Simulate API call - replace with actual implementation
      const response = { ok: true }; // Mock response
      
      // In production, uncomment and use actual API:
      // const response = await fetch('/api/knowledgebase', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: formData.name,
      //     useExistingDocs: formData.useExistingDocs,
      //     additionalDocs: formData.additionalDocs.map(f => f.name),
      //     urls: formData.urls,
      //     businessId: businessProfile?.id
      //   })
      // });

      if (response.ok) {
        setShowSuccess(true);
        toast.success(
          content?.knowledgebaseModal?.messages?.creationInProgress || 
          'Knowledgebase creation in progress'
        );
      }
    } catch (error) {
      toast.error(
        content?.toast?.knowledgebaseError || 
        'Failed to create knowledgebase'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = () => {
    if (currentUrl.trim() && isValidUrl(currentUrl)) {
      setFormData({
        ...formData,
        urls: [...formData.urls, currentUrl.trim()]
      });
      setCurrentUrl('');
    } else {
      toast.error(content?.validation?.invalidUrl || 'Please enter a valid URL');
    }
  };

  const removeUrl = (index: number) => {
    setFormData({
      ...formData,
      urls: formData.urls.filter((_, i) => i !== index)
    });
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after animation
    setTimeout(() => {
      setFormData({
        name: '',
        useExistingDocs: true,
        additionalDocs: [],
        urls: []
      });
      setCurrentUrl('');
      setShowSuccess(false);
    }, 300);
  };


  const renderModal = (modalContent: React.ReactNode) => {
    if (!isOpen) return null;

    const modalElement = (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={handleClose}
        />
        
        {/* Modal centered in page body */}
        <div 
          className="fixed z-50 flex items-center justify-center"
          style={{
            top: '4rem',      // Header height
            left: '16rem',    // Sidebar width
            right: 0,
            bottom: '3rem',   // Footer height
          }}
        >
          {modalContent}
        </div>
      </>
    );

    // Use portal to render outside of current DOM hierarchy
    if (typeof window !== 'undefined') {
      return createPortal(modalElement, document.body);
    }
    return null;
  };

  if (showSuccess) {
    return renderModal(
      <Card className="glassmorphic-modal w-full max-w-[500px]" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>{content?.knowledgebaseModal?.title || 'Create Company Knowledgebase'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {content?.knowledgebaseModal?.messages?.submissionSuccess ||
              "Your knowledgebase request is submitted. It will be ready in 5–30 minutes depending on content volume. You'll be notified once it's available."}
          </p>
          <div className="flex justify-end">
            <Button onClick={handleClose}>
              {content?.knowledgebaseModal?.actions?.gotIt || 'Got it'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return renderModal(
    <Card className="glassmorphic-modal w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
      <CardHeader>
        <CardTitle>{content?.knowledgebaseModal?.title || 'Create Company Knowledgebase'}</CardTitle>
        <CardDescription>
          Create a new knowledgebase from your business documents and web content
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-1">

        <div className="space-y-4 py-4">
          {/* Knowledgebase Name */}
          <div>
            <Label htmlFor="kb-name">
              {content?.knowledgebaseModal?.fields?.name || 'Knowledgebase Name'} *
            </Label>
            <Input
              id="kb-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter knowledgebase name"
              className="mt-2"
            />
          </div>

          {/* Use Existing Documents */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-existing"
              checked={formData.useExistingDocs}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, useExistingDocs: checked as boolean })
              }
            />
            <Label htmlFor="use-existing" className="cursor-pointer">
              {content?.knowledgebaseModal?.fields?.useExistingDocs}
            </Label>
          </div>

          {/* Add More Documents */}
          <div>
            <Label>
              {content?.knowledgebaseModal?.fields?.addMoreDocs}
            </Label>
            <FileUploadArea
              onFileSelect={(files) => 
                setFormData({ ...formData, additionalDocs: [...formData.additionalDocs, ...files] })
              }
              className="mt-2"
            />
            {formData.additionalDocs.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.additionalDocs.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span>{file.name}</span>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        additionalDocs: formData.additionalDocs.filter((_, i) => i !== index)
                      })}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Include Web Content */}
          <div>
            <Label>
              {content?.knowledgebaseModal?.fields?.includeWebContent || 'Include Web Content'}
              <span className="text-xs text-muted-foreground ml-2">(Add multiple URLs)</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddUrl}
                type="button"
              >
                <Plus className="h-4 w-4 mr-1" />
                {content?.knowledgebaseModal?.actions?.addUrl || 'Add'}
              </Button>
            </div>
            {formData.urls.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {formData.urls.length} URL{formData.urls.length !== 1 ? 's' : ''} added:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                  {formData.urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded hover:bg-muted/80 transition-colors">
                      <span className="truncate flex-1 mr-2">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeUrl(index)}
                        className="text-destructive hover:text-destructive/80 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            {content?.knowledgebaseModal?.actions?.cancel || 'Cancel'}
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!formData.name.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              content?.knowledgebaseModal?.actions?.create || 'Create'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}