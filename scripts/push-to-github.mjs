import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function main() {
  try {
    console.log('🔐 Conectando ao GitHub...');
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Conectado como: ${user.login}`);
    
    const repoName = 'MedicoHelp';
    
    // Check if repo exists
    let repoExists = false;
    try {
      await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });
      repoExists = true;
      console.log(`📦 Repositório ${repoName} já existe`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`📦 Criando repositório ${repoName}...`);
        await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'MédicoHelp - Plataforma Médica com IA (Dra. Clarice)',
          private: false,
          auto_init: false
        });
        console.log('✅ Repositório criado!');
      } else {
        throw error;
      }
    }
    
    const repoUrl = `https://github.com/${user.login}/${repoName}.git`;
    console.log(`\n📍 URL do repositório: ${repoUrl}`);
    console.log('\n⚠️  IMPORTANTE: Você precisa fazer o push manualmente através do terminal do Replit:');
    console.log('\nComandos para executar:');
    console.log('1. git remote remove origin (se já existir)');
    console.log(`2. git remote add origin ${repoUrl}`);
    console.log('3. git add .');
    console.log('4. git commit -m "Initial commit - MédicoHelp v7"');
    console.log('5. git push -u origin main');
    console.log('\n✨ Repositório pronto para receber o código!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
