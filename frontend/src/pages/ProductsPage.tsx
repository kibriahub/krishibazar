import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../services/api';

// Define Product interface
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  seller: any; // In a real app, this would be a reference to a User
  sellerType: string;
  location: string;
  category: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  averageRating?: number;
  quantity: number;
  images: string[];
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    organic: false,
    seasonal: false,
    minPrice: '',
    maxPrice: '',
  });

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getProducts();
        setProducts(response.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        // Use mock data as fallback if API fails
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFilters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Filter products based on current filters
  const filteredProducts = products.filter(product => {
    // Filter by category
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    
    // Filter by organic
    if (filters.organic && !product.isOrganic) {
      return false;
    }
    
    // Filter by seasonal
    if (filters.seasonal && !product.isSeasonal) {
      return false;
    }
    
    // Filter by price range
    if (filters.minPrice && product.price < parseInt(filters.minPrice)) {
      return false;
    }
    
    if (filters.maxPrice && product.price > parseInt(filters.maxPrice)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-8">Browse Products</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Organic filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="organic"
              name="organic"
              checked={filters.organic}
              onChange={handleFilterChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="organic" className="ml-2 block text-sm text-gray-700">Organic Only</label>
          </div>
          
          {/* Seasonal filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="seasonal"
              name="seasonal"
              checked={filters.seasonal}
              onChange={handleFilterChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="seasonal" className="ml-2 block text-sm text-gray-700">Seasonal Only</label>
          </div>
          
          {/* Price range filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (৳)</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (৳)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              min="0"
            />
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      )}
      
      {/* Product grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <Link to={`/products/${product._id}`}>
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5000${product.images[0]}`}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/no-photo.jpg';
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">No Image Available</span>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">৳{product.price}/{product.unit}</span>
                    {product.averageRating && (
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm">{product.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 flex justify-between">
                    <span>{product.sellerType === 'farmer' ? 'Farmer' : 'Vendor'}</span>
                    <span>{product.location}</span>
                  </div>
                  
                  <div className="mt-2 flex space-x-1">
                    {product.isOrganic && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Organic</span>
                    )}
                    {product.isSeasonal && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Seasonal</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products match your filters. Try adjusting your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;