#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏗️ Iniciando build de produção...\n');

// Função para executar comandos
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Executando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Comando executado com sucesso!\n`);
        resolve();
      } else {
        reject(new Error(`❌ Comando falhou com código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Função para matar processos do Electron
function killElectronProcesses() {
  return new Promise((resolve) => {
    console.log('🔄 Verificando processos do Electron...');
    
    const killCommand = process.platform === 'win32' 
      ? 'taskkill /f /im electron.exe 2>nul || echo "Nenhum processo encontrado"'
      : 'pkill -f electron || echo "Nenhum processo encontrado"';
    
    exec(killCommand, (error, stdout, stderr) => {
      if (stdout.includes('Nenhum processo encontrado') || stdout.includes('No matching processes')) {
        console.log('✅ Nenhum processo do Electron em execução');
      } else {
        console.log('✅ Processos do Electron finalizados');
      }
      resolve();
    });
  });
}

// Função para forçar limpeza da pasta dist no Windows
function forceCleanDist() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve();
      return;
    }
    
    console.log('🔄 Forçando limpeza da pasta dist...');
    
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      console.log('✅ Pasta dist não existe');
      resolve();
      return;
    }
    
    // Comando mais agressivo para Windows
    const cleanCommand = `rmdir /s /q "${distDir}" 2>nul || echo "Pasta removida ou não existe"`;
    
    exec(cleanCommand, (error, stdout, stderr) => {
      console.log('✅ Limpeza forçada concluída');
      // Aguardar um pouco para garantir que o sistema libere os arquivos
      setTimeout(resolve, 1000);
    });
  });
}

async function build() {
  try {
    // 1. Matar processos do Electron
    await killElectronProcesses();
    
    // 2. Forçar limpeza da pasta dist (Windows)
    await forceCleanDist();
    
    // 3. Limpar builds anteriores
    console.log('🧹 Limpando builds anteriores...');
    const distDir = path.join(__dirname, 'dist');
    
    // Tentar remover a pasta dist novamente se ainda existir
    if (fs.existsSync(distDir)) {
      try {
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('✅ Pasta dist removida');
      } catch (error) {
        console.log('⚠️ Não foi possível remover a pasta dist, continuando...');
      }
    }

    // 3. Verificar se os arquivos HTML/CSS/JS existem
    console.log('📄 Verificando arquivos HTML/CSS/JS...');
    const indexHtml = path.join(__dirname, 'index.html');
    const stylesDir = path.join(__dirname, 'styles');
    const jsDir = path.join(__dirname, 'js');
    
    if (!fs.existsSync(indexHtml)) {
      throw new Error('Arquivo index.html não encontrado!');
    }
    if (!fs.existsSync(stylesDir)) {
      throw new Error('Pasta styles não encontrada!');
    }
    if (!fs.existsSync(jsDir)) {
      throw new Error('Pasta js não encontrada!');
    }
    console.log('✅ Arquivos HTML/CSS/JS verificados');

    // 5. Build do Electron
    console.log('🖥️ Fazendo build do Electron...');
    const platform = process.platform;
    
    try {
      if (platform === 'win32') {
        await runCommand('npm', ['run', 'build:win']);
      } else if (platform === 'darwin') {
        await runCommand('npm', ['run', 'build:mac']);
      } else {
        await runCommand('npm', ['run', 'build:linux']);
      }
    } catch (error) {
      console.log('⚠️ Erro no build do Electron, tentando método alternativo...');
      
      // Método alternativo: usar electron-builder diretamente
      if (platform === 'win32') {
        await runCommand('npx', ['electron-builder', '--win', '--publish=never']);
      } else if (platform === 'darwin') {
        await runCommand('npx', ['electron-builder', '--mac', '--publish=never']);
      } else {
        await runCommand('npx', ['electron-builder', '--linux', '--publish=never']);
      }
    }

    console.log('🎉 Build concluído com sucesso!');
    console.log(`📁 Arquivos gerados em: ${path.join(__dirname, 'dist')}`);

  } catch (error) {
    console.error('❌ Erro durante o build:', error.message);
    process.exit(1);
  }
}

// Verificar se é o script principal
if (require.main === module) {
  build();
}

module.exports = { build };
