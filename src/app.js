const express = require('express');
const manhwaRoutes = require('./router/manhwaRoutes');

const app = express();

app.use('/api/manhwa', manhwaRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Manga Scrapper API',
    endpoints: {
      popular: '/api/manhwa/popular',
      new: '/api/manhwa/new',
      genre: '/api/manhwa/genre/:genre',
      search: '/api/manhwa/search/:query'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = app;