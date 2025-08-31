import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MyEventsPage from './pages/MyEventsPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminOrdersPanel from './pages/AdminOrdersPanel';
import AdminProductManagement from './pages/AdminProductManagement';
import FarmerVendorProductManagement from './pages/FarmerVendorProductManagement';
import VendorDashboard from './pages/VendorDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';
import ReviewsPage from './pages/ReviewsPage';
import CustomerReviewsPage from './pages/CustomerReviewsPage';
import TestReviewPage from './pages/TestReviewPage';
import ProfilePage from './pages/ProfilePage';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';


// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Context
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './contexts/SocketContext';

// Toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <SocketProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/orders" element={<AdminOrdersPanel />} />
            <Route path="/admin/products" element={<AdminProductManagement />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/my-products" element={<FarmerVendorProductManagement />} />
            <Route path="/dashboard" element={<VendorDashboard />} />
            <Route path="/consumer-dashboard" element={<ConsumerDashboard />} />
            <Route path="/reviews/:targetType/:targetId" element={<ReviewsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/my-reviews" element={<CustomerReviewsPage />} />
            <Route path="/test-review" element={<TestReviewPage />} />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Routes>
          </main>
            <Footer />
           </div>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </CartProvider>
        </SocketProvider>
      </Router>
    );
  }

export default App;
