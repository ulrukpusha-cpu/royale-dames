require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000';

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN manquant dans les variables d’environnement.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    'Bienvenue dans ROYALE DAMES.\n\nTu peux ouvrir la web app ou générer un lien d’invitation pour jouer avec un ami.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Ouvrir Royale Dames', url: webAppUrl }],
          [{ text: '🤝 Inviter un ami', callback_data: 'invite_friend' }]
        ]
      }
    }
  );
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'invite_friend') {
    const code = generateRoomCode();
    const inviteUrl = `${webAppUrl}/?room=${code}`;

    await bot.answerCallbackQuery(query.id).catch(() => {});

    bot.sendMessage(
      chatId,
      `Voici ton lien de salle privée:\n${inviteUrl}\n\nEnvoie-le à ton ami, puis connectez-vous tous les deux.`
    );
  }
});

console.log('Bot Telegram lancé. Utilise CTRL+C pour arrêter.');

