import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import pytz
import aiohttp
from http.server import BaseHTTPRequestHandler

# Enable detailed logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

TOKEN = os.getenv('TOKEN')
KYIV_TZ = pytz.timezone('Europe/Kyiv')
CHAT_ID = '-4561434244'

async def get_btc_price():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT') as response:
                if response.status == 200:
                    data = await response.json()
                    return float(data['price'])
                else:
                    logger.error(f"API request failed with status code: {response.status}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching BTC price: {str(e)}")
        return None

async def price_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    price = await get_btc_price()
    if price:
        await update.message.reply_text(f"Current BTC price: ${price:,.2f}")
    else:
        await update.message.reply_text("Sorry, I couldn't fetch the BTC price at the moment.")

async def webhook(request):
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("price", price_command))

    update = Update.de_json(await request.json(), application.bot)
    await application.process_update(update)
    return {"statusCode": 200}

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        asyncio.run(webhook(post_data))
        
        self.send_response(200)
        self.end_headers()
        return