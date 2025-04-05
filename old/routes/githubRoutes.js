import express from 'express';
import { getRepoTree, parseGitHubLink } from '../controllers/githubController.js';
import {
  getUserReposFromInput,
  getRepoTreeFromLink
} from '../controllers/githubController.js';

const router = express.Router();

router.get('/repos/:owner/:repo/tree', getRepoTree);

router.post('/parse-link', parseGitHubLink);

router.post('/user-repos', getUserReposFromInput);
router.post('/repo-tree', getRepoTreeFromLink);

export default router;
