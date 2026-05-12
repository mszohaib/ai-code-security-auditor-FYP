"""Flask entrypoint wiring CORS and analysis routes."""

from flask import Flask
from flask_cors import CORS

from config import Config
from routes.analyze import analyze_bp


def create_app() -> Flask:
    application = Flask(__name__)
    CORS(application, resources={r"/*": {"origins": "*"}})
    application.register_blueprint(analyze_bp)
    return application


app = create_app()


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=True)
