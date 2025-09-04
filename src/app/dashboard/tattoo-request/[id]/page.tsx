'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
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
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import CustomerForm from '@/src/components/forms/CustomerForm';
import { DashboardPageLayout } from '../../components/DashboardPageLayout';
import { DashboardCard } from '../../components/DashboardCard';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { getTattooRequestDisplayName, getUserTypeBadge } from '@/src/lib/utils/displayNames';

export default function TattooRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<TattooRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  // Memoize the client to prevent recreation on every render
  const tattooRequestClient = useMemo(() => new TattooRequestApiClient(apiClient), []);

  const loadTattooRequest = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tattooRequestClient.getById(id);
      setRequest(data);
    } catch (err: unknown) {
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
    if (!request || updating) return;
    
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
      'new': `bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`,
      'reviewed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return statusColors[status] || `bg-white/10 ${colors.textSecondary} ${colors.borderSubtle}`;
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
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
            <p className={colors.textSecondary}>Loading tattoo request...</p>
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
              className={`${colors.textAccent} hover:${colors.textAccentProminent} ${effects.transitionNormal}`}
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
                  className={`${components.button.base} ${components.button.sizes.medium} bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className={`${components.button.base} ${components.button.sizes.medium} bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  className={`${components.button.base} ${components.button.sizes.medium} bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                <p className={`${typography.textSm} ${colors.textMuted} mb-1`}>Status</p>
                <span className={`px-3 py-1 inline-flex ${typography.textSm} ${typography.fontSemibold} rounded-full border ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div>
                <p className={`${typography.textSm} ${colors.textMuted} mb-1`}>Submitted</p>
                <p className={`${typography.textSm} flex items-center ${colors.textSecondary}`}>
                  <Calendar className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
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
                <p className={`${typography.textSm} ${colors.textMuted} mb-1`}>Description</p>
                <p className={colors.textSecondary}>{request.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1 flex items-center`}>
                    <MapPin className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
                    Placement
                  </p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.placement || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1 flex items-center`}>
                    <Ruler className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
                    Size
                  </p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.size || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1 flex items-center`}>
                    <Palette className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
                    Color Preference
                  </p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.colorPreference || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1`}>Style</p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.style || 'Not specified'}</p>
                </div>
              </div>
              
              {request.purpose && (
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1`}>Purpose/Meaning</p>
                  <p className={colors.textSecondary}>{request.purpose}</p>
                </div>
              )}
              
              {request.timeframe && (
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1 flex items-center`}>
                    <Clock className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
                    Timeframe
                  </p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.timeframe}</p>
                </div>
              )}
              
              {request.additionalNotes && (
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted} mb-1 flex items-center`}>
                    <MessageSquare className={`w-4 h-4 mr-1 ${colors.textAccent}`} />
                    Additional Notes
                  </p>
                  <p className={colors.textSecondary}>{request.additionalNotes}</p>
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
                      className={`w-full h-48 object-cover ${components.radius.medium} border ${colors.borderSubtle}`}
                    />
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`absolute inset-0 bg-obsidian bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center ${components.radius.medium} ${effects.transitionNormal}`}
                    >
                      <span className={`${colors.textPrimary} opacity-0 group-hover:opacity-100 ${effects.transitionNormal}`}>
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
                    <User className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                    <div>
                      <p className={`${typography.textSm} ${colors.textMuted}`}>Name</p>
                      <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.customer.name}</p>
                    </div>
                  </div>
                  
                  {request.customer.email && (
                    <div className="flex items-center">
                      <Mail className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                      <div>
                        <p className={`${typography.textSm} ${colors.textMuted}`}>Email</p>
                        <a 
                          href={`mailto:${request.customer.email}`}
                          className={`${typography.fontMedium} ${colors.textAccent} hover:${colors.textAccentProminent} ${effects.transitionNormal}`}
                        >
                          {request.customer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className={`pt-3 mt-3 border-t ${colors.borderSubtle}`}>
                    <Link
                      href={`/dashboard/customers/${request.customer.id}`}
                      className={`${typography.textSm} ${colors.textAccent} hover:${colors.textAccentProminent} ${effects.transitionNormal}`}
                    >
                      View customer profile →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`${typography.textSm} ${colors.textSecondary} font-medium`}>
                      {getTattooRequestDisplayName(request)}
                    </p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadge(request).className}`}>
                      {getUserTypeBadge(request).icon}
                    </span>
                  </div>
                  
                  {request.contactEmail && (
                    <div className="flex items-center">
                      <Mail className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                      <div>
                        <p className={`${typography.textSm} ${colors.textMuted}`}>Contact Email</p>
                        <a 
                          href={`mailto:${request.contactEmail}`}
                          className={`${typography.fontMedium} ${colors.textAccent} hover:${colors.textAccentProminent} ${effects.transitionNormal}`}
                        >
                          {request.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {request.contactPhone && (
                    <div className="flex items-center">
                      <Phone className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                      <div>
                        <p className={`${typography.textSm} ${colors.textMuted}`}>Contact Phone</p>
                        <a 
                          href={`tel:${request.contactPhone}`}
                          className={`${typography.fontMedium} ${colors.textAccent} hover:${colors.textAccentProminent} ${effects.transitionNormal}`}
                        >
                          {request.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Create Customer Button for Unregistered Requests */}
                  <div className={`pt-3 mt-3 border-t ${colors.borderSubtle}`}>
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
                  <p className={`${typography.textSm} ${colors.textMuted}`}>Contact Preference</p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{request.contactPreference}</p>
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
