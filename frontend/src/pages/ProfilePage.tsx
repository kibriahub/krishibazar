import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, MapPin, Building, FileText, Star, Edit2, Save, X } from 'lucide-react';

interface EditableFields {
  name: string;
  phone: string;
  address: string;
  businessName?: string;
  businessDescription?: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, error, clearError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableFields>({
    name: '',
    phone: '',
    address: '',
    businessName: '',
    businessDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        businessName: user.businessName || '',
        businessDescription: user.businessDescription || ''
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        businessName: user.businessName || '',
        businessDescription: user.businessDescription || ''
      });
    }
    setMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    setSuccessMessage('');
    if (clearError) clearError();

    // Validate phone number
    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(editData.phone)) {
      setMessage({ type: 'error', text: 'Phone number must be 11 digits starting with 01' });
      setLoading(false);
      return;
    }

    try {
      await updateProfile(editData);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'farmer': return 'bg-green-100 text-green-800';
      case 'vendor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  {user.averageRating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {user.averageRating.toFixed(1)} ({user.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-md bg-green-100 text-green-700">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {(error || message) && (
          <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700">
            {error || message?.text}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              {/* Name */}
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900">{user.name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone}
                      onChange={handleInputChange}
                      placeholder="01XXXXXXXXX"
                      pattern="^01[0-9]{9}$"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={editData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">{user.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information (for farmers and vendors) */}
            {(user.role === 'farmer' || user.role === 'vendor') && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                
                {/* Business Name */}
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="businessName"
                        value={editData.businessName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.businessName || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* Business Description */}
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                    {isEditing ? (
                      <textarea
                        name="businessDescription"
                        value={editData.businessDescription}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Describe your business..."
                      />
                    ) : (
                      <p className="text-gray-900">{user.businessDescription || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-300"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Account Statistics (for farmers and vendors) */}
        {(user.role === 'farmer' || user.role === 'vendor') && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.totalReviews || 0}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {user.averageRating ? user.averageRating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {user.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;