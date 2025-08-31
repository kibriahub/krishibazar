const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

// POST /api/v1/contact - Submit contact form
router.post('/', submitContactForm);

module.exports = router;