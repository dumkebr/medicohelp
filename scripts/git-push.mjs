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
    throw new Error('X_REPLIT_TOKEN not found');
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

async function main() {
  try {
    console.log('🔐 Obtendo token do GitHub...');
    const token = await getAccessToken();
    
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    console.log(`✅ Autenticado como: ${user.login}`);
    
    const repoUrl = `https://${token}@github.com/${user.login}/MedicoHelp.git`;
    
    console.log('\n📦 Configurando remote...');
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch (e) {
      // Remote não existe, ok
    }
    
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    
    console.log('\n📝 Verificando branch...');
    try {
      execSync('git branch -M main', { stdio: 'inherit' });
    } catch (e) {
      console.log('Branch já é main');
    }
    
    console.log('\n🚀 Fazendo push para o GitHub...');
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    
    console.log('\n✅ Código enviado com sucesso para GitHub!');
    console.log(`📍 Veja em: https://github.com/${user.login}/MedicoHelp`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
