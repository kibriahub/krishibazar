import React, { useState, useEffect } from 'react';
import { eventsApi, adminEventsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Search,
  Filter,
  X,
  Check,
  XCircle,
  Clock,
  AlertTriangle
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
      lat: number;
      lng: number;
    };
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
  tags: string[];
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
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
  };
  registrationFee: number;
  status: string;
  images: Array<{ url: string; alt: string }>;
  tags: string[];
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
}

const AdminEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: 'farmers_market',
    location: {
      address: '',
      city: ''
    },
    dateTime: {
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: ''
    },
    capacity: {
      maxAttendees: 50
    },
    registrationFee: 0,
    status: 'published',
    images: [],
    tags: [],
    requirements: [],
    contactInfo: {
      phone: '',
      email: ''
    }
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        eventType: typeFilter !== 'all' ? typeFilter : undefined
      };
      
      if (activeTab === 'pending') {
        const response = await adminEventsApi.getEventsPendingApproval(params);
        setPendingEvents(response.events);
        setTotalPages(response.totalPages);
      } else {
        const response = await adminEventsApi.getAllEvents(params);
        setEvents(response.events);
        setTotalPages(response.totalPages);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEvents = async () => {
    try {
      const response = await adminEventsApi.getEventsPendingApproval();
      setPendingEvents(response.events);
    } catch (err: any) {
      console.error('Error fetching pending events:', err);
    }
  };

  const handleApproveEvent = async (eventId: string, notes?: string) => {
    try {
      await adminEventsApi.approveEvent(eventId, { notes });
      fetchEvents();
      fetchPendingEvents();
      setShowApprovalModal(false);
      resetApprovalModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId: string, reason: string, notes?: string) => {
    try {
      await adminEventsApi.rejectEvent(eventId, { reason, notes });
      fetchEvents();
      fetchPendingEvents();
      setShowApprovalModal(false);
      resetApprovalModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject event');
    }
  };

  const handleSuspendEvent = async (eventId: string, reason: string, notes?: string) => {
    try {
      await adminEventsApi.suspendEvent(eventId, { reason, notes });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend event');
    }
  };

  const openApprovalModal = (event: Event, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const resetApprovalModal = () => {
    setSelectedEvent(null);
    setApprovalAction(null);
    setApprovalNotes('');
    setRejectionReason('');
  };

  const handleApprovalSubmit = async () => {
    if (!selectedEvent || !approvalAction) return;

    if (approvalAction === 'approve') {
      await handleApproveEvent(selectedEvent._id, approvalNotes);
    } else {
      await handleRejectEvent(selectedEvent._id, rejectionReason, approvalNotes);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEvents();
      if (activeTab === 'all') {
        fetchPendingEvents();
      }
    }
  }, [user, currentPage, searchTerm, statusFilter, typeFilter, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert requirements array to string for backend compatibility
      const eventData = {
        ...formData,
        requirements: Array.isArray(formData.requirements) 
          ? formData.requirements.join(', ') 
          : formData.requirements
      };
      await eventsApi.createEvent(eventData);
      setShowCreateForm(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    try {
      // Convert requirements array to string for backend compatibility
      const eventData = {
        ...formData,
        requirements: Array.isArray(formData.requirements) 
          ? formData.requirements.join(', ') 
          : formData.requirements
      };
      await eventsApi.updateEvent(editingEvent._id, eventData);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventsApi.deleteEvent(eventId);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'farmers_market',
      location: {
        address: '',
        city: ''
      },
      dateTime: {
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
      },
      capacity: {
        maxAttendees: 50
      },
      registrationFee: 0,
      status: 'published',
      images: [],
      tags: [],
      requirements: [],
      contactInfo: {
        phone: '',
        email: ''
      }
    });
  };

  const startEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      location: event.location,
      dateTime: event.dateTime,
      capacity: { maxAttendees: event.capacity.maxAttendees },
      registrationFee: event.registrationFee,
      status: event.status,
      images: event.images,
      tags: event.tags,
      // Convert string requirements back to array for form editing
      requirements: Array.isArray(event.requirements) 
        ? event.requirements 
        : (event.requirements ? (event.requirements as string).split(', ').map((req: string) => req.trim()) : []),
      contactInfo: event.contactInfo
    });
    setShowCreateForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
              <p className="text-gray-600">Create and manage farmers market events</p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingEvent(null);
                resetForm();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'pending'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending Approval
                {pendingEvents.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {pendingEvents.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="farmers_market">Farmers Market</option>
              <option value="workshop">Workshop</option>
              <option value="festival">Festival</option>
              <option value="exhibition">Exhibition</option>
              <option value="conference">Conference</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === 'pending' ? pendingEvents : events).map((event) => (
                    <tr key={event._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                              {event.eventType.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                          {event.registrationFee > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-1">৳{event.registrationFee}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(event.dateTime.startDate)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {event.location.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {event.capacity.currentAttendees}/{event.capacity.maxAttendees}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {event.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/events/${event._id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Event"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {activeTab === 'pending' && event.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => openApprovalModal(event, 'approve')}
                                className="text-green-600 hover:text-green-800"
                                title="Approve Event"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openApprovalModal(event, 'reject')}
                                className="text-red-600 hover:text-red-800"
                                title="Reject Event"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(event)}
                                className="text-green-600 hover:text-green-800"
                                title="Edit Event"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {event.status === 'active' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter suspension reason:');
                                    if (reason) handleSuspendEvent(event._id, reason);
                                  }}
                                  className="text-orange-600 hover:text-orange-800"
                                  title="Suspend Event"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEvent(event._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Event"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {approvalAction === 'approve' ? 'Approve Event' : 'Reject Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetApprovalModal();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedEvent.description}</p>
                <div className="text-sm text-gray-500">
                  <p>Organizer: {selectedEvent.organizer.name}</p>
                  <p>Date: {formatDate(selectedEvent.dateTime.startDate)}</p>
                  <p>Location: {selectedEvent.location.city}</p>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="incomplete_information">Incomplete Information</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="duplicate_event">Duplicate Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`Add any ${approvalAction === 'approve' ? 'approval' : 'rejection'} notes...`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetApprovalModal();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={approvalAction === 'reject' && !rejectionReason}
                  className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalAction === 'approve' ? 'Approve Event' : 'Reject Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="farmers_market">Farmers Market</option>
                      <option value="workshop">Workshop</option>
                      <option value="festival">Festival</option>
                      <option value="exhibition">Exhibition</option>
                      <option value="conference">Conference</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={formData.location.address}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.dateTime.startDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateTime: { ...formData.dateTime, startDate: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      min={formData.dateTime.startDate || new Date().toISOString().split('T')[0]}
                      value={formData.dateTime.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateTime: { ...formData.dateTime, endDate: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.dateTime.startTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateTime: { ...formData.dateTime, startTime: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={formData.dateTime.endTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateTime: { ...formData.dateTime, endTime: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity.maxAttendees}
                      onChange={(e) => setFormData({
                        ...formData,
                        capacity: { maxAttendees: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData({ ...formData, registrationFee: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, phone: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, email: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;