import os
import logging
import json
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import pytz
import aiohttp

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

async def webhook(event, context):
    """
    This function processes incoming webhook events from Telegram.
    """
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("price", price_command))

    try:
        update = Update.de_json(json.loads(event['body']), application.bot)
        await application.process_update(update)
    except Exception as e:
        logger.error(f"Error processing update: {str(e)}")

    return {"statusCode": 200}

def handler(event, context):
    """
    This is the main handler function for AWS Lambda / Netlify Function.
    It wraps the asynchronous webhook function in a synchronous call.
    """
    return asyncio.get_event_loop().run_until_complete(webhook(event, context))