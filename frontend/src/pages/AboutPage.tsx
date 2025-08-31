import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">About KrishiBazar</h1>
        <p className="text-xl text-gray-600">
          Connecting farmers and consumers directly for fresher produce and fair prices
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            KrishiBazar is dedicated to revolutionizing the agricultural marketplace by creating 
            a direct connection between farmers and consumers. We believe in empowering farmers 
            with fair prices for their produce while providing consumers with access to fresh, 
            high-quality agricultural products.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our platform eliminates unnecessary middlemen, ensuring that farmers receive better 
            compensation for their hard work while consumers enjoy competitive prices and 
            guaranteed freshness.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Vision</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We envision a future where technology bridges the gap between rural farmers and 
            urban consumers, creating a sustainable and transparent food supply chain that 
            benefits everyone involved.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Through our platform, we aim to support local agriculture, promote organic farming 
            practices, and contribute to food security in Bangladesh.
          </p>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Why Choose KrishiBazar?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Fresh & Organic</h3>
            <p className="text-gray-600 text-sm">
              Direct from farms to your table, ensuring maximum freshness and quality
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Fair Prices</h3>
            <p className="text-gray-600 text-sm">
              Competitive pricing that benefits both farmers and consumers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Direct Connection</h3>
            <p className="text-gray-600 text-sm">
              No middlemen - direct trade between farmers and consumers
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Founded in 2024, KrishiBazar emerged from a simple observation: farmers were struggling 
          to get fair prices for their produce while consumers were paying high prices for 
          sometimes stale products. Our team of passionate developers and agricultural enthusiasts 
          came together to create a solution that would benefit everyone in the supply chain.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;