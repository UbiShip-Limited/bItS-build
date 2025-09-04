import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImagesSelected: (images: Array<{ url: string; file: File; publicId?: string }>) => void;
  maxImages?: number;
  existingImages?: Array<{ url: string; file?: File; publicId?: string }>;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  maxImages = 5,
  existingImages = [],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
}) => {
  const [images, setImages] = useState<Array<{ url: string; file?: File; publicId?: string }>>(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent default drag behaviors on the page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(eventName => {
      document.addEventListener(eventName, preventDefaults, false);
    });

    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / 1024 / 1024).toFixed(0);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      return `${file.name} (${fileSizeMB}MB) exceeds the ${sizeMB}MB limit. Please compress or choose a smaller file.`;
    }
    
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      const supportedFormats = acceptedFormats.map(format => 
        format.split('/')[1].toUpperCase()).join(', ');
      return `${file.name} format is not supported. Please use ${supportedFormats} files only.`;
    }
    
    return null;
  };

  const processFiles = (files: File[]) => {
    console.log('📁 [ImageUpload] Processing files:', {
      fileCount: files.length,
      files: Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    
    // Check if adding these files would exceed max limit
    const totalFiles = images.length + files.length;
    if (totalFiles > maxImages) {
      const excess = totalFiles - maxImages;
      validationErrors.push(`Cannot add ${files.length} files. You can only have ${maxImages} images total (currently have ${images.length}). Please remove ${excess} file${excess > 1 ? 's' : ''} from your selection.`);
    } else {
      files.forEach(file => {
        const error = validateFile(file);
        if (error) {
          validationErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });
    }
    
    setErrors(validationErrors);
    
    if (validFiles.length > 0) {
      console.log('✅ [ImageUpload] Valid files found:', validFiles.length);
      
      const newImages = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));

      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      setImages(updatedImages);
      
      const imagesWithFiles = updatedImages.filter(img => img.file) as Array<{ url: string; file: File; publicId?: string }>;
      onImagesSelected(imagesWithFiles);
      
      console.log('📊 [ImageUpload] Images updated:', {
        newImagesCount: newImages.length,
        totalImagesCount: updatedImages.length
      });
    }
    
    // Clear errors after 8 seconds (longer for users to read)
    if (validationErrors.length > 0) {
      setTimeout(() => setErrors([]), 8000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setIsProcessing(true);
      
      // Convert FileList to Array immediately
      const filesArray = Array.from(event.target.files);
      
      console.log('📁 [ImageUpload] Files selected:', {
        originalLength: event.target.files.length,
        arrayLength: filesArray.length,
        files: filesArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      
      // Process files immediately
      processFiles(filesArray);
      setIsProcessing(false);
      
      // Clear the input to allow selecting the same files again
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    console.log('🎯 [ImageUpload] Drag over:', {
      dataTransferTypes: Array.from(e.dataTransfer.types),
      effectAllowed: e.dataTransfer.effectAllowed,
      filesLength: e.dataTransfer.files.length
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the drop zone entirely
    // Check if the related target is outside the drop zone
    const dropZone = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (!relatedTarget || !dropZone.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsProcessing(true);

    console.log('📦 [ImageUpload] Drop event received:', {
      filesLength: e.dataTransfer.files.length,
      hasFiles: !!e.dataTransfer.files,
      dataTransferTypes: Array.from(e.dataTransfer.types)
    });

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to Array immediately to prevent it from being cleared
      const filesArray = Array.from(e.dataTransfer.files);
      
      console.log('📦 [ImageUpload] Files extracted:', {
        originalLength: e.dataTransfer.files.length,
        arrayLength: filesArray.length,
        files: filesArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      
      // Process files immediately without setTimeout to prevent file reference loss
      processFiles(filesArray);
      setIsProcessing(false);
    } else {
      console.warn('⚠️ [ImageUpload] No files in drop event');
      setIsProcessing(false);
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
        className={`border-2 border-dashed p-4 rounded-md cursor-pointer text-center transition-all duration-200 ${
          isProcessing ? 'border-blue-400 bg-blue-400/5 cursor-wait' :
          isDragging ? 'border-gold bg-gold/5 scale-[1.02]' : 
          'border-slate hover:border-gold/60 hover:bg-gold/5'
        } ${isProcessing ? 'pointer-events-none' : ''}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragEnter={!isProcessing ? handleDragEnter : undefined}
        onDragOver={!isProcessing ? handleDragOver : undefined}
        onDragLeave={!isProcessing ? handleDragLeave : undefined}
        onDrop={!isProcessing ? handleDrop : undefined}
      >
        <div className={`flex flex-col items-center justify-center gap-2 ${isProcessing ? 'opacity-50' : ''}`}>
          {isProcessing && (
            <div className="mb-2">
              <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <div className="text-gold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-obsidian font-body font-medium">
            {isProcessing ? 'Processing files...' : (
              <>Drag & drop images or <span className="text-gold cursor-pointer">browse</span></>
            )}
          </p>
          <p className="text-slate text-sm">
            Supported: JPG, PNG, GIF • Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file • Up to {maxImages} images
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

      {errors.length > 0 && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
          <div className="flex items-start gap-2 mb-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-400 text-sm font-body font-medium mb-1">Upload Error{errors.length > 1 ? 's' : ''}</p>
              {errors.map((error, index) => (
                <p key={index} className="text-red-300 text-sm font-body mb-1 last:mb-0">{error}</p>
              ))}
            </div>
          </div>
          <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
            <p className="text-red-300/80 text-xs font-body">
              💡 <strong>Tip:</strong> For best results, use JPG or PNG images under 5MB. You can compress images using online tools if needed.
            </p>
          </div>
        </div>
      )}

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