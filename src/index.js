#!/usr/bin/env node

/**
 * Repo Management Tools
 * CLI for managing GitHub repositories
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

// Topic suggestions based on repo patterns
const topicSuggestions = {
  'scraper': ['web-scraping', 'data-collection', 'automation'],
  'api': ['api', 'rest', 'backend', 'nodejs'],
  'cli': ['cli', 'tool', 'command-line', 'productivity'],
  'dashboard': ['dashboard', 'react', 'frontend', 'ui'],
  'agent': ['ai', 'agent', 'llm', 'automation'],
  'mcp': ['mcp', 'model-context-protocol', 'ai-agents'],
  'security': ['security', 'vulnerability', 'scanning'],
  'monitor': ['monitoring', 'observability', 'metrics'],
  'tracker': ['tracker', 'analytics', 'data'],
  'generator': ['generator', 'scaffolding', 'templates'],
  'analyzer': ['analyzer', 'analysis', 'tools'],
  'quantum': ['quantum', 'quantum-computing', 'simulation'],
  'workflow': ['workflow', 'automation', 'orchestration'],
  'compliance': ['compliance', 'governance', 'audit'],
};

async function getRepos(username) {
  const repos = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const cursorArg = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      user(login: "${username}") {
        repositories(first: 100${cursorArg}, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            description
            url
            isPrivate
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`;

    try {
      const result = JSON.parse(
        execSync(`gh api graphql -f query='${query}'`, { encoding: 'utf8' })
      );
      const { nodes, pageInfo } = result.data.user.repositories;
      repos.push(...nodes);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    } catch (e) {
      break;
    }
  }
  return repos;
}

async function listRepos() {
  console.log(chalk.blue('\n📋 Listing all repositories...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  repos.forEach(repo => {
    const topics = repo.repositoryTopics.nodes.map(t => t.topic.name).join(', ') || 'none';
    const badge = repo.isPrivate ? '🔒' : '🌐';
    console.log(`${badge} ${chalk.cyan(repo.name)}`);
    console.log(`   ${repo.description || '(No description)'}`);
    console.log(`   Topics: ${chalk.gray(topics)}\n`);
  });
  
  console.log(chalk.blue(`Total: ${repos.length} repositories`));
}

async function addTopics() {
  console.log(chalk.blue('\n🏷️ Adding topics to repositories...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const { repoName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'repoName',
      message: 'Select repository:',
      choices: repos.map(r => r.name)
    }
  ]);
  
  const repo = repos.find(r => r.name === repoName);
  const suggested = topicSuggestions[Object.keys(topicSuggestions).find(k => repoName.includes(k))] || [];
  
  const { topics } = await inquirer.prompt([
    {
      type: 'input',
      name: 'topics',
      message: 'Enter topics (comma-separated):',
      default: suggested.join(',')
    }
  ]);
  
  const topicList = topics.split(',').map(t => t.trim()).filter(t => t);
  
  try {
    execSync(`gh repo edit ${username}/${repoName} --add-topic ${topicList.join(' ')}`, {
      encoding: 'utf8'
    });
    console.log(chalk.green(`✅ Added topics: ${topicList.join(', ')}`));
  } catch (e) {
    console.log(chalk.red(`❌ Failed to add topics`));
  }
}

async function setDefaultBranch() {
  console.log(chalk.blue('\n🌿 Setting default branch...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const { repoName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'repoName',
      message: 'Select repository:',
      choices: repos.map(r => r.name)
    }
  ]);
  
  const { branch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branch',
      message: 'Select default branch:',
      choices: ['main', 'master', 'develop']
    }
  ]);
  
  try {
    execSync(`gh repo edit ${username}/${repoName} --default-branch ${branch}`, {
      encoding: 'utf8'
    });
    console.log(chalk.green(`✅ Set default branch to ${branch}`));
  } catch (e) {
    console.log(chalk.red(`❌ Failed to set default branch`));
  }
}

async function enableFeatures() {
  console.log(chalk.blue('\n⚙️ Enabling repository features...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const { repoName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'repoName',
      message: 'Select repository:',
      choices: repos.map(r => r.name)
    }
  ]);
  
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to enable:',
      choices: [
        { name: 'Wikis', value: 'enable-wiki=true' },
        { name: 'Issues', value: 'enable-issues=true' },
        { name: 'Projects', value: 'enable-projects=true' },
        { name: 'Discussions', value: 'enable-discussions=true' }
      ]
    }
  ]);
  
  for (const feature of features) {
    try {
      execSync(`gh repo edit ${username}/${repoName} ${feature}`, { encoding: 'utf8' });
      console.log(chalk.green(`✅ Enabled ${feature}`));
    } catch (e) {
      console.log(chalk.red(`❌ Failed: ${feature}`));
    }
  }
}

async function getStats() {
  console.log(chalk.blue('\n📊 Repository Statistics...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const stats = {
    total: repos.length,
    public: repos.filter(r => !r.isPrivate).length,
    private: repos.filter(r => r.isPrivate).length,
    withDesc: repos.filter(r => r.description).length,
    withoutDesc: repos.filter(r => !r.description).length,
    withTopics: repos.filter(r => r.repositoryTopics.nodes.length > 0).length,
  };
  
  console.log(chalk.cyan('Overview:'));
  console.log(`  Total Repositories: ${stats.total}`);
  console.log(`  Public: ${stats.public} | Private: ${stats.private}`);
  console.log(`  With Description: ${stats.withDesc} | Without: ${stats.withoutDesc}`);
  console.log(`  With Topics: ${stats.withTopics}`);
}

async function main() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🛠️ Repo Management Tools v1.0.0                        ║
║                                                               ║
║     Manage your GitHub repositories                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: [
        'List All Repositories',
        'Add Topics to Repo',
        'Set Default Branch',
        'Enable Features',
        'Get Statistics',
        'Exit'
      ]
    }
  ]);

  switch (action) {
    case 'List All Repositories':
      await listRepos();
      break;
    case 'Add Topics to Repo':
      await addTopics();
      break;
    case 'Set Default Branch':
      await setDefaultBranch();
      break;
    case 'Enable Features':
      await enableFeatures();
      break;
    case 'Get Statistics':
      await getStats();
      break;
    case 'Exit':
      console.log(chalk.yellow('Goodbye! 👋'));
      process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
