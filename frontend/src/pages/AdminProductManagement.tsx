import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminProductsApi } from '../services/api';
import './AdminProductManagement.css';
import {
  Package,
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  Eye,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  sellerType: 'farmer' | 'vendor';
  location: string;
  category: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  quantity: number;
  averageRating?: number;
  totalReviews?: number;
  images: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  harvestDate?: string;
  expiryDate?: string;
}

interface ProductFilters {
  category: string;
  sellerType: string;
  status: string;
  organic: string;
  seasonal: string;
  search: string;
}

const AdminProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    sellerType: 'all',
    status: 'all',
    organic: 'all',
    seasonal: 'all',
    search: ''
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    unit: '',
    category: 'Vegetables',
    location: '',
    quantity: 0,
    isOrganic: false,
    isSeasonal: false,
    harvestDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
    }
  }, [user, currentPage, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        category: filters.category !== 'all' ? filters.category : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined
      };
      
      const response = await adminProductsApi.getAllProducts(params);
      
      if (response.data) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        // Fallback to mock data if API is not available
        const mockProducts: Product[] = [
          {
            _id: '1',
            name: 'Fresh Tomatoes',
            description: 'Organic red tomatoes, freshly harvested',
            price: 80,
            unit: 'kg',
            seller: {
              _id: 'seller1',
              name: 'John Farmer',
              email: 'john@farmer.com'
            },
            sellerType: 'farmer',
            location: 'Dhaka',
            category: 'Vegetables',
            isOrganic: true,
            isSeasonal: false,
            quantity: 50,
            averageRating: 4.5,
            totalReviews: 12,
            images: ['tomato1.jpg'],
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:20:00Z',
            harvestDate: '2024-01-10T00:00:00Z',
            expiryDate: '2024-01-25T00:00:00Z'
          },
          {
            _id: '2',
            name: 'Basmati Rice',
            description: 'Premium quality basmati rice',
            price: 120,
            unit: 'kg',
            seller: {
              _id: 'seller2',
              name: 'Rice Vendor Co.',
              email: 'vendor@rice.com'
            },
            sellerType: 'vendor',
            location: 'Chittagong',
            category: 'Grains',
            isOrganic: false,
            isSeasonal: false,
            quantity: 200,
            averageRating: 4.2,
            totalReviews: 8,
            images: ['rice1.jpg'],
            status: 'active',
            createdAt: '2024-01-12T09:15:00Z',
            updatedAt: '2024-01-18T16:45:00Z'
          },
          {
            _id: '3',
            name: 'Seasonal Mangoes',
            description: 'Sweet and juicy seasonal mangoes',
            price: 150,
            unit: 'kg',
            seller: {
              _id: 'seller3',
              name: 'Mango Farm',
              email: 'mango@farm.com'
            },
            sellerType: 'farmer',
            location: 'Rajshahi',
            category: 'Fruits',
            isOrganic: true,
            isSeasonal: true,
            quantity: 30,
            averageRating: 4.8,
            totalReviews: 25,
            images: ['mango1.jpg'],
            status: 'suspended',
            createdAt: '2024-01-08T14:20:00Z',
            updatedAt: '2024-01-22T11:30:00Z',
            harvestDate: '2024-01-05T00:00:00Z',
            expiryDate: '2024-01-30T00:00:00Z'
          }
        ];
        
        setProducts(mockProducts);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(`Failed to fetch products: ${err.response?.data?.message || err.message}`);
      
      // Fallback to empty array on error
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAction = async (productId: string, action: string, data?: any) => {
    try {
      let response;
      
      switch (action) {
        case 'suspend':
          response = await adminProductsApi.suspendProduct(productId, data?.reason);
          break;
        case 'activate':
          response = await adminProductsApi.activateProduct(productId);
          break;
        case 'delete':
          response = await adminProductsApi.deleteProduct(productId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      // Update local state based on successful API call
      setProducts(prev => prev.map(p => {
        if (p._id === productId) {
          switch (action) {
            case 'suspend':
              return { ...p, status: 'suspended' as const };
            case 'activate':
              return { ...p, status: 'active' as const };
            case 'delete':
              return p; // Will be filtered out below
            default:
              return p;
          }
        }
        return p;
      }));
      
      if (action === 'delete') {
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
      
      setShowProductModal(false);
      setSelectedProduct(null);
      setError(null);
    } catch (err: any) {
      console.error(`Error ${action} product:`, err);
      setError(`Failed to ${action} product: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      category: product.category,
      location: product.location,
      quantity: product.quantity,
      isOrganic: product.isOrganic,
      isSeasonal: product.isSeasonal,
      harvestDate: product.harvestDate ? product.harvestDate.split('T')[0] : '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        // Update existing product
        const response = await adminProductsApi.updateProduct(editingProduct._id, productForm);
        
        if (response.data) {
          setProducts(prev => prev.map(p => 
            p._id === editingProduct._id 
              ? { ...p, ...productForm, updatedAt: new Date().toISOString() }
              : p
          ));
        }
        setShowEditModal(false);
      } else {
        // Add new product
        const response = await adminProductsApi.createProduct(productForm);
        
        if (response.data && response.data.product) {
          const newProduct: Product = {
            _id: response.data.product._id,
            ...productForm,
            seller: {
              _id: response.data.product.seller?._id || 'unknown',
              name: response.data.product.seller?.name || 'Unknown Seller',
              email: response.data.product.seller?.email || 'unknown@email.com'
            },
            sellerType: response.data.product.sellerType || 'farmer',
            averageRating: 0,
            totalReviews: 0,
            images: response.data.product.images || [],
            status: response.data.product.status || 'active',
            createdAt: response.data.product.createdAt || new Date().toISOString(),
            updatedAt: response.data.product.updatedAt || new Date().toISOString()
          };
          setProducts(prev => [newProduct, ...prev]);
        }
        setShowAddModal(false);
      }
      
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        unit: '',
        category: 'Vegetables',
        location: '',
        quantity: 0,
        isOrganic: false,
        isSeasonal: false,
        harvestDate: '',
        expiryDate: ''
      });
      setError(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(`Failed to save product: ${err.response?.data?.message || err.message}`);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Vegetables: 'bg-green-100 text-green-800',
      Fruits: 'bg-orange-100 text-orange-800',
      Grains: 'bg-yellow-100 text-yellow-800',
      Dairy: 'bg-blue-100 text-blue-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.sellerType !== 'all' && product.sellerType !== filters.sellerType) return false;
    if (filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.organic !== 'all') {
      const isOrganic = filters.organic === 'true';
      if (product.isOrganic !== isOrganic) return false;
    }
    if (filters.seasonal !== 'all') {
      const isSeasonal = filters.seasonal === 'true';
      if (product.isSeasonal !== isSeasonal) return false;
    }
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !product.seller.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">Manage all products across the platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
              <span className="text-sm text-gray-500">
                {filteredProducts.length} of {products.length} products
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filters.sellerType}
              onChange={(e) => setFilters({ ...filters, sellerType: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Sellers</option>
              <option value="farmer">Farmers</option>
              <option value="vendor">Vendors</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={filters.organic}
              onChange={(e) => setFilters({ ...filters, organic: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="true">Organic</option>
              <option value="false">Non-Organic</option>
            </select>
            <select
              value={filters.seasonal}
              onChange={(e) => setFilters({ ...filters, seasonal: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Seasons</option>
              <option value="true">Seasonal</option>
              <option value="false">Year-round</option>
            </select>
            <button
              onClick={() => setFilters({ category: 'all', sellerType: 'all', status: 'all', organic: 'all', seasonal: 'all', search: '' })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price & Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                            <div className="flex items-center mt-1 space-x-2">
                              {product.isOrganic && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Organic
                                </span>
                              )}
                              {product.isSeasonal && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Seasonal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{product.seller.name}</div>
                          <div className="text-gray-500">{product.seller.email}</div>
                          <div className="flex items-center mt-1">
                            <Users className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500 capitalize">{product.sellerType}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{product.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                            {product.category}
                          </span>
                          <div className="flex items-center">
                            {getStatusIcon(product.status)}
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                              {product.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                            ৳{product.price}/{product.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Stock: {product.quantity} {product.unit}
                          </div>
                          {product.expiryDate && (
                            <div className="text-xs text-red-500">
                              Expires: {formatDate(product.expiryDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {product.averageRating ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="ml-1">{product.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 ml-1">({product.totalReviews})</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No ratings</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {product.status === 'active' && (
                            <button
                              onClick={() => handleProductAction(product._id, 'suspend')}
                              className="text-red-600 hover:text-red-800"
                              title="Suspend Product"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {product.status === 'suspended' && (
                            <button
                              onClick={() => handleProductAction(product._id, 'activate')}
                              className="text-green-600 hover:text-green-800"
                              title="Activate Product"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                                handleProductAction(product._id, 'delete');
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Product Details</h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Price:</span>
                    <p className="font-medium">৳{selectedProduct.price}/{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Stock:</span>
                    <p className="font-medium">{selectedProduct.quantity} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Category:</span>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                      {selectedProduct.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  {selectedProduct.status === 'active' && (
                    <button
                      onClick={() => handleProductAction(selectedProduct._id, 'suspend')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Suspend Product
                    </button>
                  )}
                  {selectedProduct.status === 'suspended' && (
                    <button
                      onClick={() => handleProductAction(selectedProduct._id, 'activate')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Activate Product
                    </button>
                  )}
                  <button
                    onClick={() => handleEditProduct(selectedProduct)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Grains">Grains</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (৳) *
                    </label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      placeholder="kg, piece, liter"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      value={productForm.harvestDate}
                      onChange={(e) => setProductForm({ ...productForm, harvestDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={productForm.expiryDate}
                      onChange={(e) => setProductForm({ ...productForm, expiryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.isOrganic}
                      onChange={(e) => setProductForm({ ...productForm, isOrganic: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Organic</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.isSeasonal}
                      onChange={(e) => setProductForm({ ...productForm, isSeasonal: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Seasonal</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductManagement;