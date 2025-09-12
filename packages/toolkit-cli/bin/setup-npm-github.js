#!/usr/bin/env node

/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Fatal error helper: prints a message and exits with non-zero status.
function fatal(msg) {
  console.error('❌', msg);
  process.exit(1);
}

// Only support macOS (darwin) for keychain operations.
if (os.platform() !== 'darwin') {
  fatal('此脚本仅支持 macOS 系统');
}

// Graceful shutdown on signals
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    console.error('\n❌ 脚本被中断');
    process.exit(1);
  });
});

// Parse CLI arguments. Supports `--key=value` and `--key value` and flags.
function parseArgs(argv) {
  const raw = argv.slice(2);
  const out = {};
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (!a.startsWith('--')) continue;
    if (a.includes('=')) {
      const [k, ...rest] = a.slice(2).split('=');
      out[k] = rest.join('=');
    } else {
      const k = a.slice(2);
      const next = raw[i + 1];
      if (next && !next.startsWith('--')) {
        out[k] = next;
        i++;
      } else {
        out[k] = true;
      }
    }
  }
  return out;
}

const parsed = parseArgs(process.argv);
const ORG_DEFAULT = 'yolotechnology';
const org = parsed.org || ORG_DEFAULT;
const dryRun = Boolean(parsed['dry-run']);
const tokenArg = parsed.token || '';
if (parsed.help || parsed.h) {
  console.log('Usage: setup-npm-github [--org ORG] [--dry-run] [--token TOKEN]');
  process.exit(0);
}

// Read secret input from terminal without echoing characters.
function readHidden() {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write('\x1b[33m⚠️  控制台不会显示输入的 GitHub Token，请勿将 Token 泄露给别人\x1b[0m\n');
    stdout.write('\x1b[32m🔒 请输入 GitHub Token 后回车: \x1b[0m');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';

    function onData(ch) {
      if (ch === '\r' || ch === '\n') {
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve(buf);
        return;
      }
      if (ch === '\u0003') { // Ctrl-C
        stdout.write('\n');
        fatal('输入被中断');
      }
      buf += ch;
    }

    stdin.on('data', onData);
  });
}

// Simple yes/no prompt; default is No.
function confirmPrompt(question) {
  return new Promise((resolve) => {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' (y/N): ', (answer) => {
      rl.close();
      const normalized = (answer || '').trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

// Determine user's RC file based on current shell.
function detectRcFile() {
  const shellPath = process.env.SHELL || '';
  const currentShell = path.basename(shellPath);
  if (currentShell === 'zsh') return path.join(os.homedir(), '.zshrc');
  if (currentShell === 'bash') {
    const bashrc = path.join(os.homedir(), '.bashrc');
    const bashProfile = path.join(os.homedir(), '.bash_profile');
    return fs.existsSync(bashrc) ? bashrc : bashProfile;
  }
  console.warn('⚠️ 检测到未适配的 shell:', currentShell);
  return '';
}

// Main flow
(async function main() {
  // Resolve token: from arg, dry-run placeholder, or interactive hidden read.
  let token = '';
  if (tokenArg) token = tokenArg.trim();
  else if (dryRun) {
    token = 'DRY_RUN_TOKEN';
    console.log('ℹ️ dry-run: 使用占位 token，不会写入 Keychain');
  } else {
    token = (await readHidden()).trim();
  }
  if (!token) fatal('GitHub Token 不能为空');

  // Save token to Keychain (unless dry-run)
  if (dryRun) {
    console.log('ℹ️ dry-run: 将要把 token 保存到 macOS Keychain (service: GITHUB_PACKAGES_NPM_TOKEN)');
  } else {
    const ok = await confirmPrompt('准备写入 macOS Keychain 并修改 rc 文件与 ~/.npmrc，是否继续？');
    if (!ok) {
      console.log('已取消');
      process.exit(0);
    }
    try {
      execSync(`security add-generic-password -a "${process.env.USER}" -s GITHUB_PACKAGES_NPM_TOKEN -w "${token}" -U`, { stdio: 'ignore' });
      console.log('✅ Token 已保存到 Keychain');
    } catch (e) {
      fatal('保存 Token 到 Keychain 失败, 请检查权限');
    }
  }

  const rcFile = detectRcFile();
  if (!rcFile) fatal('检测到未适配的 shell，无法写入配置文件，终止脚本');

  try {
    // Ensure rc file exists
    if (!fs.existsSync(rcFile)) {
      if (dryRun) {
        console.log(`ℹ️ dry-run: 将创建 ${rcFile}`);
      } else {
        fs.mkdirSync(path.dirname(rcFile), { recursive: true });
        fs.writeFileSync(rcFile, '');
        console.log(`ℹ️ 未找到 ${rcFile}，已自动创建`);
      }
    }

    const rcContent = fs.existsSync(rcFile) ? fs.readFileSync(rcFile, 'utf8') : '';
    if (!rcContent.includes('GITHUB_PACKAGES_NPM_TOKEN')) {
      const loader = `\n# Load GitHub Packages token from macOS Keychain\nexport NPM_TOKEN="$(security find-generic-password -a \"$USER\" -s GITHUB_PACKAGES_NPM_TOKEN -w 2>/dev/null)"\n`;
      if (dryRun) {
        console.log(`ℹ️ dry-run: 将在 ${rcFile} 追加动态加载 NPM_TOKEN: `);
        console.log(loader);
      } else {
        fs.appendFileSync(rcFile, loader, 'utf8');
        console.log(`✅ 已在 ${rcFile} 添加动态加载 NPM_TOKEN`);
      }
    } else {
      console.log(`ℹ️  ${rcFile} 已经有相关配置，跳过追加`);
    }
    // NOTE: don't try to `source` rc file in a separate execSync call —
    // each execSync runs in its own subshell so the environment won't persist.
    // We read from Keychain below and inject NPM_TOKEN into the env for npm.
  } catch (e) {
    fatal(`写入 ${rcFile} 失败: ${e.message}`);
  }

  // Prepare ~/.npmrc
  const npmrcPath = path.join(os.homedir(), '.npmrc');
  const npmrcContent = `@${org}:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}\n`;
  if (dryRun) {
    console.log('ℹ️ dry-run: 将写入 ~/.npmrc，内容如下:');
    console.log('---');
    console.log(npmrcContent);
    console.log('---');
  } else {
    try {
      fs.writeFileSync(npmrcPath, npmrcContent, { encoding: 'utf8' });
      console.log('✅ 已写入 ~/.npmrc');
    } catch (e) {
      fatal(`写入 ~/.npmrc 失败: ${e.message}`);
    }
  }

  // Basic runtime check for NPM_TOKEN in current env
  console.log('🔍 检查 NPM_TOKEN:');
  if (process.env.NPM_TOKEN) {
    console.log(`🔍 NPM_TOKEN 已成功加载（长度：${process.env.NPM_TOKEN.length}）`);
  } else {
    console.log('❌ NPM_TOKEN 未正确加载');
  }

  if (dryRun) {
    console.log('ℹ️ dry-run: 将运行 `npm whoami --registry=https://npm.pkg.github.com` 来验证登录（不实际执行）');
    console.log('\n⚠️  dry-run 模式，若需要实际验证请重新运行不带 --dry-run 的命令并在交互式 shell 中 `source ~/.zshrc` 或重启终端。');
    process.exit(0);
  }

  // Validate by reading token from Keychain (preferred) or env and running `npm whoami`.
  try {
    let keychainToken = '';
    try {
      keychainToken = execSync(`security find-generic-password -a "${process.env.USER}" -s GITHUB_PACKAGES_NPM_TOKEN -w`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (ke) {
      // Fallback to environment variable
      keychainToken = process.env.NPM_TOKEN || '';
    }

    if (!keychainToken) {
      console.error('❌ 无法从 Keychain 或环境读取到 NPM_TOKEN，请确保已保存到 Keychain 或手动设置 NPM_TOKEN。');
      process.exit(1);
    }

    const envForNpm = Object.assign({}, process.env, { NPM_TOKEN: keychainToken });
    const result = execSync('npm whoami --registry=https://npm.pkg.github.com', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: envForNpm }).trim();
    if (result) {
      console.log(`✅ npm 登录验证成功，用户名: ${result}`);
      console.log('\n⚠️  如果你在非交互式终端运行脚本，可能需要手动运行: source ~/.zshrc \n   或重新启动终端以便在交互 shell 中使用 NPM_TOKEN');
      process.exit(0);
    }
    console.error('❌ 登录验证失败，请检查 token 是否正确');
    process.exit(1);
  } catch (e) {
    console.error('❌ 登录验证失败，请检查 token 是否正确');
    if (e.stdout || e.stderr) {
      try {
        const out = (e.stdout || '') + (e.stderr || '');
        console.error('\n--- npm output ---');
        console.error(out.toString());
        console.error('--- end output ---\n');
      } catch (_) {}
    }
    process.exit(1);
  }

})();
