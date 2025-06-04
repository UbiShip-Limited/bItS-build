'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileText, 
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

export default function TattooRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<TattooRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  const tattooRequestClient = new TattooRequestApiClient(apiClient);

  useEffect(() => {
    if (params.id) {
      loadTattooRequest(params.id as string);
    }
  }, [params.id]);

  const loadTattooRequest = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tattooRequestClient.getById(id);
      setRequest(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tattoo request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!request || updating) return;
    
    setUpdating(true);
    try {
      await tattooRequestClient.updateStatus(request.id, newStatus);
      await loadTattooRequest(request.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-[#C9A449]/20 text-[#C9A449]',
      'reviewed': 'bg-blue-500/20 text-blue-400',
      'approved': 'bg-green-500/20 text-green-400',
      'rejected': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
          <p className="mt-2 text-gray-400">Loading tattoo request...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Tattoo request not found'}</p>
          <Link 
            href="/dashboard/tattoo-request"
            className="text-[#C9A449] hover:text-[#E5B563] transition-colors"
          >
            Back to tattoo requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/tattoo-request"
          className="inline-flex items-center text-gray-400 hover:text-[#C9A449] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to tattoo requests
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Tattoo Request Details</h1>
            <p className="text-gray-400">Request #{request.id.slice(-6)}</p>
          </div>
          
          <div className="flex gap-2">
            {request.status === 'new' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('reviewed')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg disabled:opacity-50"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
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
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === 'approved' && (
              <Link
                href={`/dashboard/appointments/new?tattooRequestId=${request.id}`}
                className="px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
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
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Request Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Submitted</p>
                <p className="text-sm flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-1 text-[#C9A449]" />
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Tattoo Details */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Tattoo Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-gray-300">{request.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-[#C9A449]" />
                    Placement
                  </p>
                  <p className="font-medium text-gray-300">{request.placement || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1 flex items-center">
                    <Ruler className="w-4 h-4 mr-1 text-[#C9A449]" />
                    Size
                  </p>
                  <p className="font-medium text-gray-300">{request.size || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1 flex items-center">
                    <Palette className="w-4 h-4 mr-1 text-[#C9A449]" />
                    Color Preference
                  </p>
                  <p className="font-medium text-gray-300">{request.colorPreference || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Style</p>
                  <p className="font-medium text-gray-300">{request.style || 'Not specified'}</p>
                </div>
              </div>
              
              {request.purpose && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Purpose/Meaning</p>
                  <p className="text-gray-300">{request.purpose}</p>
                </div>
              )}
              
              {request.timeframe && (
                <div>
                  <p className="text-sm text-gray-400 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-[#C9A449]" />
                    Timeframe
                  </p>
                  <p className="font-medium text-gray-300">{request.timeframe}</p>
                </div>
              )}
              
              {request.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-400 mb-1 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-[#C9A449]" />
                    Additional Notes
                  </p>
                  <p className="text-gray-300">{request.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reference Images */}
          {request.referenceImages && request.referenceImages.length > 0 && (
            <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                <ImageIcon className="w-5 h-5 mr-2 text-[#C9A449]" />
                Reference Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.referenceImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-[#1a1a1a]"
                    />
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center rounded-lg transition-all"
                    >
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        View Full Size
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Contact Information</h2>
            
            <div className="space-y-3">
              {request.customer ? (
                <>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-[#C9A449] mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium text-gray-300">{request.customer.name}</p>
                    </div>
                  </div>
                  
                  {request.customer.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-[#C9A449] mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <a 
                          href={`mailto:${request.customer.email}`}
                          className="font-medium text-[#C9A449] hover:text-[#E5B563] transition-colors"
                        >
                          {request.customer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
                    <Link
                      href={`/dashboard/customers/${request.customer.id}`}
                      className="text-sm text-[#C9A449] hover:text-[#E5B563] transition-colors"
                    >
                      View customer profile →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Anonymous Request</p>
                  
                  {request.contactEmail && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-[#C9A449] mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Contact Email</p>
                        <a 
                          href={`mailto:${request.contactEmail}`}
                          className="font-medium text-[#C9A449] hover:text-[#E5B563] transition-colors"
                        >
                          {request.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {request.contactPhone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-[#C9A449] mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Contact Phone</p>
                        <a 
                          href={`tel:${request.contactPhone}`}
                          className="font-medium text-[#C9A449] hover:text-[#E5B563] transition-colors"
                        >
                          {request.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Create Customer Button for Anonymous Requests */}
                  <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
                    <button
                      onClick={() => setShowCreateCustomerModal(true)}
                      className="w-full px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#C9A449]/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Customer Profile
                    </button>
                  </div>
                </>
              )}
              
              {request.contactPreference && (
                <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
                  <p className="text-sm text-gray-400">Contact Preference</p>
                  <p className="font-medium text-gray-300">{request.contactPreference}</p>
                </div>
              )}
            </div>
          </div>

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
    </div>
  );
}
