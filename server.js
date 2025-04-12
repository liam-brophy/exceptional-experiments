import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Static file serving could be added here if needed
// app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});