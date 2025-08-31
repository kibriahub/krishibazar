import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi, reviewsApi } from '../services/api';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, CreditCard, Phone, ArrowLeft, AlertTriangle, Star, MessageSquare } from 'lucide-react';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    category: string;
  };
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  seller: string;
  sellerType: string;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  paymentMethod: string;
  paymentDetails: {
    mobileNumber?: string;
    transactionId?: string;
    cardLast4?: string;
  };
  orderSummary: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  status: string;
  statusHistory: StatusHistoryItem[];
  estimatedDelivery: string;
  actualDelivery?: string;
  createdAt: string;
  notes?: string;
}

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<OrderItem | null>(null);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    reviewText: '',
    rating: 5,
    criteria: {
      quality: 5,
      freshness: 5,
      packaging: 5,
      value: 5
    }
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrderById(orderId!);
      setOrder(response.order);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    
    try {
      setCancelling(true);
      await ordersApi.cancelOrder(order.orderId, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      // Refresh order details
      await fetchOrderDetails();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing Order';
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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'mobile_banking':
        return 'Mobile Banking';
      case 'card':
        return 'Credit/Debit Card';
      default:
        return method;
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
  };

  const handleWriteReview = (item: OrderItem) => {
    setSelectedProductForReview(item);
    setReviewForm({
      title: '',
      reviewText: '',
      rating: 5,
      criteria: {
        quality: 5,
        freshness: 5,
        packaging: 5,
        value: 5
      }
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProductForReview) return;
    
    try {
      setSubmittingReview(true);
      
      const reviewData = {
        ...reviewForm,
        targetType: 'product' as const,
        targetId: selectedProductForReview.product._id
      };

      await reviewsApi.createReview(reviewData);
      setShowReviewModal(false);
      setSelectedProductForReview(null);
      
      // Show success message
      alert('Review submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested order could not be found.'}</p>
            <Link
              to="/orders"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="text-green-600 hover:text-green-700 flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
              <p className="mt-2 text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {getStatusIcon(order.status)}
              <span className="text-lg font-semibold text-gray-900">
                {getStatusText(order.status)}
              </span>
              {canCancelOrder(order.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
              <div className="space-y-4">
                {order.statusHistory.map((status, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(status.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getStatusText(status.status)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(status.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {status.note && (
                        <p className="text-sm text-gray-500 mt-1">{status.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × ৳{item.price}
                      </p>
                      <p className="text-sm text-gray-500">
                        Sold by: {item.seller} ({item.sellerType})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">৳{item.totalPrice}</p>
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleWriteReview(item)}
                          className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition duration-200 flex items-center space-x-1"
                        >
                          <Star className="h-4 w-4" />
                          <span>Write Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">৳{order.orderSummary.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">৳{order.orderSummary.deliveryFee}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">৳{order.orderSummary.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Delivery Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.deliveryAddress.fullName}</p>
                <p>{order.deliveryAddress.address}</p>
                <p>{order.deliveryAddress.city} - {order.deliveryAddress.postalCode}</p>
                <div className="flex items-center mt-2">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{order.deliveryAddress.phone}</span>
                </div>
                {order.deliveryAddress.instructions && (
                  <p className="mt-2 text-gray-500">
                    <strong>Instructions:</strong> {order.deliveryAddress.instructions}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Estimated Delivery:</strong><br />
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {order.actualDelivery && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Delivered On:</strong><br />
                    {new Date(order.actualDelivery).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Method
              </h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{getPaymentMethodText(order.paymentMethod)}</p>
                {order.paymentDetails.mobileNumber && (
                  <p className="mt-1">Mobile: {order.paymentDetails.mobileNumber}</p>
                )}
                {order.paymentDetails.transactionId && (
                  <p className="mt-1">Transaction ID: {order.paymentDetails.transactionId}</p>
                )}
                {order.paymentDetails.cardLast4 && (
                  <p className="mt-1">Card ending in: ****{order.paymentDetails.cardLast4}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (required)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide a reason for cancelling this order..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProductForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Write Review for {selectedProductForReview.productName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief title for your review"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${
                        star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review
                </label>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewText: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <select
                    value={reviewForm.criteria.quality}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, quality: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Freshness
                  </label>
                  <select
                    value={reviewForm.criteria.freshness}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, freshness: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packaging
                  </label>
                  <select
                    value={reviewForm.criteria.packaging}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, packaging: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <select
                    value={reviewForm.criteria.value}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, value: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedProductForReview(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || !reviewForm.title.trim() || !reviewForm.reviewText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;