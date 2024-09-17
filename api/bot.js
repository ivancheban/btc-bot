const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TOKEN);
const CHAT_ID = '-1002289271494';

let lastBtcPrice = null;

function formatPrice(price) {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

async function getBtcPrice() {
  try {
    console.log('Attempting to fetch BTC price from CoinDesk API');
    const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    console.log('CoinDesk API response:', response.data);
    return parseFloat(response.data.bpi.USD.rate.replace(',', ''));
  } catch (error) {
    console.error('Error fetching BTC price:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return null;
  }
}

async function sendBtcPriceUpdate(ctx, price, chatId = CHAT_ID) {
  let message = `🚨 BTC Price Update 🚨\nCurrent BTC price: ${formatPrice(price)} USD`;

  if (lastBtcPrice !== null) {
    const priceChangePercent = ((price - lastBtcPrice) / lastBtcPrice) * 100;
    let emoji;
    if (price > lastBtcPrice) {
      emoji = "🟩";
    } else if (price < lastBtcPrice) {
      emoji = "🔻";
    } else {
      emoji = "▪️";
    }
    message += `\n${emoji} Change: ${priceChangePercent.toFixed(2)}%`;
  }

  await ctx.telegram.sendMessage(chatId, message);
  lastBtcPrice = price;
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
    await sendBtcPriceUpdate(ctx, price, ctx.chat.id);
  } else {
    await ctx.reply("Sorry, I couldn't fetch the BTC price at the moment.");
  }
});

exports.handler = async (event) => {
  try {
    console.log('Received webhook event:', event.body);
    
    // Check if this is a GitHub Actions trigger
    if (event.body && JSON.parse(event.body).trigger === 'github_action') {
      console.log('Triggered by GitHub Actions');
      await checkBtcPrice(bot);
      return { statusCode: 200, body: 'Price check triggered by GitHub Actions' };
    }
    
    // Handle regular Telegram updates
    await bot.handleUpdate(JSON.parse(event.body));
    
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Error in handler:', e);
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
};