import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="What is this about?"
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
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-8">
                  Have questions about our platform, need support, or want to partner with us? 
                  We're here to help! Reach out through any of the channels below.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Email Us</h3>
                    <p className="text-gray-600 mb-2">Send us an email anytime</p>
                    <a href="mailto:info@krishibazar.com" className="text-green-600 hover:text-green-700">
                      info@krishibazar.com
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Call Us</h3>
                    <p className="text-gray-600 mb-2">Sun-Thu from 9am to 6pm</p>
                    <a href="tel:+8801234567890" className="text-green-600 hover:text-green-700">
                      +880 1234 567890
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Visit Us</h3>
                    <p className="text-gray-600 mb-2">Come say hello at our office</p>
                    <address className="text-green-600 not-italic">

                      Dhanmondi, Dhaka 1205<br />
                      Bangladesh
                    </address>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Business Hours</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>Sunday - Thursday: 9:00 AM - 6:00 PM</p>
                      <p>Friday: 10:00 AM - 4:00 PM</p>
                      <p>Saturday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How do I become a seller on KrishiBazar?
              </h3>
              <p className="text-gray-600">
                Simply register as a farmer or vendor on our platform. After verification, you can start 
                listing your products and reach customers directly.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept various payment methods including mobile banking (bKash, Nagad), credit/debit cards, 
                and cash on delivery for your convenience.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How do you ensure product quality?
              </h3>
              <p className="text-gray-600">
                We work closely with our farmers and vendors to maintain quality standards. We also have 
                a review system where customers can rate and review products.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                What areas do you deliver to?
              </h3>
              <p className="text-gray-600">
                Currently, we deliver to major cities across Bangladesh including Dhaka, Chittagong, 
                Sylhet, and Rajshahi. We're expanding to more areas regularly.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How can I track my order?
              </h3>
              <p className="text-gray-600">
                Once your order is confirmed, you'll receive tracking information via SMS and email. 
                You can also check your order status in your account dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Need Immediate Help?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our customer support team is available to assist you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+8801234567890" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300 inline-flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Support
            </a>
            <a 
              href="mailto:support@krishibazar.com" 
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition duration-300 inline-flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;