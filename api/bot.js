const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TOKEN);

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

bot.command('price', async (ctx) => {
  console.log('Price command received');
  const price = await getBtcPrice();
  if (price) {
    console.log(`Sending BTC price: $${price.toFixed(2)}`);
    await ctx.reply(`Current BTC price: $${price.toFixed(2)}`);
  } else {
    console.log('Failed to fetch BTC price');
    await ctx.reply("Sorry, I couldn't fetch the BTC price at the moment.");
  }
});

exports.handler = async (event) => {
  try {
    console.log('Received webhook event:', event.body);
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Error in handler:', e);
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
};