'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Info } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from '@/src/lib/toast';

interface EmailTemplate {
  id?: string;
  name: string;
  displayName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  variables: Record<string, string>;
  isActive: boolean;
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: () => void;
  onCancel: () => void;
}

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    displayName: '',
    subject: '',
    body: '',
    htmlBody: '',
    variables: {},
    isActive: true,
    ...template,
  });
  const [variables, setVariables] = useState<Array<{ key: string; description: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    // Convert variables object to array for editing
    const varsArray = Object.entries(formData.variables).map(([key, description]) => ({
      key,
      description,
    }));
    setVariables(varsArray);
  }, [formData.variables]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        if (hasUnsavedChanges) {
          if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            onCancel();
          }
        } else {
          onCancel();
        }
      }
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('email-template-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, saving, onCancel]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Internal name is required';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Internal name must be lowercase letters and underscores only';
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.body) {
      newErrors.body = 'Email body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Convert variables array back to object
      const variablesObject = variables.reduce((acc, { key, description }) => {
        if (key) acc[key] = description;
        return acc;
      }, {} as Record<string, string>);

      const payload = {
        ...formData,
        variables: variablesObject,
      };

      const url = formData.id
        ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates/${formData.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-templates`;

      const response = await fetch(url, {
        method: formData.id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast.success(`Template ${formData.id ? 'updated' : 'created'} successfully`);
      onSave();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', description: '' }]);
    setHasUnsavedChanges(true);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateVariable = (index: number, field: 'key' | 'description', value: string) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);
    setHasUnsavedChanges(true);
  };

  const insertVariable = (varName: string, field: 'subject' | 'body' | 'htmlBody') => {
    const textarea = document.getElementById(field) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData[field] || '';
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = `${before}{{${varName}}}${after}`;
    handleInputChange(field, newText);
    
    // Restore cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varName.length + 4, start + varName.length + 4);
    }, 0);
    
    // Show visual feedback
    toast.success(`Variable {{${varName}}} inserted`);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setHasUnsavedChanges(true);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <form id="email-template-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title">
              {formData.id ? 'Edit Email Template' : 'Create Email Template'}
            </h2>
            <div className="text-sm text-base-content/60">
              <kbd className="kbd kbd-sm">Ctrl+S</kbd> to save • <kbd className="kbd kbd-sm">Esc</kbd> to cancel
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Internal Name</span>
                <span className="label-text-alt text-info">Used in code</span>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., appointment_reminder"
                disabled={!!formData.id}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.displayName ? 'input-error' : ''}`}
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="e.g., Appointment Reminder"
              />
              {errors.displayName && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.displayName}</span>
                </label>
              )}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Subject Line</span>
            </label>
            <input
              id="subject"
              type="text"
              className={`input input-bordered ${errors.subject ? 'input-error' : ''}`}
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Your appointment is {{timeUntil}}"
            />
            {errors.subject && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.subject}</span>
              </label>
            )}
          </div>

          <div className="divider">Variables</div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-base-content/70">
                Define variables that can be used in the template
              </p>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={addVariable}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variable
              </button>
            </div>

            {variables.map((variable, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="Variable name (e.g., customerName)"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm flex-2"
                  placeholder="Description"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeVariable(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {variables.length > 0 && (
              <div className="alert alert-info">
                <Info className="w-4 h-4" />
                <span className="text-sm">
                  Click on variable names below to insert them into the template
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {variables.filter(v => v.key).map((variable) => (
                <div key={variable.key} className="dropdown">
                  <label tabIndex={0} className="badge badge-primary cursor-pointer">
                    {`{{${variable.key}}}`}
                  </label>
                  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-50">
                    <li><a onClick={() => insertVariable(variable.key, 'subject')}>Insert in Subject</a></li>
                    <li><a onClick={() => insertVariable(variable.key, 'body')}>Insert in Body</a></li>
                    {formData.htmlBody !== undefined && (
                      <li><a onClick={() => insertVariable(variable.key, 'htmlBody')}>Insert in HTML</a></li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="divider">Email Content</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Plain Text Body</span>
              <span className="label-text-alt">Required</span>
            </label>
            <textarea
              id="body"
              className={`textarea textarea-bordered h-48 ${errors.body ? 'textarea-error' : ''}`}
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Email content in plain text..."
            />
            {errors.body && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.body}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">HTML Body</span>
              <span className="label-text-alt">Optional</span>
            </label>
            <textarea
              id="htmlBody"
              className="textarea textarea-bordered h-48"
              value={formData.htmlBody || ''}
              onChange={(e) => handleInputChange('htmlBody', e.target.value)}
              placeholder="Email content in HTML (optional)..."
            />
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Template is active</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </>
          )}
        </button>
      </div>
    </form>
  );
}