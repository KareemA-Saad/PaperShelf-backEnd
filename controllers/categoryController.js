// controllers/categoryController.js

// List your categories and their icon image paths
const categoryList = [
    { name: 'Classic', image: '/uploads/category-icons/classic.png' },
    { name: 'History', image: '/uploads/category-icons/history.png' },
    { name: 'Programming', image: '/uploads/category-icons/programming.png' },
    { name: 'Romance', image: '/uploads/category-icons/romance.png' },
];

const getCategoriesWithIcons = (req, res) => {
    res.json({ success: true, data: categoryList });
};

module.exports = { getCategoriesWithIcons }; 