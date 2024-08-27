const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TOKEN);

async function getBtcPrice() {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    return parseFloat(response.data.price);
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return null;
  }
}

bot.command('price', async (ctx) => {
  const price = await getBtcPrice();
  if (price) {
    await ctx.reply(`Current BTC price: $${price.toFixed(2)}`);
  } else {
    await ctx.reply("Sorry, I couldn't fetch the BTC price at the moment.");
  }
});

exports.handler = async (event) => {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('error in handler:', e);
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
};