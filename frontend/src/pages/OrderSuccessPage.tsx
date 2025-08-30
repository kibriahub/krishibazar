import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Clock, Phone } from 'lucide-react';

interface LocationState {
  orderId: string;
  totalAmount: number;
}

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  
  const orderId = state?.orderId || `KB${Date.now()}`;
  const totalAmount = state?.totalAmount || 0;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for your order. We'll start preparing it right away.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold text-gray-800">{orderId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Estimated Delivery</p>
                <p className="font-semibold text-gray-800">
                  {estimatedDelivery.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total Amount</span>
              <span className="text-2xl font-bold text-green-600">৳{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-600 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Order Confirmed</p>
                <p className="text-sm text-gray-600">Your order has been received and confirmed</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-semibold text-gray-600">Preparing Order</p>
                <p className="text-sm text-gray-500">We're gathering your fresh produce</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-semibold text-gray-600">Out for Delivery</p>
                <p className="text-sm text-gray-500">Your order is on the way</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-semibold text-gray-600">Delivered</p>
                <p className="text-sm text-gray-500">Order delivered successfully</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Phone className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Need Help?</h3>
          </div>
          <p className="text-green-700 mb-2">
            If you have any questions about your order, please contact us:
          </p>
          <div className="space-y-1 text-green-700">
            <p>📞 Phone: +880 1234-567890</p>
            <p>📧 Email: support@krishibazar.com</p>
            <p>💬 WhatsApp: +880 1234-567890</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/products"
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 text-center font-semibold"
          >
            Continue Shopping
          </Link>
          <Link
            to="/profile"
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300 text-center font-semibold"
          >
            View Order History
          </Link>
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 What's Next?</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• You'll receive SMS updates about your order status</li>
            <li>• Our delivery partner will call you before delivery</li>
            <li>• Please keep your phone accessible for delivery coordination</li>
            <li>• You can track your order status in your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;