from flask import Flask, render_template

from app.db import get_history_rows


def create_app():
    application = Flask(__name__)

    @application.get("/")
    def index():
        return render_template("index.html", history=get_history_rows(100))

    return application
