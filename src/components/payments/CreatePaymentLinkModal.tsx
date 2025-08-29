'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Send, DollarSign, CheckCircle, Loader2, Plus, Trash2, Calculator, UserPlus, Users, MessageCircle, QrCode, Smartphone } from 'lucide-react';
import { paymentService, PaymentType, CreatePaymentLinkParams, PaymentLink } from '@/src/lib/api/services/paymentService';
import { CustomerService, type Customer } from '@/src/lib/api/services/customerService';
import { apiClient } from '@/src/lib/api/apiClient';
import CustomerSelector from '@/src/components/dashboard/CustomerSelector';
import { toast } from '@/src/lib/toast';
import { typography, colors, effects, components, cn } from '@/src/lib/styles/globalStyleConstants';

interface CreatePaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerName?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  defaultAmount?: number;
  defaultType?: PaymentType;
  onSuccess?: (paymentLink: PaymentLink) => void;
}

export default function CreatePaymentLinkModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultAmount = 0,
  defaultType = PaymentType.CONSULTATION,
  onSuccess
}: CreatePaymentLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  
  // Line items for calculator
  const [lineItems, setLineItems] = useState<Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }>>([]);
  
  const [tipPercentage, setTipPercentage] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CreatePaymentLinkParams>>({
    amount: defaultAmount,
    title: '',
    description: '',
    paymentType: defaultType,
    allowTipping: true,
    customFields: [],
    sendEmail: true, // Default to sending email
    enableReminders: true, // Default to enabling reminders
    reminderSchedule: [2, 7, 14] // Default reminder schedule in days
  });
  
  // Customer selection state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const customerService = new CustomerService(apiClient);

  // Calculate totals
  const calculateSubtotal = useCallback(() => {
    if (lineItems.length > 0) {
      return lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    }
    return formData.amount || 0;
  }, [lineItems, formData.amount]);

  const calculateTip = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal * (tipPercentage / 100);
  }, [calculateSubtotal, tipPercentage]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTip();
  }, [calculateSubtotal, calculateTip]);

  // Update form amount when line items change
  useEffect(() => {
    if (lineItems.length > 0) {
      setFormData(prev => ({ ...prev, amount: calculateTotal() }));
    }
  }, [lineItems, tipPercentage, calculateTotal]);

  // Add a new line item
  const addLineItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      quantity: 1
    };
    setLineItems([...lineItems, newItem]);
    setShowCalculator(true);
  };

  // Update a line item
  const updateLineItem = (id: string, field: string, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Remove a line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    if (lineItems.length === 1) {
      setShowCalculator(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Calculate final amount
      const finalAmount = lineItems.length > 0 ? calculateTotal() : (formData.amount || 0);
      
      // Validate minimum amount of $1 (to prevent mistakes)
      if (finalAmount < 1) {
        throw new Error('Amount must be at least $1.00');
      }

      // Build description with line items if using calculator
      let enhancedDescription = formData.description || '';
      if (lineItems.length > 0) {
        const itemsDescription = lineItems
          .filter(item => item.description && item.amount > 0)
          .map(item => `${item.description} (${item.quantity}x $${item.amount.toFixed(2)})`)
          .join(', ');
        
        if (itemsDescription) {
          enhancedDescription = enhancedDescription 
            ? `${enhancedDescription}\n\nItems: ${itemsDescription}`
            : `Items: ${itemsDescription}`;
        }
        
        if (tipPercentage > 0) {
          enhancedDescription += `\n\nIncludes ${tipPercentage}% tip`;
        }
      }

      // Handle customer creation or selection
      let finalCustomerId = customerId;
      
      if (!finalCustomerId) {
        if (selectedCustomer) {
          // Use selected customer from search
          finalCustomerId = selectedCustomer.id;
        } else if (showQuickCreate && quickCreateData.name) {
          // Create quick customer
          try {
            const newCustomer = await customerService.createCustomer({
              name: quickCreateData.name,
              email: quickCreateData.email || undefined,
              phone: quickCreateData.phone || undefined,
              notes: 'Quick payment - walk-in customer'
            });
            finalCustomerId = newCustomer.id;
            toast.success(`Customer '${newCustomer.name}' created`);
          } catch (err) {
            throw new Error('Failed to create customer. Please try selecting an existing customer.');
          }
        } else {
          // Allow payment without customer (walk-in)
          // Backend should handle this case
          finalCustomerId = 'walk-in';
        }
      }

      const params: CreatePaymentLinkParams = {
        ...formData as CreatePaymentLinkParams,
        amount: finalAmount,
        description: enhancedDescription,
        customerId: finalCustomerId,
        appointmentId,
        tattooRequestId
      };

      const response = await paymentService.createPaymentLink(params);
      
      if (response.success) {
        setSuccess(true);
        setPaymentLinkUrl(response.data.url);
        toast.success('Payment link created successfully!');
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err) {
      const error = err as Error;
      const errorMessage = (error as any).response?.data?.message || error.message || 'Failed to create payment link';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentLinkUrl) {
      navigator.clipboard.writeText(paymentLinkUrl);
      toast.success('Payment link copied to clipboard!');
    }
  };

  const sendViaEmail = () => {
    if (paymentLinkUrl) {
      window.location.href = `mailto:?subject=Payment Request - Bowen Island Tattoo Shop&body=Hello,%0A%0APlease complete your payment using this secure link:%0A${paymentLinkUrl}%0A%0AThank you,%0ABowen Island Tattoo Shop`;
    }
  };
  
  const sendViaWhatsApp = () => {
    if (paymentLinkUrl) {
      const message = encodeURIComponent(`Hi! Here's your payment link from Bowen Island Tattoo Shop:\n\n${paymentLinkUrl}\n\nPlease click the link to complete your payment. Thank you!`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };
  
  const sendViaSMS = () => {
    if (paymentLinkUrl) {
      // Note: SMS URL scheme has limited support, mainly on mobile devices
      const message = encodeURIComponent(`Your payment link from Bowen Island Tattoo Shop: ${paymentLinkUrl}`);
      window.location.href = `sms:?body=${message}`;
    }
  };
  
  const [showQRCode, setShowQRCode] = useState(false);
  
  const generateQRCode = () => {
    if (paymentLinkUrl) {
      // Using a QR code service API (you could also use a library like qrcode.js)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLinkUrl)}`;
      setShowQRCode(true);
      return qrApiUrl;
    }
    return '';
  };

  const handleClose = () => {
    setFormData({
      amount: defaultAmount,
      title: '',
      description: '',
      paymentType: defaultType,
      allowTipping: true,
      customFields: [],
      sendEmail: true
    });
    setLineItems([]);
    setTipPercentage(0);
    setShowCalculator(false);
    setSelectedCustomer(null);
    setShowQuickCreate(false);
    setQuickCreateData({ name: '', email: '', phone: '' });
    setError(null);
    setSuccess(false);
    setPaymentLinkUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={cn(
        "bg-[#111111] border border-[#1a1a1a] max-w-md w-full mx-4",
        components.radius.large,
        effects.shadowHeavy,
        "hover:border-[#C9A449]/20",
        effects.transitionNormal
      )}>
        <div className="flex justify-between items-center p-6 border-b border-[#1a1a1a]">
          <h2 className={cn(typography.text2xl, typography.fontSemibold, colors.textPrimary)}>Create Payment Link</h2>
          <button
            onClick={handleClose}
            className={cn(
              "p-2 rounded-lg",
              colors.textMuted,
              "hover:bg-white/5",
              "hover:" + colors.textPrimary,
              effects.transitionNormal
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Enhanced Customer Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className={cn(
                  typography.textSm,
                  typography.fontMedium,
                  colors.textAccent,
                  "uppercase tracking-wider"
                )}>
                  <Users className="inline w-4 h-4 mr-1" />
                  Link Customer
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(!showQuickCreate)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs",
                    colors.textAccent,
                    "hover:bg-gold-500/10 rounded-lg",
                    effects.transitionNormal
                  )}
                >
                  <UserPlus className="w-3 h-3" />
                  {showQuickCreate ? 'Search Existing' : 'Quick Create'}
                </button>
              </div>
              
              {!showQuickCreate ? (
                <>
                  {/* Use existing customer or provided customer */}
                  {customerId && customerName ? (
                    <div className="p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gold-500/20 rounded-full flex items-center justify-center">
                            <span className={cn(typography.fontMedium, colors.textAccent)}>
                              {customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className={cn(typography.fontMedium, colors.textPrimary)}>{customerName}</p>
                            <p className={cn(typography.textXs, colors.textMuted)}>Selected Customer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <CustomerSelector
                      value={selectedCustomer?.id}
                      onChange={(id, customer) => setSelectedCustomer(customer || null)}
                      placeholder="Search by name, email, or phone..."
                      required={false}
                    />
                  )}
                  <p className={cn(typography.textXs, colors.textMuted, "mt-2")}>
                    Optional - helps track payment history and send receipts
                  </p>
                </>
              ) : (
                /* Quick Create Form */
                <div className="space-y-3 p-3 bg-white/5 border border-gold-500/30 rounded-lg">
                  <input
                    type="text"
                    value={quickCreateData.name}
                    onChange={(e) => setQuickCreateData({ ...quickCreateData, name: e.target.value })}
                    className={cn(components.input, "text-sm")}
                    placeholder="Customer Name (required)"
                    required
                  />
                  <input
                    type="email"
                    value={quickCreateData.email}
                    onChange={(e) => setQuickCreateData({ ...quickCreateData, email: e.target.value })}
                    className={cn(components.input, "text-sm")}
                    placeholder="Email (optional)"
                  />
                  <input
                    type="tel"
                    value={quickCreateData.phone}
                    onChange={(e) => setQuickCreateData({ ...quickCreateData, phone: e.target.value })}
                    className={cn(components.input, "text-sm")}
                    placeholder="Phone (optional)"
                  />
                  <p className={cn(typography.textXs, colors.textMuted)}>
                    Quick create for walk-in customers
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={cn(
                  "block mb-2",
                  typography.textSm,
                  typography.fontMedium,
                  colors.textAccent,
                  "uppercase tracking-wider"
                )}>
                  Payment Type
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
                  className={components.select}
                  required
                >
                  <option value={PaymentType.CONSULTATION}>Consultation</option>
                  <option value={PaymentType.DRAWING_CONSULTATION}>Drawing Consultation</option>
                  <option value={PaymentType.TATTOO_DEPOSIT}>Tattoo Deposit (30%)</option>
                  <option value={PaymentType.TATTOO_FINAL}>Final Payment</option>
                  <option value="custom_tattoo">Custom Tattoo Work</option>
                  <option value="session_payment">Session Payment</option>
                  <option value="touch_up">Touch-up Work</option>
                </select>
              </div>

              <div>
                <label className={cn(
                  "block mb-2",
                  typography.textSm,
                  typography.fontMedium,
                  colors.textAccent,
                  "uppercase tracking-wider"
                )}>
                  Amount (CAD)
                </label>
                <div className="relative">
                  <DollarSign className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
                    colors.textMuted
                  )} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lineItems.length > 0 ? calculateTotal() : formData.amount}
                    onChange={(e) => !lineItems.length && setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className={cn(components.input, "pl-10", lineItems.length > 0 && "opacity-70")}
                    required
                    disabled={lineItems.length > 0}
                  />
                </div>
                {formData.paymentType && (
                  <p className={cn(typography.textXs, colors.textMuted, "mt-1")}>
                    Suggested: ${
                      formData.paymentType === PaymentType.CONSULTATION ? '35-50' :
                      formData.paymentType === PaymentType.DRAWING_CONSULTATION ? '50-100' :
                      formData.paymentType === PaymentType.TATTOO_DEPOSIT ? '75-200' :
                      formData.paymentType === PaymentType.TATTOO_FINAL ? '100+' :
                      'Any amount'
                    }
                  </p>
                )}
                
                {/* Calculator Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={cn(
                    "mt-2 flex items-center gap-2",
                    typography.textSm,
                    colors.textAccent,
                    "hover:underline",
                    effects.transitionNormal
                  )}
                >
                  <Calculator className="w-4 h-4" />
                  {showCalculator ? 'Hide' : 'Use'} Calculator
                </button>
              </div>

              {/* Visual Calculator */}
              {showCalculator && (
                <div className="p-4 bg-white/5 border border-gold-500/30 rounded-lg space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={cn(typography.fontMedium, colors.textAccent)}>
                      Price Calculator
                    </h4>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1",
                        components.button.base,
                        components.button.sizes.small,
                        components.button.variants.secondary
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      Add Item
                    </button>
                  </div>

                  {/* Line Items */}
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className={cn(components.input, "flex-1 py-2 text-sm")}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.amount || ''}
                        onChange={(e) => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className={cn(components.input, "w-24 py-2 text-sm")}
                        step="0.01"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className={cn(components.input, "w-16 py-2 text-sm")}
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className={cn(
                          "p-2 rounded-lg",
                          "text-red-400 hover:bg-red-500/10",
                          effects.transitionNormal
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Tip Selection */}
                  {formData.allowTipping && (
                    <div>
                      <label className={cn(typography.textSm, colors.textSecondary, "block mb-2")}>
                        Add Tip:
                      </label>
                      <div className="flex gap-2">
                        {[0, 10, 15, 20].map(percent => (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => setTipPercentage(percent)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-sm",
                              tipPercentage === percent
                                ? "bg-gold-500 text-obsidian"
                                : "bg-white/5 text-white/70 hover:bg-white/10",
                              effects.transitionNormal
                            )}
                          >
                            {percent}%
                          </button>
                        ))}
                        <input
                          type="number"
                          placeholder="Custom %"
                          value={tipPercentage}
                          onChange={(e) => setTipPercentage(parseFloat(e.target.value) || 0)}
                          className={cn(components.input, "w-24 py-1 text-sm")}
                          step="1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Totals Display */}
                  <div className="pt-4 border-t border-gold-500/30 space-y-2">
                    {lineItems.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={colors.textSecondary}>Subtotal:</span>
                        <span className={colors.textPrimary}>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                    )}
                    {tipPercentage > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={colors.textSecondary}>Tip ({tipPercentage}%):</span>
                        <span className={colors.textPrimary}>${calculateTip().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gold-500/20">
                      <span className={cn(typography.fontMedium, colors.textAccent)}>Total:</span>
                      <span className={cn(typography.text2xl, typography.fontSemibold, colors.textAccent)}>
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={cn(
                  "block mb-2",
                  typography.textSm,
                  typography.fontMedium,
                  colors.textAccent,
                  "uppercase tracking-wider"
                )}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={components.input}
                  placeholder="e.g., Tattoo Consultation - John Doe"
                  required
                />
              </div>

              <div>
                <label className={cn(
                  "block mb-2",
                  typography.textSm,
                  typography.fontMedium,
                  colors.textAccent,
                  "uppercase tracking-wider"
                )}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={cn(components.input, "resize-none")}
                  rows={3}
                  placeholder="Additional details about the payment..."
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.allowTipping}
                    onChange={(e) => setFormData({ ...formData, allowTipping: e.target.checked })}
                    className="mr-3 w-4 h-4 bg-white/5 border border-gold-500/30 rounded focus:ring-2 focus:ring-gold-500/50 text-gold-500"
                  />
                  <span className={cn(
                    typography.textSm,
                    colors.textSecondary,
                    "group-hover:" + colors.textPrimary,
                    effects.transitionNormal
                  )}>Allow tipping</span>
                </label>
                
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail !== false}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="mr-3 w-4 h-4 bg-white/5 border border-gold-500/30 rounded focus:ring-2 focus:ring-gold-500/50 text-gold-500"
                  />
                  <span className={cn(
                    typography.textSm,
                    colors.textSecondary,
                    "group-hover:" + colors.textPrimary,
                    effects.transitionNormal
                  )}>Send payment link via email</span>
                </label>
                
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.enableReminders !== false}
                    onChange={(e) => setFormData({ ...formData, enableReminders: e.target.checked })}
                    className="mr-3 w-4 h-4 bg-white/5 border border-gold-500/30 rounded focus:ring-2 focus:ring-gold-500/50 text-gold-500"
                  />
                  <span className={cn(
                    typography.textSm,
                    colors.textSecondary,
                    "group-hover:" + colors.textPrimary,
                    effects.transitionNormal
                  )}>Send automatic payment reminders</span>
                </label>
                
                {formData.enableReminders && (
                  <div className="ml-7 p-3 bg-white/5 rounded-lg border border-gold-500/20">
                    <p className={cn(typography.textXs, colors.textMuted, "mb-2")}>
                      Reminder Schedule (days after creation):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={(formData.reminderSchedule as number[])?.[0] || 2}
                        onChange={(e) => {
                          const schedule = [...(formData.reminderSchedule as number[] || [2, 7, 14])];
                          schedule[0] = parseInt(e.target.value) || 2;
                          setFormData({ ...formData, reminderSchedule: schedule });
                        }}
                        className={cn(components.input, "w-16 py-1 text-sm text-center")}
                        min="1"
                        max="30"
                      />
                      <input
                        type="number"
                        value={(formData.reminderSchedule as number[])?.[1] || 7}
                        onChange={(e) => {
                          const schedule = [...(formData.reminderSchedule as number[] || [2, 7, 14])];
                          schedule[1] = parseInt(e.target.value) || 7;
                          setFormData({ ...formData, reminderSchedule: schedule });
                        }}
                        className={cn(components.input, "w-16 py-1 text-sm text-center")}
                        min="1"
                        max="30"
                      />
                      <input
                        type="number"
                        value={(formData.reminderSchedule as number[])?.[2] || 14}
                        onChange={(e) => {
                          const schedule = [...(formData.reminderSchedule as number[] || [2, 7, 14])];
                          schedule[2] = parseInt(e.target.value) || 14;
                          setFormData({ ...formData, reminderSchedule: schedule });
                        }}
                        className={cn(components.input, "w-16 py-1 text-sm text-center")}
                        min="1"
                        max="30"
                      />
                      <span className={cn(typography.textXs, colors.textMuted, "self-center")}>days</span>
                    </div>
                    <p className={cn(typography.textXs, colors.textMuted, "mt-2")}>
                      Reminders will be sent on days {(formData.reminderSchedule as number[])?.join(', ')} if unpaid
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className={cn(typography.textSm, "text-red-400")}>{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.secondary,
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  "flex-1",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.primary,
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-[#C9A449]/20"
                )}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className={cn(typography.textXl, typography.fontSemibold, colors.textPrimary, "mb-2")}>
                Payment Link Created!
              </h3>
              <p className={cn(typography.textSm, colors.textSecondary)}>
                The payment link has been generated successfully.
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

            {/* Primary Sharing Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={copyToClipboard}
                className={cn(
                  "flex items-center justify-center gap-2",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.secondary
                )}
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <button
                onClick={sendViaEmail}
                className={cn(
                  "flex items-center justify-center gap-2",
                  components.button.base,
                  components.button.sizes.medium,
                  components.button.variants.primary,
                  "shadow-lg shadow-[#C9A449]/20"
                )}
              >
                <Send className="w-4 h-4" />
                Email
              </button>
            </div>
            
            {/* Mobile Sharing Options */}
            <div className="mb-4">
              <p className={cn(typography.textXs, colors.textMuted, "mb-2 uppercase tracking-wider")}>
                Mobile Sharing:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={sendViaWhatsApp}
                  className="flex flex-col items-center gap-2 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">WhatsApp</span>
                </button>
                <button
                  onClick={sendViaSMS}
                  className="flex flex-col items-center gap-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
                >
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-blue-400">SMS</span>
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="flex flex-col items-center gap-2 p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-purple-400">QR Code</span>
                </button>
              </div>
            </div>
            
            {/* QR Code Display */}
            {showQRCode && (
              <div className="mb-4 p-4 bg-white/5 border border-gold-500/30 rounded-lg">
                <p className={cn(typography.textSm, colors.textSecondary, "mb-3 text-center")}>
                  Customer can scan this QR code to pay:
                </p>
                <div className="flex justify-center">
                  <img 
                    src={generateQRCode()} 
                    alt="Payment QR Code" 
                    className="rounded-lg bg-white p-2"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className={cn(
                "w-full mt-4",
                components.button.base,
                components.button.sizes.small,
                components.button.variants.ghost
              )}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 