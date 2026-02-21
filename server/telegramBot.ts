/**
 * Bot Telegram intégré - Royale Dames
 * Stocke les chat IDs, diffuse les alertes de parties en ligne
 */
import TelegramBot from 'node-telegram-bot-api';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://royale-dames.vercel.app';
const CHAT_IDS_FILE = join(process.cwd(), 'chat-ids.json');

let bot: TelegramBot | null = null;
let registerRoomCodeFn: ((code: string) => void) | null = null;

export function registerRoomCode(fn: (code: string) => void) {
  registerRoomCodeFn = fn;
}

function loadChatIds(): number[] {
  try {
    if (existsSync(CHAT_IDS_FILE)) {
      const data = JSON.parse(readFileSync(CHAT_IDS_FILE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('Erreur lecture chat-ids:', e);
  }
  return [];
}

function saveChatId(chatId: number) {
  const ids = loadChatIds();
  if (!ids.includes(chatId)) {
    ids.push(chatId);
    try {
      writeFileSync(CHAT_IDS_FILE, JSON.stringify(ids, null, 2));
    } catch (e) {
      console.warn('Erreur sauvegarde chat-ids:', e);
    }
  }
}

function removeChatId(chatId: number) {
  const ids = loadChatIds().filter(id => id !== chatId);
  try {
    writeFileSync(CHAT_IDS_FILE, JSON.stringify(ids, null, 2));
  } catch (e) {
    console.warn('Erreur suppression chat-id:', e);
  }
}

/** Lance le bot et retourne true si OK */
export function startTelegramBot(): boolean {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN manquant - alertes bot désactivées');
    return false;
  }
  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    saveChatId(chatId);
    bot!.sendMessage(
      chatId,
      'Bienvenue dans ROYALE DAMES 🎯\n\nTu peux ouvrir la web app ou générer un lien d’invitation pour jouer avec un ami.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎲 Ouvrir Royale Dames', web_app: { url: WEB_APP_URL } }],
            [{ text: '🤝 Inviter un ami', callback_data: 'invite_friend' }]
          ]
        }
      }
    );
  });

  bot.on('callback_query', async (query) => {
    if (!query.message) return;
    const chatId = query.message.chat.id;
    if (query.data === 'invite_friend') {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      registerRoomCodeFn?.(code);
      const inviteUrl = `${WEB_APP_URL}/?room=${code}`;
      await bot!.answerCallbackQuery(query.id).catch(() => {});
      bot!.sendMessage(
        chatId,
        `Voici ton lien de salle privée :\n${inviteUrl}\n\nEnvoie-le à ton ami, puis connectez-vous tous les deux.`
      );
    }
  });

  console.log('Bot Telegram lancé (alertes parties en ligne activées)');
  return true;
}

/**
 * Diffuse un message à tous les utilisateurs ayant démarré le bot
 * Quand quelqu'un clique "En ligne" avec une mise
 */
export function broadcastMatchSearch(
  betAmount: number,
  betCurrency: string,
  username?: string
): void {
  if (!bot) return;
  const ids = loadChatIds();
  if (ids.length === 0) return;

  const mise = betAmount > 0
    ? (betCurrency === 'USD' ? `${betAmount} $` : `${betAmount} ${betCurrency}`)
    : 'sans mise';

  const message = `🎮 *Partie en ligne disponible !*\n\n` +
    `Un joueur cherche un adversaire • Mise : *${mise}*\n\n` +
    `Rejoins vite pour ne pas le rater ! 👇`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '🎲 Rejoindre la partie', web_app: { url: WEB_APP_URL } }]
    ]
  };

  ids.forEach((chatId) => {
    bot!.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }).catch((err) => {
      if (err?.response?.body?.description?.includes('blocked') ||
          err?.response?.body?.description?.includes('deactivated')) {
        removeChatId(chatId);
      }
    });
  });
}
