import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { productsApi } from '../services/api';

// Define types
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  seller: string;
  sellerType?: string;
  location: string;
  category: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  quantity?: number;
  rating: number;
  reviews?: Array<{
    id: string;
    user: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  images?: string[];
};

type ProductContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (filters?: any) => Promise<void>;
  getProductById: (id: string) => Promise<Product | undefined>;
};

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Provider component
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with optional filters
  const fetchProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsApi.getProducts(filters);
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get a single product by ID
  const getProductById = async (id: string): Promise<Product | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsApi.getProductById(id);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch product with ID ${id}`);
      console.error(`Error fetching product with ID ${id}:`, err);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Load products when the component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        getProductById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook to use the product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};