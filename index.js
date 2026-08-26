const http = require('http');
const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');

// =============================================================
//   RENDER & UPTIMEROBOT İÇİN WEB SUNUCUSU (7/24 AKTİF TUTUCU)
// =============================================================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Atena BoxPvP AFK Botu 7/24 Aktif ve Çalışıyor!');
}).listen(PORT, () => {
  console.log(`[HTTP Web Server] Port ${PORT} üzerinde dinleniyor (Render & UptimeRobot hazır).`);
});

// =============================================================
//                  MINECRAFT BOT AYARLARI
// =============================================================
const configPath = path.join(__dirname, 'config.json');
let config = {
  host: 'olds-trains.tun.ply.gg',
  port: 25565,
  username: 'Atena_AFK',
  version: '1.19.4',
  password: 'atenapro123',
  jump_interval_seconds: 20,
  auto_reconnect_seconds: 10
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.log('[!] config.json okunamadi, varsayilan ayarlar kullaniliyor.');
  }
}

let jumpTimer = null;
let isReconnecting = false;
let hasSentAuth = false;

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('tr-TR');
}

function startBot() {
  isReconnecting = false;
  hasSentAuth = false;
  
  console.log('\n=============================================================');
  console.log(`[${getTime()}] Atena BoxPvP AFK Botu Baslatiliyor...`);
  console.log(`Sunucu: ${config.host}:${config.port}`);
  console.log(`Bot Adi: ${config.username}`);
  console.log('=============================================================\n');

  const bot = mineflayer.createBot({
    host: config.host,
    port: parseInt(config.port) || 25565,
    username: config.username,
    version: config.version || '1.19.4',
    hideErrors: false
  });

  bot.once('spawn', () => {
    console.log(`\n[${getTime()}] [+] Bot sunucuya girdi!`);
    
    // Yalnizca 1 KERE giris yap (Spam yapmaz)
    setTimeout(() => {
      if (!hasSentAuth) {
        hasSentAuth = true;
        console.log(`[${getTime()}] [*] Tek seferlik giris komutu gonderiliyor...`);
        bot.chat(`/login ${config.password}`);
      }
    }, 1500);

    // Ziplama Dongusu (Anti-AFK)
    if (jumpTimer) clearInterval(jumpTimer);
    const intervalMs = (config.jump_interval_seconds || 20) * 1000;
    
    jumpTimer = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 350);
        console.log(`[${getTime()}] [AFK] Ziplama yapildi.`);
      }
    }, intervalMs);
  });

  // Sohbeti dinle (Register gerekiyorsa)
  bot.on('message', (jsonMsg) => {
    const raw = jsonMsg.toString().trim();
    if (!raw) return;
    
    console.log(`[CHAT] ${raw}`);

    const lower = raw.toLowerCase();
    if (lower.includes('/register') && !hasSentAuth) {
      hasSentAuth = true;
      bot.chat(`/register ${config.password} ${config.password}`);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`\n[${getTime()}] [!] Bot atildi: ${JSON.stringify(reason)}`);
    cleanupAndReconnect();
  });

  bot.on('error', (err) => {
    console.log(`\n[${getTime()}] [x] Hata: ${err.message || err}`);
    cleanupAndReconnect();
  });

  bot.on('end', () => {
    console.log(`\n[${getTime()}] [!] Baglanti kapandi.`);
    cleanupAndReconnect();
  });

  function cleanupAndReconnect() {
    if (jumpTimer) {
      clearInterval(jumpTimer);
      jumpTimer = null;
    }
    if (!isReconnecting) {
      isReconnecting = true;
      const waitSec = config.auto_reconnect_seconds || 10;
      console.log(`[${getTime()}] [*] ${waitSec} saniye sonra tekrar baglanacak...`);
      setTimeout(() => {
        startBot();
      }, waitSec * 1000);
    }
  }
}

startBot();
