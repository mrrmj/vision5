# WinGo-style Telegram statistics bot

This project stores manually entered digits, provides a transparent frequency/recentness estimate, and derives Big/Small and Color from the same predicted digit.

It is educational only. WinGo-style games may be random or server-controlled; the bot does not guarantee outcomes, winnings, or accuracy. It does not place bets or scrape third-party services.

## Setup

```bash
cd wingo_final_project
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell:
# .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set `TELEGRAM_BOT_TOKEN` and `ADMIN_PASSWORD`, then run:

```bash
python main.py
```

The dashboard is available at `http://127.0.0.1:5000`.

## Telegram commands

- `/start`
- `/addresult 1 4 8 3 9`
- `/predict`
- `/predict 1 4 8 3 9`
- `/history`
- `/rules`
- `/clearhistory YOUR_ADMIN_PASSWORD`

The GitHub repository ZIP can be downloaded from the repository's **Code → Download ZIP** menu, or directly from the `main` branch archive URL.
