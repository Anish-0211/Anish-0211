#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'Anish-0211';
const REPO_NAME = 'Anish-0211';
const README_PATH = path.join(__dirname, '../../README.md');

function fetchGitHubAPI(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            headers: {
                'User-Agent': 'README-Stats-Updater',
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                res.statusCode === 200 ? resolve(JSON.parse(data)) : reject(new Error(`API Error ${res.statusCode}`));
            });
        }).on('error', reject);
    });
}

async function getRepoStats() {
    const repo = await fetchGitHubAPI(`/repos/${REPO_OWNER}/${REPO_NAME}`);
    const contributors = await fetchGitHubAPI(`/repos/${REPO_OWNER}/${REPO_NAME}/contributors`);

    return {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        commits: repo.size || 0,
        contributors: contributors.length
    };
}

function updateReadme(stats) {
    const readme = fs.readFileSync(README_PATH, 'utf8');
    const statsTable = `<!-- GITHUB_STATS:START -->
| ⭐ Stars | 🔱 Forks | 📝 Commits | 👥 Contributors | 🕒 Last Updated |
|:--------:|:--------:|:----------:|:---------------:|:---------------:|
| **${stats.stars}** | **${stats.forks}** | **${stats.commits}** | **${stats.contributors}** | ${new Date().toLocaleDateString('en-GB')} |
<!-- GITHUB_STATS:END -->`;

    const updatedReadme = readme.replace(
        /<!-- GITHUB_STATS:START -->[\s\S]*?<!-- GITHUB_STATS:END -->/,
        statsTable
    );

    fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
    console.log('✅ README updated!');
}

(async () => {
    try {
        console.log('Fetching stats...');
        const stats = await getRepoStats();
        console.log('Stats:', stats);
        updateReadme(stats);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
