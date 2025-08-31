import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Tag,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Event {
  _id: string;
  title: string;
  description: string;
  eventType: string;
  location: {
    address: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  dateTime: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  organizer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  capacity: {
    maxAttendees: number;
    currentAttendees: number;
  };
  registrationFee: number;
  status: string;
  images: Array<{ url: string; alt: string }>;
  tags: string[];
  requirements?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  attendees: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    registeredAt: string;
    status: string;
    paymentStatus: string;
  }>;
  vendors: Array<{
    user: {
      _id: string;
      name: string;
      businessName: string;
    };
    businessName: string;
    products: string[];
    stallNumber?: string;
  }>;
  spotsRemaining: number;
  isAvailable: boolean;
  duration: number;
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'online'>('cod');

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getEventById(eventId!);
      setEvent(response.event);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleRegister = async (paymentMethod?: 'cod' | 'online') => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      const registrationData = event?.registrationFee && event.registrationFee > 0 && paymentMethod 
        ? { paymentMethod } 
        : {};
      
      const response = await eventsApi.registerForEvent(eventId!, registrationData);
      await fetchEvent(); // Refresh event data
      alert(response.message || 'Successfully registered for the event!');
      setShowPaymentModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (event?.registrationFee && event.registrationFee > 0) {
      setShowPaymentModal(true);
    } else {
      handleRegister();
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setCancelling(true);
      await eventsApi.cancelRegistration(eventId!);
      await fetchEvent(); // Refresh event data
      setShowCancelModal(false);
      alert('Registration cancelled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      farmers_market: 'bg-green-100 text-green-800',
      workshop: 'bg-blue-100 text-blue-800',
      festival: 'bg-purple-100 text-purple-800',
      exhibition: 'bg-yellow-100 text-yellow-800',
      conference: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const isUserRegistered = () => {
    if (!user || !event) return false;
    return event.attendees.some(
      attendee => attendee.user._id === user._id && 
                 (attendee.status === 'registered' || attendee.status === 'attended')
    );
  };

  const canRegister = () => {
    if (!event || !user) return false;
    return event.isAvailable && !isUserRegistered() && event.status === 'published';
  };

  const canCancelRegistration = () => {
    if (!event || !user || !isUserRegistered()) return false;
    const hoursUntilEvent = (new Date(event.dateTime.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursUntilEvent >= 24;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Event not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The event you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Events
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Event Images */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="h-64 md:h-96 bg-gray-200 relative">
                {event.images && event.images.length > 0 ? (
                  <img
                    src={event.images[0].url}
                    alt={event.images[0].alt || event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {event.registrationFee > 0 && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ৳{event.registrationFee}
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">{formatDate(event.dateTime.startDate)}</p>
                    <p className="text-sm">
                      {formatTime(event.dateTime.startTime)} - {formatTime(event.dateTime.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">{event.location.city}</p>
                    <p className="text-sm">{event.location.address}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">
                      {event.capacity.currentAttendees}/{event.capacity.maxAttendees} Registered
                    </p>
                    <p className="text-sm">{event.spotsRemaining} spots remaining</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">{event.duration} day{event.duration > 1 ? 's' : ''}</p>
                    <p className="text-sm">Duration</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {event.requirements && (
                <div className="border-t pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
                  <p className="text-gray-700">{event.requirements}</p>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vendors Section */}
            {event.vendors && event.vendors.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Participating Vendors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.vendors.map((vendor, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{vendor.businessName}</h3>
                      <p className="text-sm text-gray-600">{vendor.user.name}</p>
                      {vendor.stallNumber && (
                        <p className="text-sm text-gray-500">Stall #{vendor.stallNumber}</p>
                      )}
                      {vendor.products && vendor.products.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Products:</p>
                          <p className="text-sm text-gray-700">{vendor.products.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>
              
              {event.registrationFee > 0 && (
                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600">৳{event.registrationFee}</p>
                  <p className="text-sm text-gray-600">Registration fee</p>
                </div>
              )}

              {isUserRegistered() ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">You're registered!</span>
                  </div>
                  {canCancelRegistration() && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              ) : canRegister() ? (
                <button
                  onClick={handleRegisterClick}
                  disabled={registering}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              ) : (
                <div className="text-center">
                  {!user ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      Login to Register
                    </button>
                  ) : event.spotsRemaining === 0 ? (
                    <div className="flex items-center justify-center text-red-600">
                      <XCircle className="h-5 w-5 mr-2" />
                      <span>Event is full</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>Registration not available</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
              <div className="space-y-3">
                <p className="font-medium text-gray-900">{event.organizer.name}</p>
                {(event.contactInfo?.email || event.organizer.email) && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.contactInfo?.email || event.organizer.email}</span>
                  </div>
                )}
                {(event.contactInfo?.phone || event.organizer.phone) && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.contactInfo?.phone || event.organizer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{event.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">
                    {event.capacity.currentAttendees}/{event.capacity.maxAttendees}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className={`font-medium ${event.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {event.isAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Registration Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Registration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your registration for this event? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Keep Registration
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
            <p className="text-gray-600 mb-4">
              Registration fee: <span className="font-semibold text-green-600">৳{event?.registrationFee}</span>
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={selectedPaymentMethod === 'cod'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as 'cod')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Cash on Delivery</div>
                  <div className="text-sm text-gray-600">Pay at the event venue</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={selectedPaymentMethod === 'online'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as 'online')}
                  className="mr-3"
                  disabled
                />
                <div>
                  <div className="font-medium text-gray-900">Online Payment</div>
                  <div className="text-sm text-gray-600">Coming soon</div>
                </div>
              </label>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRegister(selectedPaymentMethod)}
                disabled={registering}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;