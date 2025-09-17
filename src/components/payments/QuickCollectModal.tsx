'use client';

import React, { useState } from 'react';
import { X, DollarSign, User, CheckCircle, Loader2, Zap, CreditCard } from 'lucide-react';
import { paymentService, PaymentType } from '@/src/lib/api/services/paymentService';
import { toast } from '@/src/lib/toast';
import { cn, typography, colors, components } from '@/src/lib/styles/globalStyleConstants';

interface QuickCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuickPaymentTemplate {
  id: string;
  label: string;
  amount: number;
  type: PaymentType;
  icon: string;
}

const QUICK_TEMPLATES: QuickPaymentTemplate[] = [
  { id: 'consultation', label: 'Consultation', amount: 35, type: PaymentType.CONSULTATION, icon: '💬' },
  { id: 'drawing', label: 'Drawing Session', amount: 50, type: PaymentType.DRAWING_CONSULTATION, icon: '✏️' },
  { id: 'deposit-small', label: 'Small Deposit', amount: 75, type: PaymentType.TATTOO_DEPOSIT, icon: '💰' },
  { id: 'deposit-medium', label: 'Medium Deposit', amount: 150, type: PaymentType.TATTOO_DEPOSIT, icon: '💰' },
  { id: 'deposit-large', label: 'Large Deposit', amount: 300, type: PaymentType.TATTOO_DEPOSIT, icon: '💰' },
  { id: 'final-small', label: 'Small Final', amount: 100, type: PaymentType.TATTOO_FINAL, icon: '✅' },
  { id: 'final-medium', label: 'Medium Final', amount: 300, type: PaymentType.TATTOO_FINAL, icon: '✅' },
  { id: 'final-large', label: 'Large Final', amount: 500, type: PaymentType.TATTOO_FINAL, icon: '✅' },
];

export default function QuickCollectModal({
  isOpen,
  onClose,
  onSuccess
}: QuickCollectModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickPaymentTemplate | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.TATTOO_DEPOSIT);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);

  const handleQuickPayment = async () => {
    setLoading(true);
    try {
      const amount = selectedTemplate ? selectedTemplate.amount : parseFloat(customAmount);

      if (!amount || amount <= 0) {
        throw new Error('Please select a template or enter an amount');
      }

      const type = selectedTemplate ? selectedTemplate.type : paymentType;
      const title = selectedTemplate
        ? `${selectedTemplate.label} - Walk-in Payment`
        : `Walk-in Payment - $${amount}`;

      // Create payment link for walk-in
      const response = await paymentService.createPaymentLink({
        amount,
        title,
        description: `Quick payment collected at shop${customerName ? ` for ${customerName}` : ''}`,
        paymentType: type,
        customerId: 'walk-in', // Special ID for walk-in customers
        allowTipping: true,
        sendEmail: !!customerEmail
      });

      if (response.success) {
        setSuccess(true);
        setPaymentLinkUrl(response.data.url);
        toast.success('Payment link created!');

        // If email provided, note that it will be sent
        if (customerEmail) {
          toast.success(`Payment link sent to ${customerEmail}`);
        }

        onSuccess?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentLinkUrl) {
      navigator.clipboard.writeText(paymentLinkUrl);
      toast.success('Payment link copied!');
    }
  };

  const resetModal = () => {
    setSelectedTemplate(null);
    setCustomAmount('');
    setCustomerName('');
    setCustomerEmail('');
    setPaymentType(PaymentType.TATTOO_DEPOSIT);
    setSuccess(false);
    setPaymentLinkUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={cn(
        "bg-[#111111] border border-[#1a1a1a] max-w-2xl w-full mx-4",
        components.radius.large,
        "shadow-2xl"
      )}>
        <div className="flex justify-between items-center p-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C9A449]/10 rounded-lg">
              <Zap className="w-5 h-5 text-[#C9A449]" />
            </div>
            <h2 className={cn(typography.text2xl, typography.fontSemibold, colors.textPrimary)}>
              Quick Collect
            </h2>
          </div>
          <button onClick={resetModal} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {!success ? (
          <div className="p-6">
            {/* Quick Templates */}
            <div className="mb-6">
              <label className={cn(
                "block mb-3",
                typography.textSm,
                typography.fontMedium,
                colors.textAccent,
                "uppercase tracking-wider"
              )}>
                Quick Templates
              </label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setCustomAmount('');
                    }}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      selectedTemplate?.id === template.id
                        ? "bg-[#C9A449]/20 border-[#C9A449] text-[#C9A449]"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    )}
                  >
                    <div className="text-xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium">{template.label}</div>
                    <div className="text-sm font-bold">${template.amount}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className={cn(
                "block mb-3",
                typography.textSm,
                typography.fontMedium,
                colors.textAccent,
                "uppercase tracking-wider"
              )}>
                Or Enter Custom Amount
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTemplate(null);
                    }}
                    className={cn(components.input, "pl-10")}
                  />
                </div>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className={cn(components.select, "w-48")}
                  disabled={!!selectedTemplate}
                >
                  <option value={PaymentType.CONSULTATION}>Consultation</option>
                  <option value={PaymentType.DRAWING_CONSULTATION}>Drawing</option>
                  <option value={PaymentType.TATTOO_DEPOSIT}>Deposit</option>
                  <option value={PaymentType.TATTOO_FINAL}>Final Payment</option>
                </select>
              </div>
            </div>

            {/* Optional Customer Info */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <label className={cn(
                "block mb-3",
                typography.textSm,
                typography.fontMedium,
                colors.textSecondary
              )}>
                Customer Info (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={cn(components.input, "text-sm")}
                />
                <input
                  type="email"
                  placeholder="Email (to send link)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={cn(components.input, "text-sm")}
                />
              </div>
              <p className={cn(typography.textXs, colors.textMuted, "mt-2")}>
                Add email to automatically send payment link to customer
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.secondary
                )}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickPayment}
                disabled={loading || (!selectedTemplate && !customAmount)}
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.primary,
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Create Payment Link
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Success State
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className={cn(typography.textXl, typography.fontSemibold, colors.textPrimary, "mb-2")}>
                Payment Link Ready!
              </h3>
              <p className={cn(typography.textSm, colors.textSecondary)}>
                Share this link with the customer to collect payment
              </p>
            </div>

            <div className="bg-white/5 border border-gold-500/30 p-4 rounded-lg mb-4">
              <p className={cn(typography.textXs, colors.textMuted, "mb-2 uppercase tracking-wider")}>
                Payment Link:
              </p>
              <p className={cn(typography.textSm, colors.textAccent, "break-all font-mono")}>
                {paymentLinkUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.secondary
                )}
              >
                Copy Link
              </button>
              <button
                onClick={resetModal}
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.primary
                )}
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}