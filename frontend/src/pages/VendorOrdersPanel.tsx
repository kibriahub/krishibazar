import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';
import { Package, Clock, CheckCircle, DollarSign, Eye, Calendar } from 'lucide-react';

interface Order {
  _id: string;
  orderId: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  orderSummary: {
    total: number;
  };
  status: string;
  paymentMethod: string;
  paymentDetails: {
    paymentStatus: string;
    codApproval?: {
      vendorApproved: boolean;
      adminApproved: boolean;
      vendorApprovedAt?: string;
      adminApprovedAt?: string;
    };
  };
  createdAt: string;
  estimatedDelivery: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
  };
}

const VendorOrdersPanel: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [codPendingOrders, setCodPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'cod-pending'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchCODPendingOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getUserOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCODPendingOrders = async () => {
    try {
      const response = await ordersApi.getCODOrdersPendingApproval();
      setCodPendingOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching COD pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCODPayment = async (orderId: string) => {
    setApproving(orderId);
    try {
      await ordersApi.approveVendorCODPayment(orderId);
      // Refresh both lists
      await fetchOrders();
      await fetchCODPendingOrders();
      alert('COD payment approved successfully! Awaiting admin approval.');
    } catch (error: any) {
      console.error('Error approving COD payment:', error);
      alert(error.response?.data?.message || 'Failed to approve COD payment');
    } finally {
      setApproving(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      packed: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Orders Management</h1>
        <p className="text-gray-600">Manage your orders and approve COD payments</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>All Orders ({orders.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cod-pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cod-pending'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>COD Pending Approval ({codPendingOrders.length})</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {activeTab === 'all' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">You haven't received any orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderId}</h3>
                      <p className="text-sm text-gray-600">Customer: {order.user.name}</p>
                      <p className="text-sm text-gray-600">Phone: {order.user.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-lg font-bold text-green-600 mt-1">৳{order.orderSummary.total}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            {item.productName} × {item.quantity}
                          </p>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Method: {order.paymentMethod.replace('_', ' ').toUpperCase()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentDetails.paymentStatus)}`}>
                        {order.paymentDetails.paymentStatus.toUpperCase()}
                      </span>
                      {order.paymentMethod === 'cash_on_delivery' && order.paymentDetails.codApproval && (
                        <div className="mt-2 text-xs">
                          <p className={`${order.paymentDetails.codApproval.vendorApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                            Vendor: {order.paymentDetails.codApproval.vendorApproved ? '✓ Approved' : '⏳ Pending'}
                          </p>
                          <p className={`${order.paymentDetails.codApproval.adminApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                            Admin: {order.paymentDetails.codApproval.adminApproved ? '✓ Approved' : '⏳ Pending'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cod-pending' && (
          <div>
            {codPendingOrders.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No COD payments pending</h3>
                <p className="text-gray-500">All COD payments have been processed or no COD orders are ready for approval.</p>
              </div>
            ) : (
              codPendingOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderId}</h3>
                      <p className="text-sm text-gray-600">Customer: {order.user.name}</p>
                      <p className="text-sm text-gray-600">Phone: {order.user.phone}</p>
                      <p className="text-sm text-yellow-600 font-medium mt-1">⚠️ COD Payment Approval Required</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">৳{order.orderSummary.total}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                        DELIVERED
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                    <p className="text-sm text-gray-600">
                      {order.deliveryAddress.fullName}<br />
                      {order.deliveryAddress.address}<br />
                      {order.deliveryAddress.city}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.productName} × {item.quantity}</span>
                          <span>৳{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => handleApproveCODPayment(order.orderId)}
                      disabled={approving === order.orderId}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {approving === order.orderId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve COD Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{selectedOrder.orderId}</h3>
                  <p className="text-gray-600">Status: {selectedOrder.status}</p>
                  <p className="text-gray-600">Total: ৳{selectedOrder.orderSummary.total}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-gray-600">{selectedOrder.user.name}</p>
                  <p className="text-gray-600">{selectedOrder.user.email}</p>
                  <p className="text-gray-600">{selectedOrder.user.phone}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <p className="text-gray-600">
                    {selectedOrder.deliveryAddress.fullName}<br />
                    {selectedOrder.deliveryAddress.address}<br />
                    {selectedOrder.deliveryAddress.city}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Price: ৳{item.price}</p>
                        </div>
                        <p className="font-medium">৳{item.totalPrice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrdersPanel;