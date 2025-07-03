const Joi = require('joi');

// User registration schema
const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)',
            'any.required': 'Password is required'
        }),
        role: Joi.string()
        .valid('user', 'author')
        .default('user')
        .messages({
            'any.only': 'Role must be either user or author'
        })
});

// User login schema
const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        })
});

// Email verification schema
const verifyEmailSchema = Joi.object({
    otp: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain only numbers',
            'any.required': 'OTP is required'
        })
});

// Password reset request schema
const requestPasswordResetSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        })
});

// Password reset schema
const resetPasswordSchema = Joi.object({
    otp: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain only numbers',
            'any.required': 'OTP is required'
        }),

    newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)',
            'any.required': 'New password is required'
        })
});

// Resend verification schema
const resendVerificationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        })
});

// Book creation schema (for form data with file upload)
const createBookSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Title must be at least 1 character long',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),

    author: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.min': 'Author must be at least 1 character long',
            'string.max': 'Author cannot exceed 100 characters',
            'any.required': 'Author is required'
        }),

    description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 2000 characters',
            'any.required': 'Description is required'
        }),

    isbn: Joi.string()
        .min(10)
        .max(13)
        .pattern(/^[0-9-]+$/)
        .required()
        .messages({
            'string.min': 'ISBN must be at least 10 characters long',
            'string.max': 'ISBN cannot exceed 13 characters',
            'string.pattern.base': 'ISBN must contain only numbers and hyphens',
            'any.required': 'ISBN is required'
        }),

    price: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be positive',
            'any.required': 'Price is required'
        }),

    discount: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.base': 'Discount must be a number',
            'number.min': 'Discount cannot be negative',
            'number.max': 'Discount cannot exceed 100%'
        }),

    pages: Joi.number()
        .integer()
        .positive()
        .messages({
            'number.base': 'Pages must be a number',
            'number.integer': 'Pages must be a whole number',
            'number.positive': 'Pages must be positive'
        }),

    category: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.min': 'Category must be at least 1 character long',
            'string.max': 'Category cannot exceed 50 characters',
            'any.required': 'Category is required'
        }),

    coverImage: Joi.string()
        .uri()
        .messages({
            'string.uri': 'Cover image must be a valid URL'
        }),

    images: Joi.array()
        .items(Joi.string().uri())
        .default([])
        .messages({
            'array.base': 'Images must be an array',
            'string.uri': 'Each image must be a valid URL'
        }),

    stock: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'Stock must be a number',
            'number.integer': 'Stock must be a whole number',
            'number.min': 'Stock cannot be negative'
        }),

    isNew: Joi.boolean()
        .default(true),

    isBestseller: Joi.boolean()
        .default(false),

    isFeatured: Joi.boolean()
        .default(false)
});

// Book update schema (allows partial updates)
const updateBookSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(200)
        .messages({
            'string.min': 'Title must be at least 1 character long',
            'string.max': 'Title cannot exceed 200 characters'
        }),

    author: Joi.string()
        .min(1)
        .max(100)
        .messages({
            'string.min': 'Author must be at least 1 character long',
            'string.max': 'Author cannot exceed 100 characters'
        }),

    description: Joi.string()
        .min(10)
        .max(2000)
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 2000 characters'
        }),

    isbn: Joi.string()
        .min(10)
        .max(13)
        .pattern(/^[0-9-]+$/)
        .messages({
            'string.min': 'ISBN must be at least 10 characters long',
            'string.max': 'ISBN cannot exceed 13 characters',
            'string.pattern.base': 'ISBN must contain only numbers and hyphens'
        }),

    price: Joi.number()
        .positive()
        .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be positive'
        }),

    discount: Joi.number()
        .min(0)
        .max(100)
        .messages({
            'number.base': 'Discount must be a number',
            'number.min': 'Discount cannot be negative',
            'number.max': 'Discount cannot exceed 100%'
        }),

    pages: Joi.number()
        .integer()
        .positive()
        .messages({
            'number.base': 'Pages must be a number',
            'number.integer': 'Pages must be a whole number',
            'number.positive': 'Pages must be positive'
        }),

    category: Joi.string()
        .min(1)
        .max(50)
        .messages({
            'string.min': 'Category must be at least 1 character long',
            'string.max': 'Category cannot exceed 50 characters'
        }),

    coverImage: Joi.string()
        .uri()
        .messages({
            'string.uri': 'Cover image must be a valid URL'
        }),

    images: Joi.array()
        .items(Joi.string().uri())
        .messages({
            'array.base': 'Images must be an array',
            'string.uri': 'Each image must be a valid URL'
        }),

    stock: Joi.number()
        .integer()
        .min(0)
        .messages({
            'number.base': 'Stock must be a number',
            'number.integer': 'Stock must be a whole number',
            'number.min': 'Stock cannot be negative'
        }),

    isNew: Joi.boolean(),

    isBestseller: Joi.boolean(),

    isFeatured: Joi.boolean()
});

// Book listing query parameters schema
const bookListingSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be a whole number',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be a whole number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),

    sort: Joi.string()
        .valid('title', 'price', 'averageRating', 'createdAt')
        .default('createdAt')
        .messages({
            'any.only': 'Sort must be one of: title, price, averageRating, createdAt'
        }),

    order: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'Order must be either "asc" or "desc"'
        }),

    category: Joi.string()
        .min(1)
        .max(50)
        .messages({
            'string.min': 'Category must be at least 1 character long',
            'string.max': 'Category cannot exceed 50 characters'
        }),

    author: Joi.string()
        .min(1)
        .max(100)
        .messages({
            'string.min': 'Author must be at least 1 character long',
            'string.max': 'Author cannot exceed 100 characters'
        }),

    minPrice: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Min price must be a number',
            'number.min': 'Min price cannot be negative'
        }),

    maxPrice: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Max price must be a number',
            'number.min': 'Max price cannot be negative'
        }),

    rating: Joi.number()
        .min(1)
        .max(5)
        .messages({
            'number.base': 'Rating must be a number',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating cannot exceed 5'
        }),

    inStock: Joi.boolean()
        .messages({
            'boolean.base': 'In stock must be true or false'
        }),

    discount: Joi.boolean()
        .messages({
            'boolean.base': 'Discount must be true or false'
        })
});

// Book search query parameters schema
const bookSearchSchema = Joi.object({
    q: Joi.string()
        .min(1)
        .required()
        .messages({
            'string.min': 'Search query must be at least 1 character long',
            'any.required': 'Search query is required'
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be a whole number',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be a whole number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),

    searchIn: Joi.array()
        .items(Joi.string().valid('title', 'author', 'description'))
        .default(['title', 'author', 'description'])
        .messages({
            'array.base': 'Search fields must be an array',
            'any.only': 'Search fields must be: title, author, or description'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    createBookSchema,
    updateBookSchema,
    bookListingSchema,
    bookSearchSchema
};