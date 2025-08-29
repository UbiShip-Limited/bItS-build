'use client';

import { useState, useEffect } from 'react';
import { Eye, Smartphone, Monitor, Code, Mail } from 'lucide-react';
import { colors, typography, components, effects, cn } from '@/src/lib/styles/globalStyleConstants';
import EmailStyleService from '../../../../lib/services/emailStyleService';

interface EmailTemplatePreviewProps {
  subject: string;
  body: string;
  htmlBody?: string;
  variables: Record<string, string>;
  sampleData?: Record<string, any>;
}

export function EmailTemplatePreview({
  subject,
  body,
  htmlBody,
  variables,
  sampleData = {}
}: EmailTemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'text' | 'raw'>('desktop');
  const [processedContent, setProcessedContent] = useState({ subject: '', text: '', html: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Default sample data for common variables
  const defaultSampleData = {
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    customerPhone: '(604) 555-1234',
    description: 'A beautiful Japanese-inspired sleeve with cherry blossoms and koi fish',
    placement: 'Full sleeve - right arm',
    size: 'Large (full sleeve)',
    style: 'Japanese Traditional',
    preferredArtist: 'Any available artist',
    appointmentDate: 'December 15, 2024',
    appointmentTime: '2:00 PM',
    duration: '4 hours',
    artistName: 'Alex Chen',
    appointmentType: 'Tattoo Session',
    timeframe: 'Within 2-3 months',
    additionalNotes: 'I\'m looking for vibrant colors and would like to incorporate water elements',
    trackingToken: 'tk_abc123',
    trackingUrl: 'https://bowenislandtattoo.com/track/tk_abc123',
    dashboardUrl: 'https://bowenislandtattoo.com/dashboard/requests/123',
    referenceImages: 3,
    timestamp: new Date().toLocaleString(),
    ...sampleData
  };

  useEffect(() => {
    processTemplate();
  }, [subject, body, htmlBody, sampleData]);

  const processTemplate = () => {
    setIsLoading(true);
    
    // Process variables in content
    let processedSubject = subject;
    let processedText = body;
    let processedHtml = htmlBody || '';

    // Replace variables with sample data
    Object.entries(defaultSampleData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(placeholder, String(value));
      processedText = processedText.replace(placeholder, String(value));
      processedHtml = processedHtml.replace(placeholder, String(value));
    });

    // Handle conditional blocks (simplified)
    processedText = processedText.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return defaultSampleData[varName] ? content : '';
    });
    processedHtml = processedHtml.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return defaultSampleData[varName] ? content : '';
    });

    // If no HTML provided, generate enhanced HTML from plain text
    if (!htmlBody) {
      const enhancedContent = EmailStyleService.enhanceTemplate(processedText, defaultSampleData);
      const { html } = EmailStyleService.createEmailTemplate(processedSubject, enhancedContent, {
        showHeader: true,
        showFooter: true
      });
      processedHtml = html;
    }

    setProcessedContent({
      subject: processedSubject,
      text: processedText,
      html: processedHtml
    });
    
    setIsLoading(false);
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
        </div>
      );
    }

    switch (viewMode) {
      case 'text':
        return (
          <div className="p-6 bg-white/5 rounded-lg">
            <div className="mb-4 pb-4 border-b border-white/10">
              <p className={cn(typography.textSm, colors.textMuted)}>Subject:</p>
              <p className={cn(typography.textBase, colors.textPrimary, typography.fontMedium)}>
                {processedContent.subject}
              </p>
            </div>
            <pre className={cn(
              'whitespace-pre-wrap font-mono text-sm',
              colors.textSecondary
            )}>
              {processedContent.text}
            </pre>
          </div>
        );

      case 'raw':
        return (
          <div className="p-6 bg-black/50 rounded-lg overflow-auto max-h-[600px]">
            <pre className="text-xs text-green-400 font-mono">
              <code>{processedContent.html}</code>
            </pre>
          </div>
        );

      case 'mobile':
      case 'desktop':
        return (
          <div className={cn(
            'mx-auto bg-white rounded-lg shadow-2xl overflow-hidden',
            viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          )}>
            <div className="bg-gray-100 p-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-600">
                    {processedContent.subject}
                  </p>
                </div>
              </div>
            </div>
            <iframe
              srcDoc={processedContent.html}
              className="w-full"
              style={{ 
                height: '600px',
                border: 'none',
                backgroundColor: '#0A0A0A'
              }}
              title="Email Preview"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className={cn(components.card, 'p-4')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gold-500" />
            <span className={cn(typography.textBase, typography.fontMedium, colors.textPrimary)}>
              Email Preview
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('desktop')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'desktop' 
                  ? 'bg-gold-500/20 text-gold-500' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
              title="Desktop View"
            >
              <Monitor className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('mobile')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'mobile' 
                  ? 'bg-gold-500/20 text-gold-500' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
              title="Mobile View"
            >
              <Smartphone className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('text')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'text' 
                  ? 'bg-gold-500/20 text-gold-500' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
              title="Plain Text View"
            >
              <Mail className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('raw')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'raw' 
                  ? 'bg-gold-500/20 text-gold-500' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
              title="HTML Source"
            >
              <Code className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sample Data Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className={cn(typography.textSm, 'text-blue-300')}>
          <strong>Preview Mode:</strong> This preview uses sample data to show how your email will look. 
          Variable placeholders are automatically replaced with realistic examples.
        </p>
      </div>

      {/* Preview Content */}
      <div className={cn(
        'rounded-lg overflow-hidden',
        viewMode === 'desktop' || viewMode === 'mobile' ? 'bg-gray-900 p-8' : ''
      )}>
        {renderPreview()}
      </div>

      {/* Variable Reference */}
      {Object.keys(variables).length > 0 && (
        <div className={cn(components.card, 'p-6')}>
          <h3 className={cn(typography.textBase, typography.fontMedium, colors.textPrimary, 'mb-4')}>
            Template Variables & Sample Values
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(variables).map(([key, description]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <code className="text-gold-500 text-sm font-mono">
                  {`{{${key}}}`}
                </code>
                <div className="flex-1">
                  <p className={cn(typography.textXs, colors.textSecondary)}>
                    {description}
                  </p>
                  {defaultSampleData[key] && (
                    <p className={cn(typography.textXs, colors.textMuted, 'mt-1')}>
                      Sample: <span className="text-white/70">{String(defaultSampleData[key])}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}