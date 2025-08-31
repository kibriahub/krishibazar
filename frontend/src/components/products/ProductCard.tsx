import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    seller: {
      name: string;
    };
    location: string;
    isOrganic?: boolean;
    isSeasonal?: boolean;
    rating?: number;
    images?: string[];
    quantity?: number;
  };
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const cartQuantity = getItemQuantity(product.id);
  const maxQuantity = product.quantity || 10; // Default max quantity
  
  const handleAddToCart = async () => {
    setIsAdding(true);
    
    const cartItem = {
      _id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: 1,
      maxQuantity: maxQuantity,
      images: product.images,
      seller: product.seller,
      sellerType: 'farmer' // Default to farmer, could be enhanced
    };
    
    addItem(cartItem);
    
    // Brief loading state for better UX
    setTimeout(() => setIsAdding(false), 300);
  };
  
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, Math.min(newQuantity, maxQuantity));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
      <div className="h-48 bg-gray-200 flex items-center justify-center relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={`http://localhost:5000${product.images[0]}`}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/no-photo.jpg';
            }}
          />
        ) : (
          <span className="text-4xl">🌱</span>
        )}
        
        {/* Quick Add Button */}
        {cartQuantity === 0 && (
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition duration-200 disabled:opacity-50"
            title="Quick add to cart"
          >
            {isAdding ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <ShoppingCart className="h-4 w-4 text-green-600" />
            )}
          </button>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <span className="font-bold text-green-600">৳{product.price}/{product.unit}</span>
        </div>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>Seller: {product.seller?.name || 'Unknown'}</span>
          <span>{product.location}</span>
        </div>
        
        {/* Cart Controls or Add Button */}
        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(cartQuantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition duration-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{cartQuantity}</span>
              <button
                onClick={() => handleQuantityChange(cartQuantity + 1)}
                disabled={cartQuantity >= maxQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-green-600 font-medium">In Cart</span>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 mb-3 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAdding ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
        
        <div className="flex justify-between items-center">
          {product.rating && (
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span>{product.rating}</span>
            </div>
          )}
          <Link 
            to={`/products/${product.id}`}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition duration-300 text-sm"
          >
            View Details
          </Link>
        </div>
        
        {(product.isOrganic || product.isSeasonal) && (
          <div className="flex mt-2 space-x-2">
            {product.isOrganic && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Organic</span>
            )}
            {product.isSeasonal && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Seasonal</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;