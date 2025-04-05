import express from 'express';
import githubRoutes from './routes/githubRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', githubRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
