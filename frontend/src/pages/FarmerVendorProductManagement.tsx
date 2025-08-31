import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsApi } from '../services/api';
import './FarmerVendorProductManagement.css';
import {
  Package,
  Search,
  Edit,
  Trash2,
  Plus,
  Eye,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Upload,
  X,
  CheckCircle,
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

interface ProductForm {
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  location: string;
  quantity: number;
  isOrganic: boolean;
  isSeasonal: boolean;
  harvestDate: string;
  expiryDate: string;
}

const FarmerVendorProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    unit: 'kg',
    category: 'Vegetables',
    location: '',
    quantity: 0,
    isOrganic: false,
    isSeasonal: false,
    harvestDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (user && ['farmer', 'vendor', 'admin'].includes(user.role)) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getMyProducts();
      setProducts(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(files);
    
    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  const handleCreateProduct = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!productForm.name.trim()) {
        setError('Product name is required');
        return;
      }
      if (!productForm.description.trim()) {
        setError('Product description is required');
        return;
      }
      if (productForm.price <= 0) {
        setError('Price must be greater than 0');
        return;
      }
      if (!productForm.location.trim()) {
        setError('Location is required');
        return;
      }
      if (productForm.quantity < 0) {
        setError('Quantity cannot be negative');
        return;
      }

      const formData = new FormData();
      
      // Add product data
      Object.keys(productForm).forEach(key => {
        const value = productForm[key as keyof ProductForm];
        formData.append(key, value.toString());
      });
      
      // Add images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await productsApi.createProduct(formData);
      
      // Refresh products from database to ensure consistency
      await fetchProducts();
      setSuccess('Product created successfully!');
      setShowAddModal(false);
      resetForm();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create product';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      
      // Add product data
      Object.keys(productForm).forEach(key => {
        const value = productForm[key as keyof ProductForm];
        formData.append(key, value.toString());
      });
      
      // Add new images if selected
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await productsApi.updateProduct(editingProduct._id, formData);
      setProducts(prev => prev.map(p => 
        p._id === editingProduct._id ? response.data : p
      ));
      setSuccess('Product updated successfully!');
      setShowEditModal(false);
      resetForm();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = async (productId: string, imageIndex: number) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await productsApi.removeProductImage(productId, imageIndex);
      setProducts(prev => prev.map(p => 
        p._id === productId ? response.data : p
      ));
      
      // Update the editingProduct if it's the same product being edited
      if (editingProduct && editingProduct._id === productId) {
        setEditingProduct(response.data);
      }
      
      setSuccess('Image removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove image');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await productsApi.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      setSuccess('Product deleted successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
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

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      unit: 'kg',
      category: 'Vegetables',
      location: '',
      quantity: 0,
      isOrganic: false,
      isSeasonal: false,
      harvestDate: '',
      expiryDate: ''
    });
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setEditingProduct(null);
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
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !['farmer', 'vendor', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">You need farmer or vendor privileges to access this page.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600">Manage your product listings</p>
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
                {filteredProducts.length} products
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search your products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No products match your search.' : 'You haven\'t added any products yet.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
              >
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
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
                    <Package className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <div className="flex items-center">
                      {getStatusIcon(product.status)}
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status ? product.status.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-lg font-bold text-green-600">৳{product.price}</span>
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{product.location}</span>
                    </div>
                    <span>Stock: {product.quantity} {product.unit}</span>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
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

                  {product.averageRating && (
                    <div className="flex items-center mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm">{product.averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 ml-1">({product.totalReviews} reviews)</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {showAddModal ? 'Add New Product' : 'Edit Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                if (showAddModal) {
                  handleCreateProduct();
                } else {
                  handleUpdateProduct();
                }
              }}>
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe your product"
                    required
                  />
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (৳) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                      <option value="liter">Liter</option>
                      <option value="ml">Milliliter (ml)</option>
                    </select>
                  </div>
                </div>

                {/* Category and Location */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={productForm.location}
                      onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="City, District"
                      required
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex space-x-6">
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Images (Max 5)
                  </label>
                  
                  {/* Existing Images (only in edit mode) */}
                  {showEditModal && editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Current Images:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {editingProduct.images.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={`http://localhost:5000${imageUrl}`}
                              alt={`Current ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/no-photo.jpg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(editingProduct._id, index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              title="Remove this image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {showEditModal ? 'Add more images' : 'Click to upload images'}
                      </span>
                      <span className="text-xs text-gray-500">PNG, JPG up to 5MB each</span>
                    </label>
                  </div>
                  
                  {/* New Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">New Images to Add:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-white rounded-lg transition duration-200 ${
                      isSubmitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting 
                      ? 'Processing...' 
                      : (showAddModal ? 'Create Product' : 'Update Product')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:5000${image}`}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        className="h-32 w-full object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Price:</span>
                    <p className="text-lg font-bold text-green-600">৳{selectedProduct.price}/{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category:</span>
                    <p className="text-gray-900">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-gray-900">{selectedProduct.location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Stock:</span>
                    <p className="text-gray-900">{selectedProduct.quantity} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="flex items-center">
                      {getStatusIcon(selectedProduct.status)}
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                        {selectedProduct.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created:</span>
                    <p className="text-gray-900">{formatDate(selectedProduct.createdAt)}</p>
                  </div>
                </div>

                {(selectedProduct.harvestDate || selectedProduct.expiryDate) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.harvestDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Harvest Date:</span>
                        <p className="text-gray-900">{formatDate(selectedProduct.harvestDate)}</p>
                      </div>
                    )}
                    {selectedProduct.expiryDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Expiry Date:</span>
                        <p className="text-gray-900">{formatDate(selectedProduct.expiryDate)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  {selectedProduct.isOrganic && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Organic
                    </span>
                  )}
                  {selectedProduct.isSeasonal && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Seasonal
                    </span>
                  )}
                </div>

                {selectedProduct.averageRating && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Rating:</span>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 text-lg font-semibold">{selectedProduct.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500 ml-1">({selectedProduct.totalReviews} reviews)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    handleEditProduct(selectedProduct);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerVendorProductManagement;