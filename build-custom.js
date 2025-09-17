#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

console.log('🚀 SMX LiveBoard - Build Personalizado\n');

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

// Função para perguntar o nome
function askName() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Digite o nome do executável (sem .exe): ', (answer) => {
      rl.close();
        resolve(answer.trim() || 'SMX-Liveboard');
    });
  });
}

async function buildCustom() {
  try {
    // Perguntar o nome
    const customName = await askName();
    console.log(`\n📦 Criando executável: ${customName}.exe\n`);

    // Limpar builds anteriores
    console.log('🧹 Limpando builds anteriores...');
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    // Build do Electron
    console.log('🏗️ Fazendo build do Electron...');
    await runCommand('npx', ['electron-builder', '--win', 'portable', '--publish=never']);

    // Renomear executável
    console.log('📁 Renomeando executável...');
    const oldPath = path.join(distDir, 'SMX-LiveBoard-Portable.exe');
    const newPath = path.join(distDir, `${customName}.exe`);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Executável criado: dist/${customName}.exe`);
    } else {
      console.log('❌ Erro: Executável não encontrado');
    }

    console.log('\n🎉 Build concluído!');
    console.log(`📁 Localização: dist/${customName}.exe`);

  } catch (error) {
    console.error('❌ Erro durante o build:', error.message);
    process.exit(1);
  }
}

// Executar se for o script principal
if (require.main === module) {
  buildCustom();
}

module.exports = { buildCustom };
