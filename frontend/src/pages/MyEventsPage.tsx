import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

interface Event {
  _id: string;
  title: string;
  description: string;
  eventType: string;
  location: {
    address: string;
    city: string;
  };
  dateTime: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  capacity: {
    maxAttendees: number;
    currentAttendees: number;
  };
  registrationFee: number;
  status: string;
  images: Array<{ url: string; alt: string }>;
  organizer: {
    name: string;
    email: string;
  };
  attendees: Array<{
    user: {
      _id: string;
      name: string;
    };
    registeredAt: string;
    status: string;
    paymentStatus: string;
  }>;
}

const MyEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getUserEvents({ status: 'registered' });
      setEvents(response.events);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.dateTime.startDate);
    const endDate = new Date(event.dateTime.endDate);

    if (now > endDate) {
      return { status: 'completed', label: 'Completed', color: 'text-gray-600', icon: CheckCircle };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', label: 'Ongoing', color: 'text-blue-600', icon: AlertCircle };
    } else {
      return { status: 'upcoming', label: 'Upcoming', color: 'text-green-600', icon: Clock };
    }
  };

  const getUserRegistrationStatus = (event: Event) => {
    if (!user) return null;
    const registration = event.attendees.find(attendee => attendee.user._id === user._id);
    return registration;
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    const eventStatus = getEventStatus(event);
    if (filter === 'upcoming') return eventStatus.status === 'upcoming' || eventStatus.status === 'ongoing';
    if (filter === 'past') return eventStatus.status === 'completed';
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to view your events.</p>
          <Link
            to="/login"
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your event registrations and view upcoming events
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                    filter === tab.key
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'all' ? 'No events registered' : `No ${filter} events`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'You haven\'t registered for any events yet.' 
                : `You don\'t have any ${filter} events.`}
            </p>
            <Link
              to="/events"
              className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event) => {
              const eventStatus = getEventStatus(event);
              const registration = getUserRegistrationStatus(event);
              const StatusIcon = eventStatus.icon;

              return (
                <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      {/* Event Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                            {event.eventType.replace('_', ' ').toUpperCase()}
                          </span>
                          <div className={`flex items-center space-x-1 ${eventStatus.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{eventStatus.label}</span>
                          </div>
                          {registration && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              registration.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : registration.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Payment: {registration.paymentStatus}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <div>
                              <p className="font-medium">{formatDate(event.dateTime.startDate)}</p>
                              <p>{formatTime(event.dateTime.startTime)} - {formatTime(event.dateTime.endTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <div>
                              <p className="font-medium">{event.location.city}</p>
                              <p className="line-clamp-1">{event.location.address}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <div>
                              <p className="font-medium">
                                {event.capacity.currentAttendees}/{event.capacity.maxAttendees}
                              </p>
                              <p>Registered</p>
                            </div>
                          </div>
                        </div>

                        {registration && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Registered on:</span>{' '}
                              {new Date(registration.registeredAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {event.registrationFee > 0 && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Registration Fee:</span> ৳{event.registrationFee}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                        <Link
                          to={`/events/${event._id}`}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;