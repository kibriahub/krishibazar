import React from 'react';
import { Users, Target, Heart, Award } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About KrishiBazar</h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
            Bridging the gap between farmers and consumers for a sustainable agricultural future
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              KrishiBazar is dedicated to revolutionizing Bangladesh's agricultural marketplace by creating 
              direct connections between farmers and consumers. We believe in fair pricing, fresh produce, 
              and sustainable farming practices that benefit everyone in the supply chain.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our platform empowers farmers to reach customers directly, eliminating middlemen and ensuring 
              better profits for producers while providing consumers with the freshest, most affordable 
              agricultural products available.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sustainability</h3>
              <p className="text-gray-600">
                Promoting eco-friendly farming practices and sustainable agricultural methods.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Community</h3>
              <p className="text-gray-600">
                Building strong relationships between farmers, vendors, and consumers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Transparency</h3>
              <p className="text-gray-600">
                Ensuring fair pricing and honest communication throughout the supply chain.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality</h3>
              <p className="text-gray-600">
                Committed to delivering the highest quality fresh produce to our customers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Our Story</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Founded in 2024, KrishiBazar emerged from a simple observation: farmers in Bangladesh 
                  were struggling to get fair prices for their produce, while consumers were paying high 
                  prices for products that weren't always fresh.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Our founders, passionate about agriculture and technology, decided to create a platform 
                  that would eliminate unnecessary intermediaries and create direct relationships between 
                  producers and consumers.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Today, KrishiBazar serves hundreds of farmers and thousands of customers across Bangladesh, 
                  facilitating fair trade and promoting sustainable agricultural practices.
                </p>
              </div>
              <div className="bg-green-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Impact by Numbers</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Farmers</span>
                    <span className="text-2xl font-bold text-green-600">500+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Happy Customers</span>
                    <span className="text-2xl font-bold text-green-600">2,000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Products Sold</span>
                    <span className="text-2xl font-bold text-green-600">10,000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Districts Covered</span>
                    <span className="text-2xl font-bold text-green-600">25+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Meet Our Team</h2>
          <div className="flex justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-green-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-800">M</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">M</h3>
              <p className="text-green-600 mb-2">CEO</p>
              <p className="text-gray-600 text-sm">
                Leading KrishiBazar with a vision to connect farmers directly with consumers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Whether you're a farmer looking to reach more customers or a consumer seeking fresh, 
            affordable produce, KrishiBazar is here to serve you.
          </p>
          <div className="space-x-4">
            <a 
              href="/register" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition duration-300 inline-block"
            >
              Join as Farmer
            </a>
            <a 
              href="/products" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition duration-300 inline-block"
            >
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;