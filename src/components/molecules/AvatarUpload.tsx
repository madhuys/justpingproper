'use client';

import React from 'react';
import Image from 'next/image';
import { Camera, Crop, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar: string;
  originalAvatar?: string;
  isEditing: boolean;
  onUpload: (files: FileList | null) => void;
  onCropClick?: () => void;
  strings: {
    uploadLabel: string;
    changeLabel: string;
    cropLabel: string;
    noPhotoLabel: string;
    recommendation?: string;
  };
  size?: number;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  originalAvatar,
  isEditing,
  onUpload,
  onCropClick,
  strings,
  size = 128,
  className
}: AvatarUploadProps) {
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Avatar Upload/Display */}
      <div className="relative group">
        {currentAvatar ? (
          <div className="relative" style={{ width: size, height: size }}>
            <Image
              src={currentAvatar}
              alt="Profile photo"
              fill
              className="object-cover rounded-full border-2 border-border"
            />
            {isEditing && (
              <div className="absolute inset-0 flex rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Change Photo Option */}
                <label 
                  htmlFor="avatar-upload" 
                  className="flex-1 flex flex-col items-center justify-center bg-black/60 hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-white mb-1" />
                  <span className="text-xs text-white">{strings.changeLabel}</span>
                </label>
                
                {/* Vertical Divider */}
                {onCropClick && <div className="w-px bg-white/30" />}
                
                {/* Crop Option */}
                {onCropClick && (
                  <button
                    type="button"
                    onClick={onCropClick}
                    className="flex-1 flex flex-col items-center justify-center bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <Crop className="h-6 w-6 text-white mb-1" />
                    <span className="text-xs text-white">{strings.cropLabel}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <label 
            htmlFor="avatar-upload" 
            className={cn(
              "border-2 border-dashed border-border rounded-full flex flex-col items-center justify-center",
              isEditing && "cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            )}
            style={{ width: size, height: size }}
          >
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">
              {isEditing ? strings.uploadLabel : strings.noPhotoLabel}
            </span>
          </label>
        )}
        {isEditing && (
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={(e) => onUpload(e.target.files)}
            className="sr-only"
          />
        )}
      </div>
      
      {strings.recommendation && (
        <p className="text-xs text-muted-foreground text-center">
          {strings.recommendation}
        </p>
      )}
    </div>
  );
}