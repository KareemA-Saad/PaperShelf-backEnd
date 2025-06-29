const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');
const authenticateUser = require('../middlewares/authenticateUser');

router.use(authenticateUser);

router.post('/', addToWishlist); // POST /api/wishlist
router.delete('/:bookId', removeFromWishlist); // DELETE /api/wishlist/:bookId
router.get('/', getWishlist); // GET /api/wishlist

module.exports = router; 