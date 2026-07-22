// Pure Express app definition — no DB connection or .listen() here.
// server.js wraps this with Mongo connection + Socket.io + port binding for real runtime.
// Tests import this directly and point it at an in-memory Mongo instance instead.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/opportunities', require('./routes/opportunityRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/pickups', require('./routes/pickupRoutes'));
module.exports = app;
