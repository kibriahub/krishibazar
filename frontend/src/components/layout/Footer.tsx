import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-green-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">KrishiBazar</h3>
            <p className="text-green-200">
              Connecting farmers and consumers directly for fresher produce and fair prices.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-green-200 hover:text-white transition duration-300">Home</Link></li>
              <li><Link to="/products" className="text-green-200 hover:text-white transition duration-300">Products</Link></li>
              <li><Link to="/about" className="text-green-200 hover:text-white transition duration-300">About Us</Link></li>
              <li><Link to="/contact" className="text-green-200 hover:text-white transition duration-300">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">For Farmers</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-green-200 hover:text-white transition duration-300">Join as Farmer</Link></li>
              <li><Link to="/sell" className="text-green-200 hover:text-white transition duration-300">Sell Products</Link></li>
              <li><Link to="/pricing" className="text-green-200 hover:text-white transition duration-300">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-green-200">
              <p>Email: info@krishibazar.com</p>
              <p>Phone: +880 1234 567890</p>
              <p>Address: Dhaka, Bangladesh</p>
            </address>
          </div>
        </div>
        <div className="border-t border-green-700 mt-8 pt-6 text-center text-green-300">
          <p>&copy; {new Date().getFullYear()} KrishiBazar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;