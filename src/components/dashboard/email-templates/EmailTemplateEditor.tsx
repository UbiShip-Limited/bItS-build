'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Info, Eye, EyeOff, Palette } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from '@/src/lib/toast';
import { colors, typography, components, effects, cn } from '@/src/lib/styles/globalStyleConstants';
import { EmailTemplatePreview } from './EmailTemplatePreview';

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
  const [showPreview, setShowPreview] = useState(false);
  const [useEnhancedStyling, setUseEnhancedStyling] = useState(true);
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
    <div className="space-y-6">
      <form id="email-template-form" onSubmit={handleSubmit} className="space-y-6">
        <div className={cn(components.card, 'p-6')}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className={cn(typography.h3, colors.textPrimary)}>
                {formData.id ? 'Edit Email Template' : 'Create Email Template'}
              </h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                    showPreview 
                      ? 'bg-gold-500/20 text-gold-500' 
                      : 'bg-white/10 text-white/70 hover:text-white'
                  )}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <div className={cn(typography.textSm, colors.textMuted, 'flex items-center gap-2')}>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">Ctrl+S</kbd> to save • 
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">Esc</kbd> to cancel
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                  Internal Name
                </label>
                <span className={cn(typography.textXs, colors.textAccentMuted)}>Used in code</span>
              </div>
              <input
                type="text"
                className={cn(
                  components.input,
                  errors.name && 'border-red-500/50 focus:border-red-500',
                  !!formData.id && 'opacity-50 cursor-not-allowed'
                )}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., appointment_reminder"
                disabled={!!formData.id}
              />
              {errors.name && (
                <p className={cn(typography.textXs, 'text-red-400 mt-1')}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'block mb-2')}>
                Display Name
              </label>
              <input
                type="text"
                className={cn(
                  components.input,
                  errors.displayName && 'border-red-500/50 focus:border-red-500'
                )}
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="e.g., Appointment Reminder"
              />
              {errors.displayName && (
                <p className={cn(typography.textXs, 'text-red-400 mt-1')}>
                  {errors.displayName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'block mb-2')}>
              Subject Line
            </label>
            <input
              id="subject"
              type="text"
              className={cn(
                components.input,
                errors.subject && 'border-red-500/50 focus:border-red-500'
              )}
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Your appointment is {{timeUntil}}"
            />
            {errors.subject && (
              <p className={cn(typography.textXs, 'text-red-400 mt-1')}>
                {errors.subject}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className={components.ornament.lineLong} />
            <span className={cn(typography.textSm, typography.fontMedium, colors.textAccent)}>Variables</span>
            <div className={components.ornament.lineLong} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className={cn(typography.textSm, colors.textSecondary)}>
                Define variables that can be used in the template
              </p>
              <button
                type="button"
                className={cn(
                  components.button.base,
                  components.button.sizes.small,
                  components.button.variants.secondary
                )}
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
                  className={cn(components.input, 'flex-1 py-2')}
                  placeholder="Variable name (e.g., customerName)"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className={cn(components.input, 'flex-[2] py-2')}
                  placeholder="Description"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                />
                <button
                  type="button"
                  className={cn(
                    'p-2 rounded-lg text-red-400',
                    components.button.variants.ghost,
                    'hover:bg-red-500/10'
                  )}
                  onClick={() => removeVariable(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {variables.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="w-4 h-4 text-blue-400" />
                <span className={cn(typography.textSm, 'text-blue-300')}>
                  Click on variable names below to insert them into the template
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {variables.filter(v => v.key).map((variable) => (
                <div key={variable.key} className="relative group">
                  <button
                    type="button"
                    className="px-3 py-1 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-full text-sm hover:bg-gold-500/30 transition-colors cursor-pointer"
                  >
                    {`{{${variable.key}}}`}
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-52 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors rounded-t-lg"
                      onClick={() => insertVariable(variable.key, 'subject')}
                    >
                      Insert in Subject
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                      onClick={() => insertVariable(variable.key, 'body')}
                    >
                      Insert in Body
                    </button>
                    {formData.htmlBody !== undefined && (
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors rounded-b-lg"
                        onClick={() => insertVariable(variable.key, 'htmlBody')}
                      >
                        Insert in HTML
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className={components.ornament.lineLong} />
            <span className={cn(typography.textSm, typography.fontMedium, colors.textAccent)}>Email Content</span>
            <div className={components.ornament.lineLong} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                Plain Text Body
              </label>
              <span className={cn(typography.textXs, colors.textAccentMuted)}>Required</span>
            </div>
            <textarea
              id="body"
              className={cn(
                'w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/50 focus:outline-none h-48',
                effects.transitionNormal,
                errors.body ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-gold-500/30'
              )}
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Email content in plain text..."
            />
            {errors.body && (
              <p className={cn(typography.textXs, 'text-red-400 mt-1')}>
                {errors.body}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                HTML Body
              </label>
              <span className={cn(typography.textXs, colors.textMuted)}>Optional</span>
            </div>
            <textarea
              id="htmlBody"
              className={cn(
                'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-gold-500/30 h-48',
                effects.transitionNormal
              )}
              value={formData.htmlBody || ''}
              onChange={(e) => handleInputChange('htmlBody', e.target.value)}
              placeholder="Email content in HTML (optional)..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'cursor-pointer')}>
                Template is active
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
                <div className={cn(
                  'w-11 h-6 rounded-full transition-colors',
                  formData.isActive ? 'bg-green-500/30' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gold-500" />
                <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'cursor-pointer')}>
                  Use enhanced Bowen Island styling
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={useEnhancedStyling}
                  onChange={(e) => setUseEnhancedStyling(e.target.checked)}
                />
                <div className={cn(
                  'w-11 h-6 rounded-full transition-colors',
                  useEnhancedStyling ? 'bg-gold-500/30' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    useEnhancedStyling ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className={cn(
            components.button.base,
            components.button.sizes.medium,
            components.button.variants.secondary,
            saving && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className={cn(
            components.button.base,
            components.button.sizes.medium,
            components.button.variants.primary,
            saving && 'opacity-50 cursor-not-allowed'
          )}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-obsidian/50 border-t-obsidian rounded-full animate-spin mr-2" />
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

    {/* Live Preview Section */}
    {showPreview && (
      <div className="mt-8">
        <EmailTemplatePreview
          subject={formData.subject}
          body={formData.body}
          htmlBody={useEnhancedStyling ? undefined : formData.htmlBody}
          variables={variables.reduce((acc, { key, description }) => {
            if (key) acc[key] = description;
            return acc;
          }, {} as Record<string, string>)}
        />
      </div>
    )}
  </div>
  );
}