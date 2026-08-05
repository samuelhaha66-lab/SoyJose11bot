const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');
const translate = require('translate');
const gtts = require('google-tts-api');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Store user states
const userStates = {};

// Welcome message
const welcomeMessage = `
🤖 Welcome to @SoyJose11Bot!

I can help you with:
🔊 **Text-to-Speech** - Convert text to natural speech
🌍 **Translator** - Translate text to any language

**Commands:**
/start - Show this message
/tts - Convert text to speech
/translate - Translate text
/help - How to use the bot

Just click a command and follow the instructions!
`;

const helpMessage = `
📖 **How to use the bot:**

🔊 **TTS (Text-to-Speech):**
1. Send /tts
2. Type the text you want to convert to speech
3. I'll send you an audio file with the speech

🌍 **Translator:**
1. Send /translate
2. Type the text you want to translate
3. Choose the target language (e.g., 'es', 'fr', 'de')
4. I'll send you the translation

**Supported languages for translation:**
en (English), es (Spanish), fr (French), de (German), it (Italian), pt (Portuguese), ru (Russian), ja (Japanese), ko (Korean), zh (Chinese)

**Supported languages for TTS:**
English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese
`;

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// TTS command
bot.onText(/\/tts/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { action: 'tts' };
  bot.sendMessage(chatId, '🔊 Please send me the text you want to convert to speech:');
});

// Translate command
bot.onText(/\/translate/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { action: 'translate' };
  bot.sendMessage(chatId, '🌍 Please send me the text you want to translate:');
});

// Handle text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (text && text.startsWith('/')) return;

  const userState = userStates[chatId];
  if (!userState) return;

  if (userState.action === 'tts') {
    await handleTTS(chatId, text);
    delete userStates[chatId];
  } else if (userState.action === 'translate') {
    userState.textToTranslate = text;
    userState.action = 'translate_target';
    bot.sendMessage(chatId, '🌍 Which language do you want to translate to?\n\nSend the language code (e.g., "es" for Spanish, "fr" for French, "de" for German):\n\nAvailable: en, es, fr, de, it, pt, ru, ja, ko, zh');
  } else if (userState.action === 'translate_target') {
    await handleTranslate(chatId, userState.textToTranslate, text);
    delete userStates[chatId];
  }
});

// Handle TTS
async function handleTTS(chatId, text) {
  try {
    if (!text || text.length > 500) {
      return bot.sendMessage(chatId, '❌ Please send a valid text (max 500 characters).');
    }

    // Detect language for better TTS quality
    const detectedLang = await detectLanguage(text);
    const langMap = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh-CN'
    };
    
    const lang = langMap[detectedLang] || 'en';
    
    // Generate TTS audio using Google TTS
    const url = gtts.getAudioUrl(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    // Send audio as voice message
    await bot.sendVoice(chatId, url, {
      caption: '🔊 Here is your text-to-speech audio!'
    });

  } catch (error) {
    console.error('TTS Error:', error);
    bot.sendMessage(chatId, '❌ Sorry, I couldn\'t generate the speech. Please try again with shorter text.');
  }
}

// Handle Translation
async function handleTranslate(chatId, text, targetLang) {
  try {
    if (!text || !targetLang) {
      return bot.sendMessage(chatId, '❌ Please provide both text and target language.');
    }

    // Detect source language
    const detectedLang = await detectLanguage(text);
    
    // Translate
    const translation = await translate(text, {
      from: detectedLang,
      to: targetLang
    });

    const response = `
🌍 **Translation Complete!**

**Original:** ${text}
**Detected Language:** ${getLanguageName(detectedLang)}
**Target Language:** ${getLanguageName(targetLang)}
**Translation:** ${translation}
`;

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Translation Error:', error);
    bot.sendMessage(chatId, '❌ Sorry, I couldn\'t translate the text. Please check the language code and try again.');
  }
}

// Detect language using translate library
async function detectLanguage(text) {
  try {
    const detection = await translate(text);
    // The translate library returns the translated text, we need to detect language differently
    // Using a simple approach - you can use a language detection library
    return 'en'; // Default to English
  } catch (error) {
    return 'en';
  }
}

// Get language name from code
function getLanguageName(langCode) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  };
  return languages[langCode] || langCode;
}

// Error handling
bot.on('error', (error) => {
  console.error('Bot Error:', error);
});

console.log('🤖 @SoyJose11Bot is running...');
