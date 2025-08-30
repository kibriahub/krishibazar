import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { Calendar, MapPin, Users, Clock, Search, Filter, Tag } from 'lucide-react';

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
  tags: string[];
  organizer: {
    name: string;
    email: string;
  };
  spotsRemaining: number;
  isAvailable: boolean;
}

interface EventsResponse {
  events: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    city: '',
    upcoming: true
  });
  const [showFilters, setShowFilters] = useState(false);

  const eventTypes = [
    { value: '', label: 'All Types' },
    { value: 'farmers_market', label: 'Farmers Market' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'festival', label: 'Festival' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'conference', label: 'Conference' }
  ];

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...filters,
        upcoming: filters.upcoming ? 'true' : undefined
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if ((params as any)[key] === '' || (params as any)[key] === undefined) {
          delete (params as any)[key];
        }
      });

      const response: EventsResponse = await eventsApi.getEvents(params);
      setEvents(response.events);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(1);
  };

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

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Farmers Markets & Events</h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover local farmers markets, workshops, and agricultural events in your area
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mt-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </form>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <select
                      value={filters.eventType}
                      onChange={(e) => handleFilterChange('eventType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city name"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.upcoming}
                        onChange={(e) => handleFilterChange('upcoming', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Upcoming events only
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {events.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or check back later for new events.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                  {/* Event Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {event.images && event.images.length > 0 ? (
                      <img
                        src={event.images[0].url}
                        alt={event.images[0].alt || event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {event.registrationFee > 0 && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ৳{event.registrationFee}
                      </div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {formatDate(event.dateTime.startDate)} at {formatTime(event.dateTime.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="line-clamp-1">
                          {event.location.address}, {event.location.city}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          {event.capacity.currentAttendees}/{event.capacity.maxAttendees} registered
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {event.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{event.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      to={`/events/${event._id}`}
                      className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  {pagination.hasPrev && (
                    <button
                      onClick={() => fetchEvents(pagination.currentPage - 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Previous
                    </button>
                  )}
                  
                  <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  {pagination.hasNext && (
                    <button
                      onClick={() => fetchEvents(pagination.currentPage + 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;