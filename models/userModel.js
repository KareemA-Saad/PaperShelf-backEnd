// // User Model

// /**
//  * User Model Structure
//  * Define your user schema/structure here
//  */
// const UserModel = {
//   // Example fields - modify according to your needs
//   id: {
//     type: 'string',
//     required: true,
//   },
//   name: {
//     type: 'string',
//     required: true,
//   },
//   createdAt: {
//     type: 'date',
//     default: Date.now,
//   },
//   updatedAt: {
//     type: 'date',
//     default: Date.now,
//   }
// };

// // TODO: Implement your database logic here
// // This could be MongoDB with Mongoose, MySQL with Sequelize, etc.

// module.exports = UserModel;

const mongoose = require("mongoose");

const userModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userModel);
