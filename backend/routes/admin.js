const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  approveVendor,
  rejectVendor,
  deleteUser,
  bulkUserOperation
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Platform statistics
router.get('/stats', getPlatformStats);

// User management routes
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Vendor management routes
router.put('/users/:userId/approve-vendor', approveVendor);
router.put('/users/:userId/reject-vendor', rejectVendor);

// Bulk operations
router.post('/users/bulk-operation', bulkUserOperation);

module.exports = router;