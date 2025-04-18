import express from 'express';
import {
  getUserReposFromInput,
  getRepoTreeFromLink,
  getRepoFileContents,
  getSingleFileContent,
} from '../controllers/githubController.js';

const router = express.Router();

router.post('/user-repos', getUserReposFromInput);
router.post('/repo-tree', getRepoTreeFromLink);
router.post('/repo-files', getRepoFileContents);
router.post('/repo-file-content', getSingleFileContent);

export default router;
