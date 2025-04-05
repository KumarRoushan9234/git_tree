import express from 'express';
import { getRepoTree, parseGitHubLink } from '../controllers/githubController.js';

const router = express.Router();

router.get('/repos/:owner/:repo/tree', getRepoTree);

router.post('/parse-link', parseGitHubLink);

export default router;
