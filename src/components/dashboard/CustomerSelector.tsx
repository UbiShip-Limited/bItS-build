'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { CustomerService, type Customer } from '@/src/lib/api/services/customerService';
import { apiClient } from '@/src/lib/api/apiClient';

interface CustomerSelectorProps {
  value?: string;
  onChange: (customerId: string | null, customer?: Customer) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function CustomerSelector({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search for a customer...',
  required = false,
  disabled = false
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const customerService = new CustomerService(apiClient);

  // Load selected customer on mount if value is provided
  useEffect(() => {
    if (value && !selectedCustomer) {
      loadCustomer(value);
    }
  }, [value]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCustomer = async (customerId: string) => {
    try {
      const customer = await customerService.getCustomer(customerId);
      setSelectedCustomer(customer);
    } catch (err) {
      console.error('Failed to load customer:', err);
    }
  };

  const searchCustomers = async (search: string) => {
    if (!search.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await customerService.searchCustomers(search);
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchCustomers(searchTerm);
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id, customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedCustomer ? (
        // Selected customer display
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-500">{selectedCustomer.email || selectedCustomer.phone || 'No contact info'}</p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        // Search input
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={required}
            disabled={disabled}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedCustomer && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : customers.length > 0 ? (
            <ul className="py-1">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                  >
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-sm font-medium">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {customer.email || customer.phone || 'No contact info'}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">No customers found</p>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNew();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create New Customer
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Start typing to search customers
            </div>
          )}
        </div>
      )}
    </div>
  );
} 