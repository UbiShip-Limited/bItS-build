'use client';

import React from 'react';
import PaymentButton, { PaymentDropdown } from '@/components/payments/PaymentButton';
import { PaymentType } from '@/lib/api/services/paymentService';

// Example of how to integrate payment functionality into appointment details
export default function AppointmentPaymentExample() {
  // This would come from your appointment data
  const appointment = {
    id: 'appointment-123',
    customerId: 'customer-456',
    customerName: 'John Doe',
    type: 'tattoo_session',
    priceQuote: 500.00,
    depositPaid: false,
    status: 'scheduled'
  };

  return (
    <div className="space-y-6">
      {/* Example 1: Simple Payment Button */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Quick Payment Request</h3>
        <p className="text-gray-600 mb-4">
          Send a payment link to the customer for this appointment.
        </p>
        <PaymentButton
          customerId={appointment.customerId}
          customerName={appointment.customerName}
          appointmentId={appointment.id}
          defaultAmount={appointment.priceQuote}
          defaultType={PaymentType.TATTOO_DEPOSIT}
          buttonText="Request Deposit"
          onSuccess={() => {
            console.log('Payment link created successfully');
            // Refresh appointment data or show success message
          }}
        />
      </div>

      {/* Example 2: Payment Dropdown with Options */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Options</h3>
        <p className="text-gray-600 mb-4">
          Choose between payment link or invoice for more complex billing.
        </p>
        <PaymentDropdown
          customerId={appointment.customerId}
          customerName={appointment.customerName}
          appointmentId={appointment.id}
          defaultAmount={appointment.priceQuote}
          defaultType={PaymentType.TATTOO_FINAL}
          showInvoiceOption={true}
          onSuccess={() => {
            console.log('Payment created successfully');
          }}
        />
      </div>

      {/* Example 3: Conditional Payment Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Status Actions</h3>
        <div className="space-y-4">
          {!appointment.depositPaid && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-900">Deposit Required</p>
                <p className="text-sm text-yellow-700">
                  A deposit of ${(appointment.priceQuote * 0.25).toFixed(2)} is required to confirm this appointment.
                </p>
              </div>
              <PaymentButton
                customerId={appointment.customerId}
                customerName={appointment.customerName}
                appointmentId={appointment.id}
                defaultAmount={appointment.priceQuote * 0.25}
                defaultType={PaymentType.TATTOO_DEPOSIT}
                buttonText="Send Deposit Request"
                buttonVariant="primary"
              />
            </div>
          )}

          {appointment.status === 'completed' && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Session Completed</p>
                <p className="text-sm text-green-700">
                  Request final payment of ${appointment.priceQuote.toFixed(2)}
                </p>
              </div>
              <PaymentButton
                customerId={appointment.customerId}
                customerName={appointment.customerName}
                appointmentId={appointment.id}
                defaultAmount={appointment.priceQuote}
                defaultType={PaymentType.TATTOO_FINAL}
                buttonText="Request Final Payment"
                buttonVariant="primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Example 4: Multiple Payment Types */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Type Selection</h3>
        <div className="grid grid-cols-2 gap-4">
          <PaymentButton
            customerId={appointment.customerId}
            customerName={appointment.customerName}
            appointmentId={appointment.id}
            defaultAmount={50}
            defaultType={PaymentType.CONSULTATION}
            buttonText="Consultation Fee"
            buttonVariant="secondary"
          />
          <PaymentButton
            customerId={appointment.customerId}
            customerName={appointment.customerName}
            appointmentId={appointment.id}
            defaultAmount={75}
            defaultType={PaymentType.DRAWING_CONSULTATION}
            buttonText="Drawing Consultation"
            buttonVariant="secondary"
          />
        </div>
      </div>
    </div>
  );
} 