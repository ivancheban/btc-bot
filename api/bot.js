const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TOKEN);
const CHAT_ID = '-4561434244';

let lastBtcPrice = null;
let lastNotificationTime = null;

async function getBtcPrice() {
  try {
    console.log('Attempting to fetch BTC price from CoinGecko API');
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    console.log('CoinGecko API response:', response.data);
    return response.data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching BTC price:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return null;
  }
}

async function sendBtcPriceUpdate(ctx, price, force = false, chatId = CHAT_ID) {
  const currentTime = new Date();

  if (lastBtcPrice === null) {
    lastBtcPrice = price;
    lastNotificationTime = currentTime;
    await ctx.telegram.sendMessage(chatId, `🚨 BTC Price Update 🚨\nCurrent BTC price: $${price.toFixed(2)}`);
    return;
  }

  const priceChangePercent = ((price - lastBtcPrice) / lastBtcPrice) * 100;

  if (force || Math.abs(priceChangePercent) >= 2 || (currentTime - lastNotificationTime) >= 3600000) { // 3600000 ms = 1 hour
    let emoji;
    if (price > lastBtcPrice) {
      emoji = "🟩";  // Green square for price increase
    } else if (price < lastBtcPrice) {
      emoji = "🔻";  // Red down-pointing triangle for price decrease
    } else {
      emoji = "▪️";  // Black square for no change (unlikely with float values)
    }

    const message = `🚨 BTC Price Update 🚨\nCurrent BTC price: $${price.toFixed(2)}\n${emoji} Change: ${priceChangePercent.toFixed(2)}%`;
    await ctx.telegram.sendMessage(chatId, message);
    lastBtcPrice = price;
    lastNotificationTime = currentTime;
  }
}

async function checkBtcPrice(ctx) {
  const price = await getBtcPrice();
  if (price) {
    await sendBtcPriceUpdate(ctx, price);
  } else {
    console.error("Failed to fetch BTC price");
  }
}

bot.command('price', async (ctx) => {
  console.log('Price command received');
  const price = await getBtcPrice();
  if (price) {
    await sendBtcPriceUpdate(ctx, price, true, ctx.chat.id);
  } else {
    await ctx.reply("Sorry, I couldn't fetch the BTC price at the moment.");
  }
});

// We can't use setInterval in a serverless function, so we'll remove it
// and rely on periodic invocations of the function instead

exports.handler = async (event) => {
  try {
    console.log('Received webhook event:', event.body);
    await bot.handleUpdate(JSON.parse(event.body));
    
    // Check BTC price after handling the update
    await checkBtcPrice(bot);
    
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Error in handler:', e);
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
};