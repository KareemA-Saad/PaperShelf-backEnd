const mongoose = require("mongoose");

// Book Schema
const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        text: true // For full-text search
    },
    author: {
        type: String,
        required: true,
        trim: true,
        text: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        text: true
    },
    isbn: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    pages: {
        type: Number,
        min: 1
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true // For filtering
    },
    coverImage: {
        type: String, // URL to the image
        required: true
    },
    images: [
        {
            type: String // URLs to additional images
        }
    ],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalReviews: {
        type: Number,
        min: 0,
        default: 0
    },
    totalSales: {
        type: Number,
        min: 0,
        default: 0
    },
    isNew: {
        type: Boolean,
        default: true
    },
    isBestseller: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
});

// Indexes for performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1, author: 1, price: 1, averageRating: -1 });
bookSchema.index({ isFeatured: 1, isBestseller: 1, isNew: 1 });

module.exports = mongoose.model('Book', bookSchema);