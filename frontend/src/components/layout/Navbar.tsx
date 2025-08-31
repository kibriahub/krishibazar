import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Package, Calendar, Settings, RefreshCw } from 'lucide-react';
import NotificationDropdown from '../NotificationDropdown';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { state } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-green-600 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">KrishiBazar</Link>
          </div>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-white hover:text-green-200 transition duration-300">Home</Link>
            <Link to="/products" className="text-white hover:text-green-200 transition duration-300">Products</Link>
            <Link to="/events" className="text-white hover:text-green-200 transition duration-300">Events</Link>
            {user && (
              <>
                <Link to="/orders" className="text-white hover:text-green-200 transition duration-300 flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
                <Link to="/my-events" className="text-white hover:text-green-200 transition duration-300 flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>My Events</span>
                </Link>

              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/events" className="text-white hover:text-green-200 transition duration-300 flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>Manage Events</span>
                </Link>

              </>
            )}
            <Link to="/about" className="text-white hover:text-green-200 transition duration-300">About</Link>
            <Link to="/contact" className="text-white hover:text-green-200 transition duration-300">Contact</Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="relative text-white hover:text-green-200 transition duration-300 p-2"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {state.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {state.totalItems > 99 ? '99+' : state.totalItems}
                </span>
              )}
            </Link>
            
            {/* Notifications - only show for authenticated users */}
            {isAuthenticated && user && (
              <NotificationDropdown className="text-white" />
            )}
            
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-green-200 transition duration-300"
                >
                  <span>{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    {user.role === 'consumer' && (
                      <>
                        <Link 
                          to="/consumer-dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link 
                          to="/my-reviews" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          My Reviews
                        </Link>

                      </>
                    )}
                    {(user.role === 'farmer' || user.role === 'vendor') && (
                      <>
                        <Link 
                          to="/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link 
                          to="/my-products" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          My Products
                        </Link>

                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <Link 
                          to="/admin" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Admin Panel
                        </Link>

                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-green-200 transition duration-300">Login</Link>
                <Link to="/register" className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-100 transition duration-300">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;