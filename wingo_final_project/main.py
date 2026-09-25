import threading

from app.bot import build_application
from app.config import FLASK_HOST, FLASK_PORT
from app.dashboard import create_app
from app.db import init_db


def run_dashboard():
    create_app().run(host=FLASK_HOST, port=FLASK_PORT, debug=False, use_reloader=False)


if __name__ == "__main__":
    init_db()
    dashboard_thread = threading.Thread(target=run_dashboard, daemon=True)
    dashboard_thread.start()
    print(f"Dashboard: http://127.0.0.1:{FLASK_PORT}")
    print("Telegram bot is starting...")
    build_application().run_polling()
