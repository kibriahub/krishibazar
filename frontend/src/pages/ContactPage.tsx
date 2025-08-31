import React, { useState } from 'react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');

    try {
      const response = await fetch('http://localhost:5000/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(result.message);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitError(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitError('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600">
          We'd love to hear from you. Get in touch with us!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">📍</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Address</h3>
                <p className="text-gray-600">
                  Dhaka 1000, Bangladesh
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">📞</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Phone</h3>
                <p className="text-gray-600">+880 1234 567890</p>
                <p className="text-gray-600">+880 9876 543210</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">✉️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Email</h3>
                <p className="text-gray-600">info@krishibazar.com</p>
                <p className="text-gray-600">support@krishibazar.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">🕒</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Business Hours</h3>
                <p className="text-gray-600">
                  Sunday - Thursday: 9:00 AM - 6:00 PM<br />
                  Friday: 9:00 AM - 4:00 PM<br />
                  Saturday: Closed
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition duration-300">
                📘 Facebook
              </a>
              <a href="#" className="bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500 transition duration-300">
                🐦 Twitter
              </a>
              <a href="#" className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition duration-300">
                📷 Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send us a Message</h2>
          
          {submitMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {submitMessage}
            </div>
          )}
          {submitError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter the subject"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your message"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">How do I become a seller on KrishiBazar?</h3>
            <p className="text-gray-600 text-sm">
              Simply register as a farmer or vendor on our platform. After verification, 
              you can start listing your products and reach customers directly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-sm">
              We accept various payment methods including mobile banking (bKash, Nagad), 
              credit/debit cards, and cash on delivery.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">How do you ensure product quality?</h3>
            <p className="text-gray-600 text-sm">
              We work directly with verified farmers and vendors. Our rating system 
              helps maintain quality standards through customer feedback.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Do you offer delivery services?</h3>
            <p className="text-gray-600 text-sm">
              Yes, we provide delivery services in major cities. Delivery times and 
              charges vary based on location and product type.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;