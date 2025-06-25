'use client';

import React from 'react';
import Image from 'next/image';
import { X, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import businessProfileStrings from '@/data/strings/businessProfile.json';

interface ImageCarouselProps {
  images: string[];
  isEditing: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export function ImageCarousel({ 
  images, 
  isEditing, 
  onUpload, 
  onRemove 
}: ImageCarouselProps) {
  const strings = businessProfileStrings;

  return (
    <div className="mt-8">
      <Label className="text-sm font-medium mb-3 block">
        {strings.fields.additionalImages}
      </Label>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {(images || []).map((img, index) => (
            <div key={index} className="relative flex-shrink-0 w-24 h-24 group">
              <Image
                src={img}
                alt={`Additional image ${index + 1}`}
                fill
                className="object-cover rounded-lg border"
              />
              {isEditing && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <label 
              htmlFor="additional-images-upload"
              className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </label>
          )}
        </div>
      </div>
      {isEditing && (
        <input
          id="additional-images-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onUpload(e.target.files)}
          className="sr-only"
        />
      )}
    </div>
  );
}