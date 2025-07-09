const express = require('express');
const router = express.Router();
const { getCategoriesWithIcons } = require('../controllers/categoryController');

router.get('/with-icons', getCategoriesWithIcons);

module.exports = router; 