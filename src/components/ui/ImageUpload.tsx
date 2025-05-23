import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImagesSelected: (images: Array<{ url: string; file: File; publicId?: string }>) => void;
  maxImages?: number;
  existingImages?: Array<{ url: string; file?: File; publicId?: string }>;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  maxImages = 5,
  existingImages = [],
}) => {
  const [images, setImages] = useState<Array<{ url: string; file?: File; publicId?: string }>>(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newImages = Array.from(event.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));

      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      setImages(updatedImages);
      
      const imagesWithFiles = updatedImages.filter(img => img.file) as Array<{ url: string; file: File; publicId?: string }>;
      onImagesSelected(imagesWithFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newImages = Array.from(e.dataTransfer.files).map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));

      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      setImages(updatedImages);
      
      const imagesWithFiles = updatedImages.filter(img => img.file) as Array<{ url: string; file: File; publicId?: string }>;
      onImagesSelected(imagesWithFiles);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
    
    const imagesWithFiles = updatedImages.filter(img => img.file) as Array<{ url: string; file: File; publicId?: string }>;
    onImagesSelected(imagesWithFiles);
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed p-4 rounded-md cursor-pointer text-center transition-colors ${
          isDragging ? 'border-gold bg-gold/5' : 'border-slate'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-gold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-obsidian font-body">
            Drag & drop images or <span className="text-gold">browse</span>
          </p>
          <p className="text-slate text-sm">
            Supported: JPG, PNG, GIF (max {maxImages} images)
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative rounded-md overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={`Uploaded image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                className="absolute top-2 right-2 bg-obsidian text-white rounded-full p-1"
                onClick={() => removeImage(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 