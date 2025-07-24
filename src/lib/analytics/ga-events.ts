import { event } from '@/src/components/analytics/GoogleAnalytics';

// Custom event types for Bowen Island Tattoo Shop
export const GAEvents = {
  // Form interactions
  tattooRequestStarted: () => {
    event({
      action: 'form_start',
      category: 'engagement',
      label: 'tattoo_request_form',
    });
  },
  
  tattooRequestSubmitted: () => {
    event({
      action: 'form_submit',
      category: 'conversion',
      label: 'tattoo_request_form',
    });
  },
  
  appointmentFormStarted: () => {
    event({
      action: 'form_start',
      category: 'engagement',
      label: 'appointment_form',
    });
  },
  
  appointmentFormSubmitted: () => {
    event({
      action: 'form_submit',
      category: 'conversion',
      label: 'appointment_form',
    });
  },
  
  // Gallery interactions
  galleryImageViewed: (imageId: string) => {
    event({
      action: 'view_item',
      category: 'engagement',
      label: `gallery_image_${imageId}`,
    });
  },
  
  galleryLightboxOpened: () => {
    event({
      action: 'lightbox_open',
      category: 'engagement',
      label: 'gallery',
    });
  },
  
  // Navigation interactions
  navigationItemClicked: (item: string) => {
    event({
      action: 'navigation_click',
      category: 'engagement',
      label: item,
    });
  },
  
  // Contact interactions
  phoneNumberClicked: () => {
    event({
      action: 'contact_method',
      category: 'engagement',
      label: 'phone',
    });
  },
  
  emailClicked: () => {
    event({
      action: 'contact_method',
      category: 'engagement',
      label: 'email',
    });
  },
  
  socialMediaClicked: (platform: string) => {
    event({
      action: 'social_click',
      category: 'engagement',
      label: platform,
    });
  },
  
  // CTA interactions
  ctaButtonClicked: (buttonLabel: string) => {
    event({
      action: 'cta_click',
      category: 'engagement',
      label: buttonLabel,
    });
  },
  
  // Error tracking
  formError: (formName: string, errorType: string) => {
    event({
      action: 'form_error',
      category: 'error',
      label: `${formName}_${errorType}`,
    });
  },
  
  // File upload tracking
  fileUploaded: (fileType: string) => {
    event({
      action: 'file_upload',
      category: 'engagement',
      label: fileType,
    });
  },
  
  // Scroll depth tracking (for long pages)
  scrollDepthReached: (percentage: number) => {
    event({
      action: 'scroll_depth',
      category: 'engagement',
      label: `${percentage}%`,
      value: percentage,
    });
  },
};