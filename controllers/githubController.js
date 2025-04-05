import axios from 'axios';

export async function getRepoTree(req, res) {
  const { owner, repo } = req.params;
  try {
    const repoMeta = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const branch = repoMeta.data.default_branch;

    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const treeRes = await axios.get(treeUrl);
    const tree = treeRes.data.tree;

    const structured = tree.map(item => ({
      type: item.type,
      path: item.path,
    }));

    res.json({
      repo: `${owner}/${repo}`,
      branch,
      structure: structured,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function parseGitHubLink(req, res) {
  const { url } = req.body;
  try {
    if (!url.startsWith('https://github.com/')) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const parts = url.replace('https://github.com/', '').split('/');
    if (parts.length < 2) throw new Error('Incomplete repo path');

    const owner = parts[0];
    const repo = parts[1];
    req.params = { owner, repo };
    await getRepoTree(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
