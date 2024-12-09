require('dotenv').config();
const http = require('http');
const connectDB = require('./utils/dbConn');
const { port } = require('./utils/env');
const express = require('express');
const { setupMiddleware } = require('./middleware/middleware');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes = require('./routes/vendorRoutes')
const customerRoutes = require('./routes/customerRoutes')
const path = require('path');

const app = express();

setupMiddleware(app); 

app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/productUploads', express.static(path.join(__dirname, 'productUploads')));
app.use(userRoutes);
app.use(adminRoutes);
app.use(vendorRoutes);
app.use(customerRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Error' });
});

const startServer = async () => {
  await connectDB();

  http.createServer(app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

module.exports = app;
