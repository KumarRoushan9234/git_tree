import express from 'express';
import dotenv from 'dotenv';
import githubRoutes from './routes/githubRoutes.js';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to GitTree Project!');
});

app.use('/api', githubRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
