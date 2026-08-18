const TelegramBot = require('node-telegram-bot-api');
const token = 'YOUR_NEW_TOKEN_HERE';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Bot is working!');
});

console.log('Testing bot...');
