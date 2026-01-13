const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

router.get('/list', managerController.getAllCrops);
router.post('/add', managerController.addCrop);
router.delete('/delete/:id', managerController.deleteCrop);
router.post('/predict', managerController.predictYield);

module.exports = router;