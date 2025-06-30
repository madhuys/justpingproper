'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { X, RotateCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatio?: number;
  title?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  title = "Crop Image"
}: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [rotate, setRotate] = useState(0);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  }

  async function getCroppedImg(): Promise<string> {
    const image = imgRef.current;
    if (!image || !crop) return '';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Convert percentage crop to pixel crop
    const pixelCrop = {
      x: (crop.x / 100) * image.width,
      y: (crop.y / 100) * image.height,
      width: (crop.width / 100) * image.width,
      height: (crop.height / 100) * image.height,
    };
    
    // Set canvas size to match crop dimensions
    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    ctx.save();
    
    // Handle rotation
    if (rotate !== 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve('');
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/jpeg');
    });
  }

  const handleComplete = async () => {
    const croppedImageUrl = await getCroppedImg();
    if (croppedImageUrl) {
      onCropComplete(croppedImageUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      <div 
        className="fixed z-50 flex items-center justify-center"
        style={{
          top: '4rem',
          left: '16rem',
          right: 0,
          bottom: '3rem',
        }}
      >
        <Card className="glassmorphic-modal w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Rotate Control */}
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((rotate + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
              </div>

              {/* Crop Area */}
              <div className="flex justify-center">
                <div style={{ transform: `rotate(${rotate}deg)` }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    aspect={aspectRatio}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop"
                      src={imageSrc}
                      onLoad={onImageLoad}
                      style={{ maxHeight: '60vh' }}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleComplete}>
                  Apply Crop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}