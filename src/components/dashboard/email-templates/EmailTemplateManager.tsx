'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Edit, Trash2, Eye, Send, Plus } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from '@/src/lib/toast';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';

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
        <h2 className="text-2xl font-semibold">Email Templates</h2>
        <button
          onClick={() => onEdit && onEdit({} as EmailTemplate)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{template.displayName}</h3>
                    <div className={`badge ${template.isActive ? 'badge-success' : 'badge-ghost'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <p className="text-sm text-base-content/70 mt-1">
                    Internal name: <code className="bg-base-200 px-1 rounded">{template.name}</code>
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Subject:</span> {template.subject}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-base-content/60">Variables:</span>
                    {Object.keys(template.variables).map((variable) => (
                      <code key={variable} className="badge badge-sm badge-ghost">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-base-content/60 mt-3">
                    Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                    className="btn btn-ghost btn-sm"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowTestModal(true);
                    }}
                    className="btn btn-ghost btn-sm"
                    title="Send Test"
                    disabled={!template.isActive}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(template)}
                    className="btn btn-ghost btn-sm"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleTemplateStatus(template)}
                    className="btn btn-ghost btn-sm"
                    title={template.isActive ? 'Deactivate' : 'Activate'}
                    disabled={togglingId === template.id}
                  >
                    {togglingId === template.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={template.isActive}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(template.id)}
                    className="btn btn-ghost btn-sm text-error"
                    title="Delete"
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
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
      {showPreview && selectedTemplate && (
        <div className="modal modal-open" onClick={() => setShowPreview(false)}>
          <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowPreview(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">
              Template Preview: {selectedTemplate.displayName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Subject</span>
                </label>
                <div className="bg-base-200 p-3 rounded">
                  {selectedTemplate.subject}
                </div>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text font-medium">Plain Text</span>
                </label>
                <div className="bg-base-200 p-3 rounded whitespace-pre-wrap text-sm">
                  {selectedTemplate.body}
                </div>
              </div>
              
              {selectedTemplate.htmlBody && (
                <div>
                  <label className="label">
                    <span className="label-text font-medium">HTML Preview</span>
                  </label>
                  <div className="bg-white p-4 rounded border">
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlBody }}
                      className="prose max-w-none"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <div className="modal modal-open" onClick={() => {
          setShowTestModal(false);
          setTestEmail('');
        }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => {
                setShowTestModal(false);
                setTestEmail('');
              }}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">
              Send Test Email: {selectedTemplate.displayName}
            </h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Send test email to:</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  A test email with sample data will be sent to this address
                </span>
              </label>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
                disabled={sendingTest}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={sendTestEmail}
                disabled={!testEmail || sendingTest}
              >
                {sendingTest ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal modal-open" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete this email template? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => deleteTemplate(confirmDelete)}
                disabled={deletingId === confirmDelete}
              >
                {deletingId === confirmDelete ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}