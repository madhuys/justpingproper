'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { AvatarUpload } from '@/components/molecules/AvatarUpload';
import { UserProfileFields } from '@/components/molecules/UserProfileFields';
import { Edit, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageCropperModal } from '@/components/organisms/modals/ImageCropperModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import profileStrings from '@/data/strings/profile.json';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const strings = profileStrings;
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('');
  const [originalAvatarSrc, setOriginalAvatarSrc] = useState<string>('');
  
  const { loading, profileData, updateField, saveProfile, refreshProfile, authUser } = useUserProfile();

  useEffect(() => {
    setMounted(true);
    if (profileData.avatar || authUser?.photoURL) {
      setOriginalAvatarSrc(profileData.avatar || authUser?.photoURL || '');
    }
  }, [profileData.avatar, authUser?.photoURL]);

  const handleSave = async () => {
    const success = await saveProfile(profileData);
    if (success) {
      toast.success(strings.messages.updateSuccess);
      setIsEditing(false);
    } else {
      toast.error(strings.messages.updateError);
    }
  };

  const handleCancel = () => {
    refreshProfile();
    setIsEditing(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileUrl = URL.createObjectURL(files[0]);
    setTempImageSrc(fileUrl);
    setOriginalAvatarSrc(fileUrl);
    setShowImageCropper(true);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    updateField('avatar', croppedImageUrl);
    setTempImageSrc('');
  };

  if (loading || !mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
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
          
          {/* Avatar Section */}
          <div className="mb-8">
            <AvatarUpload
              currentAvatar={profileData.avatar || authUser?.photoURL || ''}
              originalAvatar={originalAvatarSrc}
              isEditing={isEditing}
              onUpload={handleFileUpload}
              onCropClick={() => {
                setTempImageSrc(originalAvatarSrc || profileData.avatar || authUser?.photoURL || '');
                setShowImageCropper(true);
              }}
              strings={{
                uploadLabel: strings.avatar.uploadLabel,
                changeLabel: strings.avatar.changeLabel,
                cropLabel: strings.avatar.cropLabel,
                noPhotoLabel: strings.avatar.noPhotoLabel,
                recommendation: strings.avatar.recommendation
              }}
            />
          </div>

          {/* Profile Fields */}
          <UserProfileFields
            data={profileData}
            isEditing={isEditing}
            onUpdate={updateField}
          />
        </CardContent>
      </Card>

      <ImageCropperModal
        isOpen={showImageCropper}
        onClose={() => {
          setShowImageCropper(false);
          setTempImageSrc('');
        }}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Profile Photo"
      />
    </div>
  );
}