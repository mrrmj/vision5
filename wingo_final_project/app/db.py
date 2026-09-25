import sqlite3
from contextlib import closing

from app.config import DB_PATH


def _connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with closing(_connect()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value INTEGER NOT NULL CHECK(value BETWEEN 0 AND 9),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()


def add_results(values):
    cleaned = [int(value) for value in values]
    if not cleaned or any(value < 0 or value > 9 for value in cleaned):
        raise ValueError("Every result must be a digit from 0 to 9.")

    with closing(_connect()) as connection:
        connection.executemany(
            "INSERT INTO history (value) VALUES (?)",
            [(value,) for value in cleaned],
        )
        connection.commit()


def get_history(limit=50):
    limit = max(1, min(int(limit), 1000))
    with closing(_connect()) as connection:
        rows = connection.execute(
            "SELECT value FROM history ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [int(row["value"]) for row in reversed(rows)]


def get_history_rows(limit=100):
    limit = max(1, min(int(limit), 1000))
    with closing(_connect()) as connection:
        rows = connection.execute(
            "SELECT id, value, created_at FROM history ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return list(reversed(rows))


def clear_history():
    with closing(_connect()) as connection:
        connection.execute("DELETE FROM history")
        connection.commit()
