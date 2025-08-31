import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  DollarSign,
  Star,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface ConsumerDashboardData {
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    recent: Array<{
      _id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      items: Array<{
        product: {
          name: string;
          images: string[];
        };
        quantity: number;
      }>;
    }>;
  };
  spending: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  reviews: {
    given: number;
    averageRating: number;
    recent: Array<{
      _id: string;
      rating: number;
      comment: string;
      targetType: string;
      target: {
        name: string;
      };
      createdAt: string;
    }>;
  };
}

const ConsumerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<ConsumerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'consumer') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getConsumerDashboard();
      
      // Transform backend data to match frontend interface
      const backendData = response.data;
      const transformedData: ConsumerDashboardData = {
        orders: {
          total: backendData.orderStats?.totalOrders || 0,
          pending: backendData.orderStats?.pendingOrders || 0,
          completed: backendData.orderStats?.completedOrders || 0,
          cancelled: backendData.orderStats?.cancelledOrders || 0,
          recent: backendData.recentOrders?.map((order: any) => ({
            _id: order._id,
            orderNumber: order.orderId || order._id,
            status: order.status,
            totalAmount: order.orderSummary?.total || 0,
            createdAt: order.createdAt,
            items: order.items?.map((item: any) => ({
              product: {
                name: item.product?.name || 'Unknown Product',
                images: item.product?.images || []
              },
              quantity: item.quantity || 0
            })) || []
          })) || []
        },
        spending: {
          total: backendData.orderStats?.totalSpent || 0,
          thisMonth: backendData.monthlySpending?.[backendData.monthlySpending.length - 1]?.spending || 0,
          lastMonth: backendData.monthlySpending?.[backendData.monthlySpending.length - 2]?.spending || 0
        },
        reviews: {
          given: backendData.reviewStats?.totalReviews || 0,
          averageRating: backendData.reviewStats?.averageRatingGiven || 0,
          recent: backendData.reviewsGiven?.map((review: any) => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            targetType: review.reviewType,
            target: {
              name: review.targetId?.name || review.targetId?.businessName || 'Unknown'
            },
            createdAt: review.createdAt
          })) || []
        }
      };
      
      setDashboardData(transformedData);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (user?.role !== 'consumer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need consumer privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your shopping activity and order history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.orders?.total || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total Spending */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.spending?.total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Given */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews Given</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.reviews?.given || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Average Rating Given */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating Given</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.reviews?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <Link
                to="/orders"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {dashboardData?.orders?.recent && dashboardData.orders.recent.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.orders.recent.slice(0, 3).map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColor(order.status)
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No orders yet</p>
                  <Link
                    to="/products"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Reviews</h3>
              <Link
                to="/my-reviews"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {dashboardData?.reviews?.recent && dashboardData.reviews.recent.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.reviews.recent.slice(0, 3).map((review) => (
                    <div key={review._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {review.target.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No reviews given yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.orders?.pending || 0}
                </p>
                <p className="text-sm text-gray-600">Pending Orders</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.orders?.completed || 0}
                </p>
                <p className="text-sm text-gray-600">Completed Orders</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.spending?.thisMonth || 0)}
                </p>
                <p className="text-sm text-gray-600">This Month's Spending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;