'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  User,
  Mail,
  Phone,
  Palette,
  Ruler,
  MapPin,
  Clock,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { getApiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import CustomerForm from '@/src/components/forms/CustomerForm';
import { DashboardPageLayout } from '../../components/DashboardPageLayout';
import { DashboardCard } from '../../components/DashboardCard';
import {  colors, components } from '@/src/lib/styles/globalStyleConstants';
import { getTattooRequestDisplayName, getUserTypeBadge } from '@/src/lib/utils/displayNames';

export default function TattooRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<TattooRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  // Create API client instance - stable reference
  const tattooRequestClient = useMemo(() => {
    // Only create client in browser
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const client = getApiClient();
      return new TattooRequestApiClient(client);
    } catch (error) {
      console.error('Failed to create tattoo request client:', error);
      return null;
    }
  }, []);

  const loadTattooRequest = useCallback(async (id: string) => {
    // Don't try to load on server or without client
    if (!tattooRequestClient || typeof window === 'undefined') {
      return;
    }

    console.log('🔍 [TattooRequest] Starting to load request:', id);
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [TattooRequest] Calling API client getById...');
      const data = await tattooRequestClient.getById(id);
      console.log('✅ [TattooRequest] Successfully loaded:', data);
      setRequest(data);
    } catch (err: unknown) {
      console.error('❌ [TattooRequest] Error loading request:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err
      });
      setError(err instanceof Error ? err.message : 'Failed to load tattoo request');
    } finally {
      setLoading(false);
    }
  }, [tattooRequestClient]);

  useEffect(() => {
    if (params && params.id) {
      loadTattooRequest(params.id as string);
    }
  }, [params, loadTattooRequest]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!request || updating || !tattooRequestClient) return;

    setUpdating(true);
    try {
      await tattooRequestClient.updateStatus(request.id, newStatus);
      await loadTattooRequest(request.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'new': 'bg-gold-500/20 text-gold-500 border-gold-500/30',
      'reviewed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return statusColors[status] || 'bg-white/10 text-white/70 border-gold-500/10';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <DashboardPageLayout
        title="Tattoo Request Details"
        description="Loading request information"
        breadcrumbs={[
          { label: 'Tattoo Requests', href: '/dashboard/tattoo-request' },
          { label: 'Loading...' }
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500/30 mx-auto mb-4"></div>
            <p className="text-white/70">Loading tattoo request...</p>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardPageLayout
        title="Tattoo Request Details"
        description="Error loading request"
        breadcrumbs={[
          { label: 'Tattoo Requests', href: '/dashboard/tattoo-request' },
          { label: 'Error' }
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Tattoo request not found'}</p>
            <Link 
              href="/dashboard/tattoo-request"
              className="text-gold-500 hover:text-gold-500/90 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              Back to tattoo requests
            </Link>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Tattoo Request Details"
      description={`Request #${request.id.slice(-6)}`}
      breadcrumbs={[
        { label: 'Tattoo Requests', href: '/dashboard/tattoo-request' },
        { label: `Request #${request.id.slice(-6)}` }
      ]}
    >
      {/* Header Actions */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          
          <div className="flex gap-2">
            {request.status === 'new' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('reviewed')}
                  disabled={updating}
                  className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-6 py-3 text-base bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-6 py-3 text-base bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className={`${components.button.base} ${components.button.sizes.medium} bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === 'reviewed' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-6 py-3 text-base bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className={`${components.button.base} ${components.button.sizes.medium} bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === 'approved' && (
              <Link
                href={`/dashboard/appointments/new?tattooRequestId=${request.id}`}
                className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
              >
                Create Appointment
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Submission Info */}
          <DashboardCard
            title="Request Information"
          >
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/50 mb-1">Status</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-white/50 mb-1">Submitted</p>
                <p className="text-sm flex items-center text-white/70">
                  <Calendar className="w-4 h-4 mr-1 text-gold-500" />
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </DashboardCard>

          {/* Tattoo Details */}
          <DashboardCard
            title="Tattoo Details"
          >
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/50 mb-1">Description</p>
                <p className="text-white/70">{request.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/50 mb-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gold-500" />
                    Placement
                  </p>
                  <p className="font-medium text-white/70">{request.placement || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-white/50 mb-1 flex items-center">
                    <Ruler className="w-4 h-4 mr-1 text-gold-500" />
                    Size
                  </p>
                  <p className="font-medium text-white/70">{request.size || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/50 mb-1 flex items-center">
                    <Palette className="w-4 h-4 mr-1 text-gold-500" />
                    Color Preference
                  </p>
                  <p className="font-medium text-white/70">{request.colorPreference || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-white/50 mb-1">Style</p>
                  <p className="font-medium text-white/70">{request.style || 'Not specified'}</p>
                </div>
              </div>
              
              {request.purpose && (
                <div>
                  <p className="text-sm text-white/50 mb-1">Purpose/Meaning</p>
                  <p className="text-white/70">{request.purpose}</p>
                </div>
              )}
              
              {request.timeframe && (
                <div>
                  <p className="text-sm text-white/50 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gold-500" />
                    Timeframe
                  </p>
                  <p className="font-medium text-white/70">{request.timeframe}</p>
                </div>
              )}
              
              {request.additionalNotes && (
                <div>
                  <p className="text-sm text-white/50 mb-1 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-gold-500" />
                    Additional Notes
                  </p>
                  <p className="text-white/70">{request.additionalNotes}</p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Reference Images */}
          {request.referenceImages && request.referenceImages.length > 0 && (
            <DashboardCard
              title="Reference Images"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.referenceImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={image.url}
                      alt={`Reference ${index + 1}`}
                      width={300}
                      height={192}
                      className="w-full h-48 object-cover rounded-2xl border border-gold-500/10"
                    />
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-obsidian bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    >
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                        View Full Size
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <DashboardCard
            title="Contact Information"
          >
            
            <div className="space-y-3">
              {request.customer ? (
                <>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gold-500 mr-3" />
                    <div>
                      <p className="text-sm text-white/50">Name</p>
                      <p className="font-medium text-white/70">{request.customer.name}</p>
                    </div>
                  </div>
                  
                  {request.customer.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gold-500 mr-3" />
                      <div>
                        <p className="text-sm text-white/50">Email</p>
                        <a
                          href={`mailto:${request.customer.email}`}
                          className="font-medium text-gold-500 hover:text-gold-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                          {request.customer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-3 border-t border-gold-500/10">
                    <Link
                      href={`/dashboard/customers/${request.customer.id}`}
                      className="text-sm text-gold-500 hover:text-gold-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    >
                      View customer profile →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-white/70 font-medium">
                      {getTattooRequestDisplayName(request)}
                    </p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadge(request).className}`}>
                      {getUserTypeBadge(request).icon}
                    </span>
                  </div>
                  
                  {request.contactEmail && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gold-500 mr-3" />
                      <div>
                        <p className="text-sm text-white/50">Contact Email</p>
                        <a
                          href={`mailto:${request.contactEmail}`}
                          className="font-medium text-gold-500 hover:text-gold-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                          {request.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {request.contactPhone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gold-500 mr-3" />
                      <div>
                        <p className="text-sm text-white/50">Contact Phone</p>
                        <a
                          href={`tel:${request.contactPhone}`}
                          className="font-medium text-gold-500 hover:text-gold-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                          {request.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Create Customer Button for Unregistered Requests */}
                  <div className="pt-3 mt-3 border-t border-gold-500/10">
                    <button
                      onClick={() => setShowCreateCustomerModal(true)}
                      className="w-full px-6 py-3 bg-gold-500/20 text-gold-500 hover:bg-gold-500/30 hover:text-gold-400 border border-gold-500/50 hover:border-gold-500 font-medium tracking-[0.02em] relative overflow-hidden inline-flex items-center justify-center rounded-lg transition-all duration-300 gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Customer Profile
                    </button>
                  </div>
                </>
              )}
              
              {request.contactPreference && (
                <div className={`pt-3 mt-3 border-t ${colors.borderSubtle}`}>
                  <p className="text-sm text-white/50">Contact Preference</p>
                  <p className="font-medium text-white/70">{request.contactPreference}</p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Artist Preference */}
          {request.preferredArtist && (
            <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-white">Artist Preference</h2>
              <p className="text-gray-300">{request.preferredArtist}</p>
            </div>
          )}

          {/* Tracking Info */}
          {request.trackingToken && (
            <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-white">Tracking Information</h2>
              <div>
                <p className="text-sm text-gray-400">Tracking Token</p>
                <p className="font-mono text-sm bg-[#0a0a0a] p-2 rounded mt-1 text-gray-300">
                  {request.trackingToken}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateCustomerModal}
        onClose={() => setShowCreateCustomerModal(false)}
        title="Create Customer Profile"
      >
        <CustomerForm
          tattooRequestId={request.id}
          fromTattooRequest={true}
          onSuccess={() => {
            setShowCreateCustomerModal(false);
            loadTattooRequest(request.id);
          }}
          onCancel={() => setShowCreateCustomerModal(false)}
        />
      </Modal>
    </DashboardPageLayout>
  );
}
