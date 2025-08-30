const express = require('express');
const {
  getReviews,
  getTargetReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  voteOnReview,
  flagReview,
  addResponse,
  getUserReviews,
  moderateReview,
  getReviewStats
} = require('../controllers/reviews');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.route('/').get(getReviews);
router.route('/:id').get(getReview);
router.route('/:reviewType/:targetId').get(getTargetReviews);
router.route('/user/:userId').get(getUserReviews);

// Protected routes - All authenticated users
router.use(protect);

router.route('/').post(createReview);
router.route('/:id').put(updateReview).delete(deleteReview);
router.route('/:id/vote').post(voteOnReview);
router.route('/:id/flag').post(flagReview);
router.route('/:id/response').post(addResponse);

// Admin only routes
router.route('/stats').get(authorize('admin'), getReviewStats);
router.route('/:id/moderate').put(authorize('admin'), moderateReview);

module.exports = router;