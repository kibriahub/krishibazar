import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface VendorDashboardData {
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    recent: Array<{
      _id: string;
      rating: number;
      comment: string;
      reviewer: { name: string };
      createdAt: string;
    }>;
  };
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
  }>;
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('month');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        dashboardApi.getVendorDashboard(),
        dashboardApi.getVendorAnalytics(analyticsPeriod)
      ]);
      
      // Transform backend data to match frontend interface
      const backendData = dashboardResponse.data;
      const transformedData: VendorDashboardData = {
        orders: {
          total: backendData.orderStats?.totalOrders || 0,
          pending: backendData.orderStats?.pendingOrders || 0,
          completed: backendData.orderStats?.completedOrders || 0,
          cancelled: 0 // Backend doesn't provide cancelled orders for vendor
        },
        revenue: {
          total: backendData.orderStats?.totalRevenue || 0,
          thisMonth: backendData.monthlyEarnings?.[backendData.monthlyEarnings.length - 1]?.earnings || 0,
          lastMonth: backendData.monthlyEarnings?.[backendData.monthlyEarnings.length - 2]?.earnings || 0,
          growth: 0 // Calculate growth if needed
        },
        products: {
          total: backendData.productStats?.totalProducts || 0,
          active: backendData.productStats?.activeProducts || 0,
          lowStock: backendData.productStats?.lowStockProducts || 0
        },
        reviews: {
          total: backendData.ratingSummary?.totalReviews || 0,
          averageRating: backendData.ratingSummary?.averageRating || 0,
          recent: backendData.recentReviews?.map((review: any) => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            reviewer: { name: review.user?.name || 'Anonymous' },
            createdAt: review.createdAt
          })) || []
        },
        monthlyEarnings: backendData.monthlyEarnings?.map((item: any) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          earnings: item.earnings
        })) || []
      };
      
      setDashboardData(transformedData);
      setAnalyticsData(analyticsResponse.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [analyticsPeriod]);

  useEffect(() => {
    if (user && (user.role === 'farmer' || user.role === 'vendor')) {
      fetchDashboardData();
    }
  }, [user, analyticsPeriod, fetchDashboardData]);

  const fetchAnalytics = async (period: string) => {
    try {
      const response = await dashboardApi.getVendorAnalytics(period);
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error('Analytics error:', err);
    }
  };

  const handlePeriodChange = (period: string) => {
    setAnalyticsPeriod(period);
    fetchAnalytics(period);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  if (user?.role !== 'farmer' && user?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need farmer or vendor privileges to access this dashboard.</p>
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's an overview of your {user?.role} business performance
            </p>
          </div>
          <button
            onClick={() => navigate('/my-products')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Package className="h-5 w-5" />
            My Products
          </button>
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

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.revenue?.total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.products?.active || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.reviews?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Sales Analytics</h3>
            <div className="flex space-x-2">
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    analyticsPeriod === period
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  {analyticsData.revenueGrowth && (
                    <p className={`text-xs mt-1 ${
                      analyticsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.revenueGrowth >= 0 ? '+' : ''}{analyticsData.revenueGrowth.toFixed(1)}% from last period
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.totalOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  {analyticsData.orderGrowth && (
                    <p className={`text-xs mt-1 ${
                      analyticsData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.orderGrowth >= 0 ? '+' : ''}{analyticsData.orderGrowth.toFixed(1)}% from last period
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.averageOrderValue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Loading analytics...</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Pending</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dashboardData?.orders?.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Completed</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dashboardData?.orders?.completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Cancelled</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dashboardData?.orders?.cancelled || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Reviews</h3>
            </div>
            <div className="p-6">
              {/* Rating Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(dashboardData?.reviews?.averageRating || 0) ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {dashboardData?.reviews?.averageRating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({dashboardData?.reviews?.total || 0} reviews)
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Overall Rating</p>
                  </div>
                </div>
              </div>
              
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
                            {review.reviewer.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Monthly Earnings</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Earnings chart will be implemented here</p>
              <p className="text-xs text-gray-400 mt-2">
                This Month: {formatCurrency(dashboardData?.revenue?.thisMonth || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        {analyticsData?.topProducts && analyticsData.topProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {product.totalSold} sold
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;