import React, { useState, useEffect } from 'react';
import { ordersApi, productsApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminOrdersPanel.css';

interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name?: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminOrdersPanel: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [codPendingOrders, setCodPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'cod-pending' | 'manage'>('all');
  const [approvalNotes, setApprovalNotes] = useState<{ [key: string]: string }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'all' || activeTab === 'manage') {
        fetchAllOrdersAdmin();
      }
      if (activeTab === 'cod-pending') {
        fetchCODPendingOrders();
      }
    }
  }, [user, activeTab, searchTerm, statusFilter, paymentStatusFilter, pagination.currentPage]);

  useEffect(() => {
    if (showCreateModal) {
      fetchUsers();
      fetchProducts();
    }
  }, [showCreateModal]);

  const fetchAllOrdersAdmin = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAllOrdersAdmin({
        page: pagination.currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter,
        paymentStatus: paymentStatusFilter
      });
      setOrders(response.orders || []);
      setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalOrders: 0 });
    } catch (err: any) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a users API endpoint - for now using a placeholder
      setUsers([]);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getProducts({ limit: 100 });
      setProducts(response.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCODPendingOrders = async () => {
    try {
      const response = await ordersApi.getCODOrdersPendingApproval();
      setCodPendingOrders(response.orders || []);
    } catch (err: any) {
      console.error('Error fetching COD pending orders:', err);
    }
  };

  const handleAdminCODApproval = async (orderId: string) => {
    try {
      const notes = approvalNotes[orderId] || '';
      await ordersApi.approveAdminCODPayment(orderId, { notes });
      
      // Refresh both lists
      await fetchAllOrdersAdmin();
      await fetchCODPendingOrders();
      
      // Clear notes
      setApprovalNotes(prev => ({ ...prev, [orderId]: '' }));
      
      alert('COD payment approved successfully!');
    } catch (err: any) {
      alert('Failed to approve COD payment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleNotesChange = (orderId: string, notes: string) => {
    setApprovalNotes(prev => ({ ...prev, [orderId]: notes }));
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await ordersApi.deleteOrderAdmin(orderId);
        fetchAllOrdersAdmin();
        alert('Order deleted successfully!');
      } catch (err: any) {
        alert('Failed to delete order: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleCompleteOrder = async (orderId: string, currentStatus: string) => {
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      return; // Already completed or cancelled
    }

    const confirmMessage = currentStatus === 'pending' 
      ? 'Mark this order as confirmed and delivered?' 
      : 'Mark this order as delivered?';

    if (window.confirm(confirmMessage)) {
      try {
        const updateData = {
          status: 'delivered',
          paymentStatus: 'paid' // Assume payment is completed when order is delivered
        };
        
        await ordersApi.updateOrderAdmin(orderId, updateData);
        fetchAllOrdersAdmin();
        alert('Order marked as delivered successfully!');
      } catch (err: any) {
        alert('Failed to complete order: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleUpdateOrder = async (updateData: any) => {
    if (!editingOrder) return;
    
    try {
      await ordersApi.updateOrderAdmin(editingOrder._id, updateData);
      setShowEditModal(false);
      setEditingOrder(null);
      fetchAllOrdersAdmin();
      alert('Order updated successfully!');
    } catch (err: any) {
      alert('Failed to update order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      await ordersApi.createOrderAdmin(orderData);
      setShowCreateModal(false);
      fetchAllOrdersAdmin();
      alert('Order created successfully!');
    } catch (err: any) {
      alert('Failed to create order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAllOrdersAdmin();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-orders-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-orders-panel">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders-panel">
      <div className="panel-header">
        <h1>Orders Management</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Orders ({pagination.totalOrders})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cod-pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('cod-pending')}
          >
            COD Pending Approval ({codPendingOrders.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="orders-content">
        {activeTab === 'all' && (
          <div className="orders-section">
            <h3>All Orders</h3>
            {orders.length === 0 ? (
              <p className="no-orders">No orders found.</p>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="order-id">{order.orderId}</td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-name">{order.deliveryAddress.fullName}</div>
                            <div className="customer-email">{order.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="order-items">
                            {order.items.map((item, index) => (
                              <div key={index} className="order-item">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="order-total">৳{order.totalAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className={`payment-badge payment-${order.paymentStatus?.toLowerCase() || 'unknown'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="order-date">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="orders-section">
            <div className="manage-header">
              <h3>Manage Orders</h3>
              <button 
                className="create-order-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + Create New Order
              </button>
            </div>
            
            <div className="filters-section">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, or Email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <button type="submit" className="search-btn">Search</button>
              </form>
            </div>

            {orders.length === 0 ? (
              <p className="no-orders">No orders found.</p>
            ) : (
              <>
                <div className="orders-table-container">
                  <table className="orders-table manage-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td className="order-id">{order.orderId}</td>
                          <td>
                            <div className="customer-info">
                              <div className="customer-name">{order.deliveryAddress.fullName}</div>
                              <div className="customer-email">{order.user?.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td>
                            <div className="order-items">
                              {order.items.map((item, index) => (
                                <div key={index} className="order-item">
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-quantity">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="order-total">৳{order.totalAmount?.toFixed(2) || '0.00'}</td>
                          <td>
                            <span className={`status-badge status-${order.status?.toLowerCase() || 'unknown'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className={`payment-badge payment-${order.paymentStatus?.toLowerCase() || 'unknown'}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="order-date">{formatDate(order.createdAt)}</td>
                          <td className="actions-cell">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order"
                            >
                              ✏️
                            </button>
                            <button 
                              className="complete-btn"
                              onClick={() => handleCompleteOrder(order._id, order.status)}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                              title={order.status === 'delivered' ? 'Order Already Completed' : order.status === 'cancelled' ? 'Order Cancelled' : 'Mark as Delivered'}
                            >
                              ✅
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteOrder(order._id)}
                              title="Delete Order"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages} 
                      ({pagination.totalOrders} total orders)
                    </span>
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'cod-pending' && (
          <div className="cod-pending-list">
            <h3>COD Orders Pending Admin Approval</h3>
            {codPendingOrders.length === 0 ? (
              <p className="no-orders">No COD orders pending approval.</p>
            ) : (
              <div className="cod-orders-container">
                {codPendingOrders.map((order) => (
                  <div key={order._id} className="cod-order-card">
                    <div className="order-header">
                      <h4>Order #{order.orderId}</h4>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    
                    <div className="order-details">
                      <p><strong>Customer:</strong> {order.deliveryAddress.fullName}</p>
                      <p><strong>Email:</strong> {order.user?.email}</p>
                      <p><strong>Phone:</strong> {order.deliveryAddress.phone}</p>
                      <p><strong>Total Amount:</strong> ৳{order.totalAmount.toFixed(2)}</p>
                      
                      <div className="order-items">
                        <strong>Items:</strong>
                        <ul>
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.name} × {item.quantity} - ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="shipping-address">
                        <strong>Shipping Address:</strong>
                        <p>{order.deliveryAddress.address}, {order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</p>
                      </div>
                    </div>
                    
                    <div className="approval-section">
                      <textarea
                        placeholder="Add approval notes (optional)"
                        value={approvalNotes[order._id] || ''}
                        onChange={(e) => handleNotesChange(order._id, e.target.value)}
                        className="approval-notes"
                      />
                      <button
                        onClick={() => handleAdminCODApproval(order._id)}
                        className="approve-btn"
                      >
                        Approve COD Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => {
            setShowEditModal(false);
            setEditingOrder(null);
          }}
          onUpdate={handleUpdateOrder}
        />
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateOrder}
          products={products}
          users={users}
        />
      )}
    </div>
  );
};

// Edit Order Modal Component
interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: (updateData: any) => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: order.status || 'pending',
    paymentStatus: order.paymentStatus || 'pending',
    deliveryAddress: {
      fullName: order.deliveryAddress?.fullName || '',
      address: order.deliveryAddress?.address || '',
      city: order.deliveryAddress?.city || '',
      postalCode: order.deliveryAddress?.postalCode || '',
      phone: order.deliveryAddress?.phone || ''
    },
    notes: order.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('deliveryAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-order-modal">
        <div className="modal-header">
          <h3>Edit Order #{order.orderId}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-order-form">
          <div className="form-row">
            <div className="form-group">
              <label>Order Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                required
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                required
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h4>Shipping Address</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.fullName}
                  onChange={(e) => handleInputChange('deliveryAddress.fullName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.deliveryAddress.phone}
                  onChange={(e) => handleInputChange('deliveryAddress.phone', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                value={formData.deliveryAddress.address}
                onChange={(e) => handleInputChange('deliveryAddress.address', e.target.value)}
                required
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.postalCode}
                  onChange={(e) => handleInputChange('deliveryAddress.postalCode', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about this order..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Update Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Order Modal Component
interface CreateOrderModalProps {
  onClose: () => void;
  onCreate: (orderData: any) => void;
  products: any[];
  users: any[];
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onCreate, products, users }) => {
  const [formData, setFormData] = useState({
    userId: '',
    items: [{ productId: '', quantity: 1, price: 0 }],
    deliveryAddress: {
      fullName: '',
      address: '',
      city: '',
      postalCode: '',
      phone: ''
    },
    paymentMethod: 'cod',
    status: 'pending',
    paymentStatus: 'pending',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
      ...formData,
      totalAmount,
      items: formData.items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    onCreate(orderData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('deliveryAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price when product is selected
    if (field === 'productId') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].price = selectedProduct.price;
      }
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content create-order-modal">
        <div className="modal-header">
          <h3>Create New Order</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-order-form">
          <div className="form-section">
            <h4>Order Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  placeholder="Enter customer email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  required
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Order Items</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="form-group">
                  <label>Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ৳{product.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="item-actions">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="remove-item-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="add-item-btn">
              + Add Item
            </button>
            <div className="total-amount">
              <strong>Total: ৳{totalAmount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="form-section">
            <h4>Shipping Address</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.fullName}
                  onChange={(e) => handleInputChange('deliveryAddress.fullName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.deliveryAddress.phone}
                  onChange={(e) => handleInputChange('deliveryAddress.phone', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                value={formData.deliveryAddress.address}
                onChange={(e) => handleInputChange('deliveryAddress.address', e.target.value)}
                required
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.postalCode}
                  onChange={(e) => handleInputChange('deliveryAddress.postalCode', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about this order..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOrdersPanel;

