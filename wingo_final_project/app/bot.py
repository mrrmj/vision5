from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from app.config import ADMIN_PASSWORD, BOT_TOKEN
from app.db import add_results, clear_history, get_history
from app.model import NumberTrendModel
from app.rules import get_result_details

model = NumberTrendModel()


def parse_digits(values):
    try:
        parsed = [int(value) for value in values]
    except (TypeError, ValueError) as exc:
        raise ValueError("Only digits from 0 to 9 are allowed.") from exc
    if not parsed or any(value < 0 or value > 9 for value in parsed):
        raise ValueError("Every value must be between 0 and 9.")
    return parsed


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "WinGo-style statistics bot\n\n"
        "/addresult 1 4 8 3 9 - save results\n"
        "/predict - estimate the next number\n"
        "/predict 1 4 8 3 9 - use supplied history\n"
        "/history - show recent results\n"
        "/rules - show number mappings\n"
        "/clearhistory PASSWORD - admin only\n\n"
        "This is an educational statistical tool, not a guaranteed prediction or betting system."
    )


async def rules(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Common WinGo-style mappings used here:\n\n"
        "Small: 0, 1, 2, 3, 4\n"
        "Big: 5, 6, 7, 8, 9\n\n"
        "Violet: 0, 5\n"
        "Green: 1, 3, 7, 9\n"
        "Red: 2, 4, 6, 8\n\n"
        "The bot predicts one number first; size and color are derived from that same number."
    )


async def add_result_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        values = parse_digits(context.args)
        add_results(values)
    except ValueError as error:
        await update.message.reply_text(f"Error: {error}\nUsage: /addresult 1 4 8")
        return
    await update.message.reply_text(
        f"Saved {len(values)} result(s). Recent history: {get_history(10)}"
    )


async def history_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    values = get_history(20)
    await update.message.reply_text(
        "No history yet." if not values else f"Recent history:\n{values}"
    )


async def predict_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        values = parse_digits(context.args) if context.args else get_history(100)
    except ValueError as error:
        await update.message.reply_text(f"Error: {error}")
        return

    if len(values) < 3:
        await update.message.reply_text(
            "At least 3 historical digits are required. Example: /addresult 1 4 8 3"
        )
        return

    number, confidence = model.predict(values)
    details = get_result_details(number)
    await update.message.reply_text(
        "Estimated result\n\n"
        f"Number: {details['number']}\n"
        f"Big/Small: {details['size']}\n"
        f"Color: {details['color']}\n"
        f"Experimental score: {confidence:.1%}\n\n"
        "Past results cannot guarantee the next result."
    )


async def clear_history_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not ADMIN_PASSWORD or len(context.args) != 1 or context.args[0] != ADMIN_PASSWORD:
        await update.message.reply_text("Incorrect password.")
        return
    clear_history()
    await update.message.reply_text("History cleared.")


def build_application():
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is missing in .env")
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("rules", rules))
    application.add_handler(CommandHandler("addresult", add_result_command))
    application.add_handler(CommandHandler("history", history_command))
    application.add_handler(CommandHandler("predict", predict_command))
    application.add_handler(CommandHandler("clearhistory", clear_history_command))
    return application
