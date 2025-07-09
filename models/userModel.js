const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function (password) {
          // At least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(password);
        },
        message: "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)"
      },
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin", "author"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    googleId: String, // For Google OAuth (bonus feature)
    avatar: {
      type: String,
      default: "",
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }],
  },
  { timestamps: true } // This automatically adds createdAt and updatedAt
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Database Indexes for Performance Optimization
// These indexes will significantly improve admin query performance

// 1. Role index - for filtering users by role (admin queries)
userSchema.index({ role: 1 });

// 2. Active status index - for filtering active/inactive users
userSchema.index({ isActive: 1 });

// 3. Email verification index - for filtering verified/unverified users
userSchema.index({ isEmailVerified: 1 });

// 4. Last login index - for sorting users by activity
userSchema.index({ lastLogin: -1 });

// 5. Created date index - for sorting by registration date
userSchema.index({ createdAt: -1 });

// 6. Name index - for searching users by name
userSchema.index({ name: 1 });

// 7. Composite indexes for common admin queries

// Role + Active status (most common admin filter)
userSchema.index({ role: 1, isActive: 1 });

// Role + Email verification (admin filtering)
userSchema.index({ role: 1, isEmailVerified: 1 });

// Active + Last login (for user activity reports)
userSchema.index({ isActive: 1, lastLogin: -1 });

// Role + Created date (for user registration reports)
userSchema.index({ role: 1, createdAt: -1 });

// 8. Text index for name/email search (if you plan to add search functionality)
userSchema.index({ name: 'text', email: 'text' });

// 9. Token indexes for authentication performance
userSchema.index({ refreshToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

module.exports = mongoose.model("User", userSchema);
