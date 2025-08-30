import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../services/api';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  orderSummary: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  status: string;
  createdAt: string;
  estimatedDelivery: string;
  deliveryAddress: {
    fullName: string;
    address: string;
    city: string;
  };
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<OrdersResponse['pagination'] | null>(null);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      const response = await ordersApi.getUserOrders(page, 10);
      setOrders(response.orders);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchOrders(currentPage)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="mt-2 text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Link
              to="/products"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 inline-flex items-center"
            >
              <Package className="h-5 w-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <Link
                          to={`/orders/${order.orderId}`}
                          className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Items ({order.items.length})</h4>
                        <div className="space-y-3">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} {item.unit} × ৳{item.price}
                                </p>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                ৳{item.totalPrice}
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-600 mt-2">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">৳{order.orderSummary.subtotal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span className="text-gray-900">৳{order.orderSummary.deliveryFee}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-gray-900">Total</span>
                              <span className="text-gray-900">৳{order.orderSummary.total}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Delivery to:</strong><br />
                            {order.deliveryAddress.fullName}<br />
                            {order.deliveryAddress.address}, {order.deliveryAddress.city}
                          </p>
                          {order.estimatedDelivery && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Est. Delivery:</strong><br />
                              {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;