import axios from 'axios';

export async function getUserReposFromInput(req, res) {
  try {
    const { input } = req.body;
    let username;

    if (!input) return res.status(400).json({ error: 'Input is required.' });

    if (input.startsWith('https://github.com/')) {
      const parts = input.replace('https://github.com/', '').split('/');
      username = parts[0];
    } else {
      username = input;
    }

    const userResponse = await axios.get(`https://api.github.com/users/${username}`);
    const profileData = userResponse.data;

    const profile = {
      name: profileData.name,
      bio: profileData.bio,
      location: profileData.location,
      email: profileData.email,
      blog: profileData.blog,
      company: profileData.company,
      followers: profileData.followers,
      following: profileData.following,
      public_repos: profileData.public_repos,
      avatar_url: profileData.avatar_url,
      github_url: profileData.html_url,
      created_at: profileData.created_at
    };

    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`);
    const repos = reposResponse.data.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updated_at: repo.updated_at,
      url: repo.html_url
    }));

    res.json({ profile, repos });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function getRepoTreeFromLink(req, res) {
  const { url } = req.body;

  if (!url || !url.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Valid GitHub repo URL is required.' });
  }

  const parts = url.replace('https://github.com/', '').split('/');
  if (parts.length < 2) return res.status(400).json({ error: 'Invalid GitHub repo URL.' });

  const owner = parts[0];
  const repo = parts[1];

  try {
    
    const repoMeta = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const data = repoMeta.data;
    const defaultBranch = data.default_branch;

    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await axios.get(treeUrl);

    const structure = treeRes.data.tree.map(item => ({
      type: item.type,
      path: item.path
    }));

    // Metadata + Tree
    res.json({
      repo: `${owner}/${repo}`,
      branch: defaultBranch,
      structure,
      metadata: {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        language: data.language,
        topics: data.topics,
        license: data.license?.name,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        watchers_count: data.watchers_count,
        open_issues_count: data.open_issues_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
        size_kb: data.size,
        has_wiki: data.has_wiki,
        has_issues: data.has_issues,
        visibility: data.visibility,
        html_url: data.html_url,
        owner: {
          username: data.owner.login,
          profile_url: data.owner.html_url,
          avatar_url: data.owner.avatar_url,
          type: data.owner.type
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// taking a lot of time => get the content file wise 
export async function getRepoFileContents(req, res) {
  const { url } = req.body;

  if (!url || !url.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Valid GitHub repo URL is required.' });
  }

  const parts = url.replace('https://github.com/', '').split('/');
  if (parts.length < 2) return res.status(400).json({ error: 'Invalid GitHub repo URL.' });

  const owner = parts[0];
  const repo = parts[1];

  try {
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw'
    };

    const repoMeta = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const defaultBranch = repoMeta.data.default_branch;

    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await axios.get(treeUrl, { headers });

    // blocled extension
    const excludedExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico',
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.zip', '.rar', '.7z', '.tar', '.gz', '.mp3', '.mp4', '.mov', '.avi',
      '.exe', '.dll', '.bin', '.iso',
    ];
    // '.txt',

    const files = treeRes.data.tree.filter(item => {
      if (item.type !== 'blob') return false;
      const ext = item.path.slice(item.path.lastIndexOf('.')).toLowerCase();
      return !excludedExtensions.includes(ext);
    });

    const fileContents = [];

    for (const file of files) {
      try {
        const contentRes = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
          { headers }
        );

        fileContents.push({
          path: file.path,
          content: contentRes.data
        });
      } catch (fileErr) {
        fileContents.push({
          path: file.path,
          content: 'Failed to fetch file content',
          error: fileErr.message
        });
      }
    }

    res.json({
      repo: `${owner}/${repo}`,
      fileCount: fileContents.length,
      files: fileContents
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// single file content 
export async function getSingleFileContent(req, res) {
  const { url } = req.body;

  if (!url || !url.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Valid GitHub file URL is required.' });
  }

  try {
    const cleanUrl = url.replace('https://github.com/', '');
    const parts = cleanUrl.split('/');

    if (parts.length < 5 || parts[2] !== 'blob') {
      return res.status(400).json({ error: 'Invalid GitHub file URL format.' });
    }

    const owner = parts[0];
    const repo = parts[1];
    const branch = parts[3];
    const filePath = parts.slice(4).join('/');

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw'
    };

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );

    res.json({
      repo: `${owner}/${repo}`,
      branch,
      path: filePath,
      content: response.data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
