import { useEffect } from 'react';
import useTattooRequestForm from './useTattooRequestForm';
import { toast } from '@/src/lib/toast';

/**
 * Enhanced version of useTattooRequestForm that includes toast notifications
 */
export const useTattooRequestFormWithToast = () => {
  const formHook = useTattooRequestForm();
  const { error, success, response } = formHook;

  // Show toast notifications based on form state
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (success && response) {
      toast.success('Your tattoo request has been submitted successfully!');
    }
  }, [success, response]);

  // Enhanced submit function that shows loading toast
  const submitRequest = async () => {
    const loadingToastId = toast.info('Submitting your request...');
    
    try {
      await formHook.submitRequest();
    } catch (err) {
      // Error will be handled by the effect above
    }
  };

  // Enhanced upload function with toast feedback
  const uploadImages = async (files: File[]) => {
    if (files.length === 0) return;
    
    toast.info(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`);
    
    try {
      await formHook.uploadImages(files);
      toast.success('Images uploaded successfully!');
    } catch (err) {
      // Error will be handled by the effect above
    }
  };

  return {
    ...formHook,
    submitRequest,
    uploadImages
  };
};

export default useTattooRequestFormWithToast;