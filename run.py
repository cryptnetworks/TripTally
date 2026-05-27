
import os
import click
from flask.cli import with_appcontext
from app import create_app
from app.extensions import db
from app.models import User, Trip, Participant, Expense, ExpenseShare

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "User": User,
        "Trip": Trip,
        "Participant": Participant,
        "Expense": Expense,
        "ExpenseShare": ExpenseShare,
    }

@app.cli.command("init-db")
@with_appcontext
def init_db():
    """Initialize the database schema."""
    db.create_all()
    click.echo("Initialized the database.")

@app.cli.command("reset-db")
@with_appcontext
@click.confirmation_option(prompt="Are you sure you want to reset the database? This will delete all data.")
def reset_db():
    """Drop and recreate database tables for development cleanup."""
    database_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    sqlite_path = None

    if database_uri.startswith("sqlite:///"):
        sqlite_path = database_uri.replace("sqlite:///", "", 1)

    if sqlite_path:
        try:
            if os.path.exists(sqlite_path):
                os.remove(sqlite_path)
                click.echo(f"Removed SQLite database file: {sqlite_path}")
        except OSError as exc:
            click.echo(f"Could not remove database file: {exc}")

    db.drop_all()
    db.create_all()
    click.echo("Database reset complete.")

@app.cli.command("info")
def info():
    """Show startup environment and database info."""
    click.echo(f"FLASK_ENV={app.config.get('ENV')}\nDATABASE_URI={app.config.get('SQLALCHEMY_DATABASE_URI')}")

@app.cli.command("seed-demo")
@with_appcontext
def seed_demo():
    """Load sample demo data for TripTally."""
    if User.query.filter_by(email="demo@triptally.app").first():
        click.echo("Demo user already exists. Skipping seed.")
        return

    demo_user = User(username="demo", email="demo@triptally.app")
    demo_user.set_password("DemoPass123")

    bay_trip = Trip(
        name="Coastal Weekend",
        destination="Monterey Bay",
        start_date="2025-09-05",
        end_date="2025-09-08",
        owner=demo_user,
    )

    alice = Participant(name="Alice", email="alice@example.com", trip=bay_trip)
    bob = Participant(name="Bob", email="bob@example.com", trip=bay_trip)
    claire = Participant(name="Claire", email="claire@example.com", trip=bay_trip)

    expense1 = Expense(
        title="Rental Car",
        amount=360.00,
        category="Transportation",
        payer=alice,
        trip=bay_trip,
        date="2025-09-05",
        notes="Compact SUV for the weekend",
    )

    expense2 = Expense(
        title="Dinner",
        amount=142.25,
        category="Food",
        payer=bob,
        trip=bay_trip,
        date="2025-09-06",
        notes="Seafood dinner at the wharf",
    )

    expense3 = Expense(
        title="Groceries",
        amount=78.92,
        category="Supplies",
        payer=claire,
        trip=bay_trip,
        date="2025-09-06",
        notes="Breakfast and snack items",
    )

    for expense in [expense1, expense2, expense3]:
        participants = [alice, bob, claire]
        share_amount = expense.amount / len(participants)
        for participant in participants:
            expense.shares.append(
                ExpenseShare(participant=participant, share_amount=share_amount)
            )

    db.session.add(demo_user)
    db.session.commit()
    click.echo("Seeded demo data successfully.")

if __name__ == "__main__":
    print("Starting TripTally...")
    print(f"Using database: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    try:
        app.run(host="0.0.0.0", port=8888)
    except Exception as exc:
        print("Failed to start TripTally:", exc)
        raise
