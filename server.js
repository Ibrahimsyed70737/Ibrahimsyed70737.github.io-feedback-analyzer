    const express = require('express');
    const dotenv = require('dotenv');
    const path = require('path');
    const connectDB = require('./config/db'); // <-- This line needs './config/db' to be correct
    const routes = require('./routes');
    const cors = require('cors');

    dotenv.config();

    connectDB(); // <-- This line needs to be called to connect

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/api', routes);

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    