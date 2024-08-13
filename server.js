require('dotenv').config();
const http = require('http');
const connectDB = require('./utils/dbConn');
const { port } = require('./utils/env');
const express = require('express');
const { setupMiddleware } = require('./middleware/middleware');
const userRoutes = require('./routes/userRoutes');
const empRoutes = require('./routes/employeeRoutes');
const timingsRoutes = require('./routes/officeTimingsRoutes');
const attendenceRoutes = require('./routes/attendenceRoutes');
const path = require('path');

const app = express();

setupMiddleware(app); 

app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(userRoutes);
app.use(empRoutes);
app.use(timingsRoutes);
app.use(attendenceRoutes);


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
