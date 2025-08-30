import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';

interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

interface PaymentMethod {
  type: 'cash' | 'bkash' | 'nagad' | 'card';
  details?: string;
}

const CheckoutPage: React.FC = () => {
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: 'Dhaka',
    postalCode: '',
    instructions: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'cash'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deliveryFee = 50;
  const totalAmount = cartState.totalPrice + deliveryFee;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!deliveryAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!deliveryAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(deliveryAddress.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!deliveryAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!deliveryAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (paymentMethod.type !== 'cash' && !paymentMethod.details?.trim()) {
      newErrors.paymentDetails = 'Payment details are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cartState.items.map(item => ({
          productId: item._id,
          quantity: item.quantity
        })),
        deliveryAddress,
        paymentMethod: paymentMethod.type,
        paymentDetails: paymentMethod.type !== 'cash' ? {
          mobileNumber: paymentMethod.details
        } : {}
      };
      
      // Create order via API
      const response = await ordersApi.createOrder(orderData);
      
      // Clear cart on successful order
      clearCart();
      
      // Navigate to success page with order details
      navigate('/order-success', {
        state: {
          orderId: response.order.orderId,
          totalAmount: response.order.orderSummary.total,
          estimatedDelivery: new Date(response.order.estimatedDelivery).toLocaleDateString(),
          orderDetails: response.order
        }
      });
      
    } catch (error: any) {
      console.error('Order submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <CheckCircle className="mx-auto h-24 w-24 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some items to your cart before checkout</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-8">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Delivery Address</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.fullName}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="01XXXXXXXXX"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="House/Flat no, Road, Area"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <select
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barisal">Barisal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={deliveryAddress.postalCode}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1000"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  value={deliveryAddress.instructions}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Any special instructions for delivery"
                />
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Payment Method</h2>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod.type === 'cash'}
                  onChange={(e) => setPaymentMethod({ type: e.target.value as 'cash' })}
                  className="text-green-600"
                />
                <span className="font-medium">Cash on Delivery</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bkash"
                  checked={paymentMethod.type === 'bkash'}
                  onChange={(e) => setPaymentMethod({ type: e.target.value as 'bkash', details: '' })}
                  className="text-green-600"
                />
                <span className="font-medium">bKash</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="nagad"
                  checked={paymentMethod.type === 'nagad'}
                  onChange={(e) => setPaymentMethod({ type: e.target.value as 'nagad', details: '' })}
                  className="text-green-600"
                />
                <span className="font-medium">Nagad</span>
              </label>
            </div>
            
            {paymentMethod.type !== 'cash' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentMethod.type === 'bkash' ? 'bKash' : 'Nagad'} Number *
                </label>
                <input
                  type="tel"
                  value={paymentMethod.details || ''}
                  onChange={(e) => setPaymentMethod(prev => ({ ...prev, details: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.paymentDetails ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="01XXXXXXXXX"
                />
                {errors.paymentDetails && <p className="text-red-500 text-sm mt-1">{errors.paymentDetails}</p>}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            
            {/* Items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartState.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">{item.quantity} × ৳{item.price}</p>
                  </div>
                  <p className="font-medium">৳{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{cartState.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-800 border-t pt-2">
                <span>Total</span>
                <span>৳{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  <span>Place Order</span>
                </>
              )}
            </button>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">
                🔒 Your order is secure and will be delivered within 24 hours
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;