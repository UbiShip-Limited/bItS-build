'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerService, CreateCustomerRequest, UpdateCustomerRequest } from '@/src/lib/api/services/customerService';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import { Search, Link as LinkIcon } from 'lucide-react';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
  // New props for linking tattoo requests
  tattooRequestId?: string;
  fromTattooRequest?: boolean;
}

export default function CustomerForm({ 
  customer, 
  onSuccess, 
  onCancel,
  tattooRequestId,
  fromTattooRequest 
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    notes: customer?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousRequests, setAnonymousRequests] = useState<TattooRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(tattooRequestId || '');
  const [showLinkSection, setShowLinkSection] = useState(false);
  const [searchingRequests, setSearchingRequests] = useState(false);

  const customerService = new CustomerService(apiClient);
  const tattooRequestService = new TattooRequestService(apiClient);

  // Load anonymous tattoo requests if creating new customer
  useEffect(() => {
    if (!customer && !fromTattooRequest) {
      loadAnonymousRequests();
    }
  }, [customer, fromTattooRequest]);

  // If coming from a tattoo request, pre-fill the form
  useEffect(() => {
    if (tattooRequestId && !customer) {
      loadTattooRequestData(tattooRequestId);
    }
  }, [tattooRequestId, customer]);

  const loadAnonymousRequests = async () => {
    setSearchingRequests(true);
    try {
      const response = await tattooRequestService.getAll({ 
        status: 'new',
        limit: 50 
      });
      
      // Filter for anonymous requests (no customerId)
      const anonymous = response.data.filter(req => !req.customerId && (req.contactEmail || req.contactPhone));
      setAnonymousRequests(anonymous);
    } catch (err) {
      console.error('Failed to load anonymous requests:', err);
    } finally {
      setSearchingRequests(false);
    }
  };

  const loadTattooRequestData = async (requestId: string) => {
    try {
      const request = await tattooRequestService.getById(requestId);
      if (request.contactEmail || request.contactPhone) {
        setFormData({
          name: formData.name || '',
          email: request.contactEmail || '',
          phone: request.contactPhone || '',
          notes: `From tattoo request: ${request.description}\nPlacement: ${request.placement || 'N/A'}\nSize: ${request.size || 'N/A'}`
        });
      }
    } catch (err) {
      console.error('Failed to load tattoo request:', err);
    }
  };

  const handleLinkRequest = (requestId: string) => {
    const request = anonymousRequests.find(r => r.id === requestId);
    if (request) {
      setFormData({
        ...formData,
        email: formData.email || request.contactEmail || '',
        phone: formData.phone || request.contactPhone || '',
        notes: formData.notes ? 
          `${formData.notes}\n\nLinked tattoo request: ${request.description}` : 
          `Linked tattoo request: ${request.description}`
      });
      setSelectedRequestId(requestId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      let customerId: string;
      
      if (customer) {
        // Update existing customer
        const updateData: UpdateCustomerRequest = {};
        if (formData.name !== customer.name) updateData.name = formData.name;
        if (formData.email !== customer.email) updateData.email = formData.email || undefined;
        if (formData.phone !== customer.phone) updateData.phone = formData.phone || undefined;
        if (formData.notes !== customer.notes) updateData.notes = formData.notes || undefined;

        await customerService.updateCustomer(customer.id, updateData);
        customerId = customer.id;
      } else {
        // Create new customer
        const createData: CreateCustomerRequest = {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined
        };

        const newCustomer = await customerService.createCustomer(createData);
        customerId = newCustomer.id;
      }

      // If we have a selected tattoo request, update it to link with this customer
      if (selectedRequestId || tattooRequestId) {
        const requestId = selectedRequestId || tattooRequestId;
        try {
          // Update the tattoo request to link it with the customer using proper API method
          await tattooRequestService.update(requestId!, {
            customerId: customerId
          });
        } catch (err) {
          console.error('Failed to link tattoo request:', err);
          // Don't fail the whole operation if linking fails
        }
      }

      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A customer with this email already exists');
      } else {
        setError(err.message || 'Failed to save customer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Link with anonymous request section */}
      {!customer && !fromTattooRequest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setShowLinkSection(!showLinkSection)}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium"
          >
            <LinkIcon className="w-4 h-4" />
            Link with Anonymous Tattoo Request
          </button>
          
          {showLinkSection && (
            <div className="mt-4">
              {searchingRequests ? (
                <p className="text-sm text-gray-600">Loading anonymous requests...</p>
              ) : anonymousRequests.length === 0 ? (
                <p className="text-sm text-gray-600">No anonymous tattoo requests found</p>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select a tattoo request to link:
                  </label>
                  <select
                    value={selectedRequestId}
                    onChange={(e) => handleLinkRequest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a request --</option>
                    {anonymousRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.contactEmail || request.contactPhone} - {request.description.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {fromTattooRequest && tattooRequestId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            Creating customer from tattoo request. The request will be automatically linked.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
} 