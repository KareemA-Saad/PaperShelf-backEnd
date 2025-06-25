let books = [];

// Create a new book
const createBook = (req, res) => {
  books.push({
    id: books.length + 1,
    title: req.body.title,
    authorId: req.user.id
  });
  res.status(201).json({ message: 'Book created' });
};

// Update a book
const updateBook = (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.authorId !== req.user.id) return res.status(403).json({ message: 'Not your book' });
  book.title = req.body.title;
  res.json(book);
};

// Delete a book
const deleteBook = (req, res) => {
  books = books.filter(b => b.id !== parseInt(req.params.id));
  res.status(204).send();
};

// List all books
const listBooks = (req, res) => {
  res.json(books);
};

module.exports = {
  createBook,
  updateBook,
  deleteBook,
  listBooks
};
