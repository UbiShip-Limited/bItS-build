import { useState } from 'react';

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Get the backend URL from environment variable or use default
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
      
      // First, get upload signature from backend
      const signatureResponse = await fetch(`${backendUrl}/api/v1/cloudinary/signature/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'tattoo-requests',
          tags: ['tattoo-request', 'reference-image']
        })
      });

      if (!signatureResponse.ok) {
        throw new Error('Failed to get upload signature');
      }

      const signatureData: CloudinarySignature = await signatureResponse.json();
      
      // Upload each file directly to Cloudinary
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signatureData.signature);
        formData.append('timestamp', signatureData.timestamp.toString());
        formData.append('api_key', signatureData.apiKey);
        formData.append('folder', 'tattoo-requests');
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        return {
          url: data.secure_url,
          publicId: data.public_id,
          originalName: file.name
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      return uploadedImages;
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToCloudinary,
    isUploading,
    error
  };
}; 