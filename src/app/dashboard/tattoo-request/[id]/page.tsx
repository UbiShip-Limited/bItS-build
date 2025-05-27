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
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/TattooRequestService';
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

  const tattooRequestService = new TattooRequestService(apiClient);

  useEffect(() => {
    if (params.id) {
      loadTattooRequest(params.id as string);
    }
  }, [params.id]);

  const loadTattooRequest = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tattooRequestService.getById(id);
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
      await tattooRequestService.update(request.id, { status: newStatus });
      await loadTattooRequest(request.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-gray-100 text-gray-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading tattoo request...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tattoo request not found'}</p>
          <Link 
            href="/dashboard/tattoo-request"
            className="text-blue-600 hover:text-blue-800"
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
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to tattoo requests
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Tattoo Request Details</h1>
            <p className="text-gray-600">Request #{request.id.slice(-6)}</p>
          </div>
          
          <div className="flex gap-2">
            {request.status === 'new' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('reviewed')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === 'approved' && (
              <Link
                href={`/dashboard/appointments/new?tattooRequestId=${request.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Request Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted</p>
                <p className="text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Tattoo Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Tattoo Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{request.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Placement
                  </p>
                  <p className="font-medium">{request.placement || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <Ruler className="w-4 h-4 mr-1" />
                    Size
                  </p>
                  <p className="font-medium">{request.size || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <Palette className="w-4 h-4 mr-1" />
                    Color Preference
                  </p>
                  <p className="font-medium">{request.colorPreference || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Style</p>
                  <p className="font-medium">{request.style || 'Not specified'}</p>
                </div>
              </div>
              
              {request.purpose && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Purpose/Meaning</p>
                  <p className="text-gray-900">{request.purpose}</p>
                </div>
              )}
              
              {request.timeframe && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Timeframe
                  </p>
                  <p className="font-medium">{request.timeframe}</p>
                </div>
              )}
              
              {request.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Additional Notes
                  </p>
                  <p className="text-gray-900">{request.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reference Images */}
          {request.referenceImages && request.referenceImages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Reference Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.referenceImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-lg transition-all"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            
            <div className="space-y-3">
              {request.customer ? (
                <>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{request.customer.name}</p>
                    </div>
                  </div>
                  
                  {request.customer.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <a 
                          href={`mailto:${request.customer.email}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {request.customer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-3 border-t">
                    <Link
                      href={`/dashboard/customers/${request.customer.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View customer profile →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Anonymous Request</p>
                  
                  {request.contactEmail && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Email</p>
                        <a 
                          href={`mailto:${request.contactEmail}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {request.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {request.contactPhone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Phone</p>
                        <a 
                          href={`tel:${request.contactPhone}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {request.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Create Customer Button for Anonymous Requests */}
                  <div className="pt-3 mt-3 border-t">
                    <button
                      onClick={() => setShowCreateCustomerModal(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Customer Profile
                    </button>
                  </div>
                </>
              )}
              
              {request.contactPreference && (
                <div className="pt-3 mt-3 border-t">
                  <p className="text-sm text-gray-600">Contact Preference</p>
                  <p className="font-medium">{request.contactPreference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Artist Preference */}
          {request.preferredArtist && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Artist Preference</h2>
              <p className="text-gray-900">{request.preferredArtist}</p>
            </div>
          )}

          {/* Tracking Info */}
          {request.trackingToken && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tracking Information</h2>
              <div>
                <p className="text-sm text-gray-600">Tracking Token</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
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
