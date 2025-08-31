import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  Package,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  UserCheck,
  MessageSquare,
  Calendar,
  Settings
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    pendingVendors: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  reviews: {
    total: number;
    pending: number;
    flagged: number;
    averageRating: number;
  };
  events: {
    total: number;
    upcoming: number;
    active: number;
  };
}

interface RecentActivity {
  _id: string;
  type: 'user_registration' | 'vendor_application' | 'order_placed' | 'review_flagged' | 'product_added';
  description: string;
  user?: {
    name: string;
    email: string;
  };
  timestamp: string;
  status?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls for dashboard data
      // const [statsResponse, activityResponse] = await Promise.all([
      //   fetch('/api/v1/admin/stats'),
      //   fetch('/api/v1/admin/activity')
      // ]);
      
      // Mock data for now
      setStats({
        users: {
          total: 1250,
          active: 980,
          newThisMonth: 45,
          pendingVendors: 12
        },
        orders: {
          total: 3420,
          pending: 23,
          completed: 3180,
          revenue: 125000
        },
        products: {
          total: 890,
          active: 820,
          lowStock: 15,
          outOfStock: 8
        },
        reviews: {
          total: 2150,
          pending: 8,
          flagged: 3,
          averageRating: 4.2
        },
        events: {
          total: 45,
          upcoming: 8,
          active: 12
        }
      });

      setRecentActivity([
        {
          _id: '1',
          type: 'vendor_application',
          description: 'New vendor application submitted',
          user: { name: 'John Farmer', email: 'john@example.com' },
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'pending'
        },
        {
          _id: '2',
          type: 'review_flagged',
          description: 'Review flagged for inappropriate content',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'flagged'
        },
        {
          _id: '3',
          type: 'order_placed',
          description: 'High-value order placed',
          user: { name: 'Sarah Customer', email: 'sarah@example.com' },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        }
      ]);
      
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'vendor_application':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'order_placed':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'review_flagged':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'product_added':
        return <Package className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Platform overview and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users.total.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{stats?.users.newThisMonth} this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-gray-500">Active: {stats?.users.active}</span>
              <span className="text-orange-600">Pending Vendors: {stats?.users.pendingVendors}</span>
            </div>
          </div>

          {/* Orders Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.orders.total.toLocaleString()}</p>
                <p className="text-sm text-green-600">৳{stats?.orders.revenue.toLocaleString()} revenue</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-gray-500">Completed: {stats?.orders.completed}</span>
              <span className="text-orange-600">Pending: {stats?.orders.pending}</span>
            </div>
          </div>

          {/* Products Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.products.total.toLocaleString()}</p>
                <p className="text-sm text-green-600">{stats?.products.active} active</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-orange-600">Low Stock: {stats?.products.lowStock}</span>
              <span className="text-red-600">Out of Stock: {stats?.products.outOfStock}</span>
            </div>
          </div>

          {/* Reviews Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.reviews.total.toLocaleString()}</p>
                <p className="text-sm text-green-600">★ {stats?.reviews.averageRating} avg rating</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-orange-600">Pending: {stats?.reviews.pending}</span>
              <span className="text-red-600">Flagged: {stats?.reviews.flagged}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Approve Vendors</span>
                  {stats?.users.pendingVendors && stats.users.pendingVendors > 0 && (
                    <span className="block text-xs text-orange-600 mt-1">{stats.users.pendingVendors} pending</span>
                  )}
                </Link>
                <Link to="/admin/orders" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <ShoppingCart className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Manage Orders</span>
                  {stats?.orders.pending && stats.orders.pending > 0 && (
                    <span className="block text-xs text-orange-600 mt-1">{stats.orders.pending} pending</span>
                  )}
                </Link>
                <Link to="/admin/products" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Manage Products</span>
                  {stats?.products.lowStock && stats.products.lowStock > 0 && (
                    <span className="block text-xs text-orange-600 mt-1">{stats.products.lowStock} low stock</span>
                  )}
                </Link>
                <Link to="/admin/events" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <Calendar className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Manage Events</span>
                  {stats?.events && (
                    <span className="block text-xs text-blue-600 mt-1">{stats.events.upcoming} upcoming</span>
                  )}
                </Link>
                <Link to="/admin/reports" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <BarChart3 className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">View Reports</span>
                  <span className="block text-xs text-gray-600 mt-1">Analytics</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Service</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600">Delayed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  {activity.user && (
                    <p className="text-xs text-gray-500">{activity.user.name} ({activity.user.email})</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </div>
                {activity.status && (
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'flagged' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;