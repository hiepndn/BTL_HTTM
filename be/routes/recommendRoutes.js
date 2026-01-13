const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');

// Định nghĩa đường dẫn POST
router.post('/analyze', recommendController.analyzeArea);

module.exports = router;