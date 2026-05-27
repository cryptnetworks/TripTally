import os
from flask import Flask
from .extensions import db, login_manager, csrf
from .auth.routes import auth_bp
from .main.routes import main_bp
from config import DevelopmentConfig, ProductionConfig


def create_app():
    """Create and configure the TripTally Flask application."""
    app = Flask(__name__, template_folder="templates", static_folder="static")
    env = os.getenv("FLASK_ENV", "development")
    app.config.from_object(DevelopmentConfig if env != "production" else ProductionConfig)

    # Initialize reusable Flask extensions with this app instance.
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    # Register the main application blueprints.
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    # Ensure all models are imported before attempting to create tables.
    with app.app_context():
        try:
            from . import models  # noqa: F401
            db.create_all()
            app.logger.info("Database initialized successfully")
        except Exception as exc:
            app.logger.error("Database initialization failed: %s", exc)

    # Configure the Flask-Login user loader after models import.
    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app
