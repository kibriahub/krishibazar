import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Shield,
  Store,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'consumer' | 'farmer' | 'vendor' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  profile?: {
    address?: string;
    city?: string;
    avatar?: string;
  };
  vendorInfo?: {
    businessName: string;
    businessType: string;
    documents: Array<{
      type: string;
      url: string;
      status: 'pending' | 'approved' | 'rejected';
    }>;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
  stats?: {
    totalOrders?: number;
    totalProducts?: number;
    averageRating?: number;
    totalRevenue?: number;
  };
}

interface UserFilters {
  role: string;
  status: string;
  verified: string;
  search: string;
}

const AdminUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'consumer' as 'consumer' | 'farmer' | 'vendor' | 'admin'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    verified: 'all',
    search: ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const response = await fetch('/api/v1/admin/users', {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // Mock data for now
      const mockUsers: User[] = [
        {
          _id: '1',
          name: 'John Farmer',
          email: 'john@farmer.com',
          phone: '+8801234567890',
          role: 'farmer',
          status: 'active',
          isVerified: true,
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-01-20T14:20:00Z',
          profile: {
            address: '123 Farm Road',
            city: 'Dhaka'
          },
          stats: {
            totalProducts: 25,
            averageRating: 4.5,
            totalRevenue: 15000
          }
        },
        {
          _id: '2',
          name: 'Sarah Vendor',
          email: 'sarah@vendor.com',
          phone: '+8801234567891',
          role: 'vendor',
          status: 'pending',
          isVerified: false,
          createdAt: '2024-01-18T09:15:00Z',
          vendorInfo: {
            businessName: 'Fresh Produce Co.',
            businessType: 'Wholesale',
            documents: [
              {
                type: 'business_license',
                url: '/documents/license.pdf',
                status: 'pending'
              },
              {
                type: 'tax_certificate',
                url: '/documents/tax.pdf',
                status: 'pending'
              }
            ],
            approvalStatus: 'pending'
          }
        },
        {
          _id: '3',
          name: 'Mike Consumer',
          email: 'mike@consumer.com',
          role: 'consumer',
          status: 'active',
          isVerified: true,
          createdAt: '2024-01-10T16:45:00Z',
          lastLogin: '2024-01-21T11:30:00Z',
          stats: {
            totalOrders: 12
          }
        },
        {
          _id: '4',
          name: 'Lisa Suspended',
          email: 'lisa@example.com',
          role: 'consumer',
          status: 'suspended',
          isVerified: true,
          createdAt: '2024-01-05T12:00:00Z',
          lastLogin: '2024-01-15T08:20:00Z'
        }
      ];
      
      setUsers(mockUsers);
      setTotalPages(1);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      // TODO: Implement API call
      // const response = await fetch(`/api/v1/admin/users/${editingUser._id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(editForm)
      // });
      
      // Update local state for demo
      setUsers(prev => prev.map(u => 
        u._id === editingUser._id 
          ? { ...u, ...editForm }
          : u
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      setError('Failed to update user');
    }
  };

  const handlePasswordReset = async (userId: string) => {
    try {
      // TODO: Implement API call
      // const response = await fetch(`/api/v1/admin/users/${userId}/reset-password`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      alert('Password reset email sent successfully!');
      setShowPasswordResetModal(false);
    } catch (err: any) {
      setError('Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      // TODO: Implement API call
      // const response = await fetch(`/api/v1/admin/users/${userId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // Update local state for demo
      setUsers(prev => prev.filter(u => u._id !== userId));
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError('Failed to delete user');
    }
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      // TODO: Implement API calls for user actions
      console.log(`${action} user ${userId}`, data);
      
      // Update local state for demo
      setUsers(prev => prev.map(u => {
        if (u._id === userId) {
          switch (action) {
            case 'approve_vendor':
              return {
                ...u,
                status: 'active',
                vendorInfo: {
                  ...u.vendorInfo!,
                  approvalStatus: 'approved',
                  approvedBy: user?._id,
                  approvedAt: new Date().toISOString()
                }
              };
            case 'reject_vendor':
              return {
                ...u,
                status: 'inactive',
                vendorInfo: {
                  ...u.vendorInfo!,
                  approvalStatus: 'rejected',
                  rejectionReason: data.reason
                }
              };
            case 'suspend':
              return { ...u, status: 'suspended' };
            case 'activate':
              return { ...u, status: 'active' };
            case 'update_role':
              return { ...u, role: data.role };
            default:
              return u;
          }
        }
        return u;
      }));
      
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(`Failed to ${action} user`);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-800',
      vendor: 'bg-purple-100 text-purple-800',
      farmer: 'bg-green-100 text-green-800',
      consumer: 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    if (filters.role !== 'all' && user.role !== filters.role) return false;
    if (filters.status !== 'all' && user.status !== filters.status) return false;
    if (filters.verified !== 'all') {
      const isVerified = filters.verified === 'true';
      if (user.isVerified !== isVerified) return false;
    }
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts, roles, and vendor approvals</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredUsers.length} of {users.length} users
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="consumer">Consumer</option>
              <option value="farmer">Farmer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <button
              onClick={() => setFilters({ role: 'all', status: 'all', verified: 'all', search: '' })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="flex items-center mt-1">
                              {user.isVerified ? (
                                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500 mr-1" />
                              )}
                              <span className="text-xs text-gray-500">
                                {user.isVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role.toUpperCase()}
                          </span>
                          <div className="flex items-center">
                            {getStatusIcon(user.status)}
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.phone && (
                            <div className="flex items-center mb-1">
                              <Phone className="h-3 w-3 text-gray-400 mr-1" />
                              {user.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 text-gray-400 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                            Joined: {formatDate(user.createdAt)}
                          </div>
                          {user.lastLogin && (
                            <div className="text-xs text-gray-500">
                              Last login: {formatDate(user.lastLogin)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.stats?.totalOrders && (
                            <div className="text-xs text-gray-600">Orders: {user.stats.totalOrders}</div>
                          )}
                          {user.stats?.totalProducts && (
                            <div className="text-xs text-gray-600">Products: {user.stats.totalProducts}</div>
                          )}
                          {user.stats?.averageRating && (
                            <div className="text-xs text-gray-600">Rating: ★ {user.stats.averageRating}</div>
                          )}
                          {user.stats?.totalRevenue && (
                            <div className="text-xs text-gray-600">Revenue: ৳{user.stats.totalRevenue.toLocaleString()}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPasswordResetModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-800"
                            title="Reset Password"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {user.role === 'vendor' && user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUserAction(user._id, 'approve_vendor')}
                                className="text-green-600 hover:text-green-800"
                                title="Approve Vendor"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) {
                                    handleUserAction(user._id, 'reject_vendor', { reason });
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Reject Vendor"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleUserAction(user._id, 'suspend')}
                              className="text-red-600 hover:text-red-800"
                              title="Suspend User"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {user.status === 'suspended' && (
                            <button
                              onClick={() => handleUserAction(user._id, 'activate')}
                              className="text-green-600 hover:text-green-800"
                              title="Activate User"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor Info */}
                {selectedUser.vendorInfo && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendor Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Name</label>
                        <p className="text-sm text-gray-900">{selectedUser.vendorInfo.businessName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Type</label>
                        <p className="text-sm text-gray-900">{selectedUser.vendorInfo.businessType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedUser.vendorInfo.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedUser.vendorInfo.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedUser.vendorInfo.approvalStatus.toUpperCase()}
                        </span>
                      </div>
                      {selectedUser.vendorInfo.documents && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                          <div className="space-y-2">
                            {selectedUser.vendorInfo.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                                <span className="text-sm text-gray-900">{doc.type.replace('_', ' ').toUpperCase()}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {doc.status.toUpperCase()}
                                  </span>
                                  <button className="text-blue-600 hover:text-blue-800 text-xs">
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedUser.role === 'vendor' && selectedUser.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUserAction(selectedUser._id, 'approve_vendor')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Approve Vendor
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            handleUserAction(selectedUser._id, 'reject_vendor', { reason });
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                      >
                        Reject Vendor
                      </button>
                    </>
                  )}
                  {selectedUser.status === 'active' && (
                    <button
                      onClick={() => handleUserAction(selectedUser._id, 'suspend')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                    >
                      Suspend User
                    </button>
                  )}
                  {selectedUser.status === 'suspended' && (
                    <button
                      onClick={() => handleUserAction(selectedUser._id, 'activate')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      Activate User
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'consumer' | 'farmer' | 'vendor' | 'admin' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="consumer">Consumer</option>
                    <option value="farmer">Farmer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to reset the password for <strong>{selectedUser.name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  A password reset email will be sent to <strong>{selectedUser.email}</strong>.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePasswordReset(selectedUser._id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;