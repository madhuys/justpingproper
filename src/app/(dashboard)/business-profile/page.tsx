'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { AvatarUpload } from '@/components/molecules/AvatarUpload';
import { BusinessProfileFields } from '@/components/molecules/BusinessProfileFields';
import { DocumentManager } from '@/components/molecules/DocumentManager';
import { ImageCarousel } from '@/components/molecules/ImageCarousel';
import { Edit, BookOpen, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateKnowledgebaseModal } from '@/components/organisms/modals/CreateKnowledgebaseModal';
import { ImageCropperModal } from '@/components/organisms/modals/ImageCropperModal';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import businessProfileStrings from '@/data/strings/businessProfile.json';
import toast from 'react-hot-toast';

export default function BusinessProfilePage() {
  const strings = businessProfileStrings;
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showKnowledgebaseModal, setShowKnowledgebaseModal] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('');
  const [originalLogoSrc, setOriginalLogoSrc] = useState<string>('');
  
  const { loading, profileData, updateField, saveProfile, refreshProfile } = useBusinessProfile();

  useEffect(() => {
    setMounted(true);
    if (profileData.logo) {
      setOriginalLogoSrc(profileData.logo);
    }
  }, [profileData.logo]);

  const handleSave = async () => {
    const success = await saveProfile(profileData);
    if (success) {
      toast.success(strings.toast.profileUpdated);
      setIsEditing(false);
    } else {
      toast.error(strings.toast.profileUpdateError);
    }
  };

  const handleCancel = () => {
    refreshProfile();
    setIsEditing(false);
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileUrls = Array.from(files).map(file => URL.createObjectURL(file));
    
    if (field === 'logo') {
      setTempImageSrc(fileUrls[0]);
      setOriginalLogoSrc(fileUrls[0]);
      setShowImageCropper(true);
    } else if (field === 'additionalImages') {
      updateField('additionalImages', [...profileData.additionalImages, ...fileUrls]);
    } else if (field === 'documents') {
      updateField('documents', [...profileData.documents, ...Array.from(files)]);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    updateField('logo', croppedImageUrl);
    setTempImageSrc('');
  };

  const removeImage = (index: number) => {
    updateField('additionalImages', profileData.additionalImages.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    updateField('documents', profileData.documents.filter((_, i) => i !== index));
  };

  if (loading || !mounted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      <Card>
        <CardContent className="p-8">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-8">
            <div>
              <h1 className="text-2xl font-bold">{strings.header.title}</h1>
              <p className="text-muted-foreground mt-1">{strings.header.description}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKnowledgebaseModal(true)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {strings.header.createKnowledgebaseButton}
              </Button>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {strings.header.editButton}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    {strings.header.cancelButton}
                  </Button>
                  <Button 
                    onClick={handleSave}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {strings.header.saveButton}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Company Logo Section */}
          <div className="mb-8">
            <AvatarUpload
              currentAvatar={profileData.logo || ''}
              originalAvatar={originalLogoSrc}
              isEditing={isEditing}
              onUpload={(files) => handleFileUpload('logo', files)}
              onCropClick={() => {
                setTempImageSrc(originalLogoSrc || profileData.logo || '');
                setShowImageCropper(true);
              }}
              strings={{
                uploadLabel: strings.labels.uploadLogo,
                changeLabel: strings.labels.change,
                cropLabel: strings.labels.crop,
                noPhotoLabel: strings.labels.noLogo,
                recommendation: strings.labels.logoRecommendation
              }}
            />

            {/* Additional Images Carousel */}
            <ImageCarousel
              images={profileData.additionalImages}
              isEditing={isEditing}
              onUpload={(files) => handleFileUpload('additionalImages', files)}
              onRemove={removeImage}
            />
          </div>

          {/* Business Fields */}
          <BusinessProfileFields
            data={profileData}
            isEditing={isEditing}
            onUpdate={updateField}
          />

          {/* Documents Section */}
          <div className="mt-6">
            <DocumentManager
              documents={profileData.documents}
              isEditing={isEditing}
              onUpload={(files) => handleFileUpload('documents', files)}
              onRemove={removeDocument}
            />
          </div>
        </CardContent>
      </Card>

      <CreateKnowledgebaseModal 
        isOpen={showKnowledgebaseModal}
        onClose={() => setShowKnowledgebaseModal(false)}
        businessProfile={profileData}
      />

      <ImageCropperModal
        isOpen={showImageCropper}
        onClose={() => {
          setShowImageCropper(false);
          setTempImageSrc('');
        }}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Company Logo"
      />
    </div>
  );
}