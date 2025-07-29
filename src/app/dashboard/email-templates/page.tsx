'use client';

import { useState } from 'react';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import { EmailTemplateManager } from '@/src/components/dashboard/email-templates/EmailTemplateManager';
import { EmailTemplateEditor } from '@/src/components/dashboard/email-templates/EmailTemplateEditor';
import { Mail } from 'lucide-react';

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

export default function EmailTemplatesPage() {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
  };

  const handleSave = () => {
    setEditingTemplate(null);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
  };

  return (
    <DashboardPageLayout
      title="Email Templates"
      description="Manage and customize email templates for customer communications"
    >
      {editingTemplate ? (
        <EmailTemplateEditor
          template={editingTemplate.id ? editingTemplate : undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <EmailTemplateManager onEdit={handleEdit} />
      )}
    </DashboardPageLayout>
  );
}