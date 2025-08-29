'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Edit, Trash2, Eye, Send, Plus } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from '@/src/lib/toast';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import Modal from '@/src/components/ui/Modal';
import { colors, typography, components, effects, cn } from '@/src/lib/styles/globalStyleConstants';
import { EmailTemplatePreview } from './EmailTemplatePreview';

interface EmailTemplate {
  id: string;
  name: string;
  displayName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplateManagerProps {
  onEdit?: (template: EmailTemplate) => void;
}

export function EmailTemplateManager({ onEdit }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.access_token) {
      fetchTemplates();
    }
  }, [session]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTestModal) {
          setShowTestModal(false);
          setTestEmail('');
        } else if (showPreview) {
          setShowPreview(false);
        } else if (confirmDelete) {
          setConfirmDelete(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTestModal, showPreview, confirmDelete]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You need admin access to view email templates');
        }
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load email templates';
      toast.error(message);
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplateStatus = async (template: EmailTemplate) => {
    setTogglingId(template.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates/${template.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: !template.isActive }),
        }
      );

      if (!response.ok) throw new Error('Failed to update template');
      
      toast.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template status');
      console.error('Error updating template:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates/${templateId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete template');
      
      toast.success('Template deleted successfully');
      setConfirmDelete(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return;
    
    setSendingTest(true);
    try {
      // Create sample data based on the template variables
      const sampleData: Record<string, any> = {};
      Object.keys(selectedTemplate.variables).forEach(key => {
        // Generate sample data based on variable name
        if (key.includes('Name')) sampleData[key] = 'John Doe';
        else if (key.includes('Date')) sampleData[key] = new Date().toLocaleDateString();
        else if (key.includes('Time')) sampleData[key] = '2:00 PM';
        else if (key.includes('Email')) sampleData[key] = 'customer@example.com';
        else if (key.includes('Phone')) sampleData[key] = '(604) 123-4567';
        else sampleData[key] = `Sample ${key}`;
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates/${selectedTemplate.id}/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: testEmail,
            sampleData,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to send test email');
      
      toast.success('Test email sent successfully!');
      setShowTestModal(false);
      setTestEmail('');
    } catch (error) {
      toast.error('Failed to send test email');
      console.error('Error sending test email:', error);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return <SkeletonLoader count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={cn(typography.h3, colors.textPrimary)}>Email Templates</h2>
        <button
          onClick={() => onEdit && onEdit({} as EmailTemplate)}
          className={cn(
            components.button.base,
            components.button.sizes.small,
            components.button.variants.primary
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              components.card,
              'p-6',
              effects.transitionNormal,
              'hover:border-gold-500/50'
            )}
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Mail className={cn('w-5 h-5', colors.textAccent)} />
                    <h3 className={cn(typography.textLg, typography.fontSemibold, colors.textPrimary)}>{template.displayName}</h3>
                    <div className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      template.isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-white/10 text-white/50 border border-white/20'
                    )}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <p className={cn(typography.textSm, colors.textSecondary, 'mt-1')}>
                    Internal name: <code className="bg-white/5 px-2 py-0.5 rounded text-gold-500/70">{template.name}</code>
                  </p>
                  <p className={cn(typography.textSm, colors.textProminent, 'mt-2')}>
                    <span className={typography.fontMedium}>Subject:</span> {template.subject}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={cn(typography.textXs, colors.textMuted)}>Variables:</span>
                    {Object.keys(template.variables).map((variable) => (
                      <code key={variable} className="px-2 py-0.5 text-xs bg-gold-500/10 text-gold-500/70 rounded border border-gold-500/20">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                  <p className={cn(typography.textXs, colors.textSubtle, 'mt-3')}>
                    Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                    className={cn(
                      'p-2 rounded-lg',
                      components.button.variants.ghost,
                      'hover:bg-white/10'
                    )}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowTestModal(true);
                    }}
                    className={cn(
                      'p-2 rounded-lg',
                      components.button.variants.ghost,
                      'hover:bg-white/10',
                      !template.isActive && 'opacity-50 cursor-not-allowed'
                    )}
                    title="Send Test"
                    disabled={!template.isActive}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(template)}
                    className={cn(
                      'p-2 rounded-lg',
                      components.button.variants.ghost,
                      'hover:bg-white/10'
                    )}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleTemplateStatus(template)}
                    className={cn(
                      'p-2 rounded-lg',
                      components.button.variants.ghost,
                      'hover:bg-white/10'
                    )}
                    title={template.isActive ? 'Deactivate' : 'Activate'}
                    disabled={togglingId === template.id}
                  >
                    {togglingId === template.id ? (
                      <div className="w-4 h-4 border-2 border-gold-500/50 border-t-gold-500 rounded-full animate-spin" />
                    ) : (
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={template.isActive}
                          onChange={() => {}}
                        />
                        <div className={cn(
                          'w-8 h-4 rounded-full transition-colors',
                          template.isActive ? 'bg-green-500/30' : 'bg-white/10'
                        )}>
                          <div className={cn(
                            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                            template.isActive ? 'translate-x-4' : 'translate-x-0.5'
                          )} />
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(template.id)}
                    className={cn(
                      'p-2 rounded-lg text-red-400',
                      components.button.variants.ghost,
                      'hover:bg-red-500/10 hover:text-red-300'
                    )}
                    title="Delete"
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? (
                      <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview && !!selectedTemplate}
        onClose={() => setShowPreview(false)}
        title={selectedTemplate ? `Template Preview: ${selectedTemplate.displayName}` : ''}
        size="xl"
      >
        {selectedTemplate && (
          <EmailTemplatePreview
            subject={selectedTemplate.subject}
            body={selectedTemplate.body}
            htmlBody={selectedTemplate.htmlBody}
            variables={selectedTemplate.variables}
          />
        )}
      </Modal>

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal && !!selectedTemplate}
        onClose={() => {
          setShowTestModal(false);
          setTestEmail('');
        }}
        title={selectedTemplate ? `Send Test Email: ${selectedTemplate.displayName}` : ''}
        size="md"
      >
        {selectedTemplate && (
            
          <div className="space-y-4">
            <div>
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'block mb-2')}>
                Send test email to:
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className={components.input}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className={cn(typography.textXs, colors.textSecondary, 'mt-2')}>
                A test email with sample data will be sent to this address
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className={cn(
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.secondary
                )}
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
                disabled={sendingTest}
              >
                Cancel
              </button>
              <button
                className={cn(
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.primary,
                  (!testEmail || sendingTest) && 'opacity-50 cursor-not-allowed'
                )}
                onClick={sendTestEmail}
                disabled={!testEmail || sendingTest}
              >
                {sendingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-obsidian/50 border-t-obsidian rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className={cn(typography.textBase, colors.textSecondary)}>
            Are you sure you want to delete this email template? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              className={cn(
                components.button.base,
                components.button.sizes.medium,
                components.button.variants.secondary
              )}
              onClick={() => setConfirmDelete(null)}
              disabled={deletingId === confirmDelete}
            >
              Cancel
            </button>
            <button
              className={cn(
                components.button.base,
                components.button.sizes.medium,
                'bg-red-500 text-white hover:bg-red-400',
                effects.transitionNormal,
                (deletingId === confirmDelete) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => confirmDelete && deleteTemplate(confirmDelete)}
              disabled={deletingId === confirmDelete}
            >
              {deletingId === confirmDelete ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}