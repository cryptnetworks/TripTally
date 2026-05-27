from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    trips = db.relationship("Trip", back_populates="owner", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Trip(db.Model):
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    destination = db.Column(db.String(140), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    owner = db.relationship("User", back_populates="trips")
    participants = db.relationship("Participant", back_populates="trip", cascade="all, delete-orphan")
    expenses = db.relationship("Expense", back_populates="trip", cascade="all, delete-orphan")

    def calculate_balances(self):
        totals = {
            participant.id: {
                "participant": participant,
                "paid": 0.0,
                "owed": 0.0,
                "net": 0.0,
            }
            for participant in self.participants
        }

        for expense in self.expenses:
            if expense.payer_id in totals:
                totals[expense.payer_id]["paid"] += float(expense.amount)

            if expense.shares:
                for share in expense.shares:
                    totals[share.participant_id]["owed"] += float(share.share_amount)
            else:
                count = max(len(self.participants), 1)
                equal_share = float(expense.amount) / count
                for summary in totals.values():
                    summary["owed"] += equal_share

        for summary in totals.values():
            summary["net"] = round(summary["paid"] - summary["owed"], 2)

        settlements = self.generate_settlement_suggestions(totals)
        return totals, settlements

    @staticmethod
    def generate_settlement_suggestions(totals):
        creditors = [item for item in totals.values() if item["net"] > 0]
        debtors = [item for item in totals.values() if item["net"] < 0]
        creditors.sort(key=lambda item: item["net"], reverse=True)
        debtors.sort(key=lambda item: item["net"])

        recommendations = []
        i = j = 0

        while i < len(debtors) and j < len(creditors):
            debtor = debtors[i]
            creditor = creditors[j]
            amount = min(creditor["net"], -debtor["net"])
            if amount <= 0:
                break

            recommendations.append(
                f"{debtor['participant'].name} owes {creditor['participant'].name} ${amount:.2f}"
            )
            debtor["net"] += amount
            creditor["net"] -= amount

            if abs(debtor["net"]) < 0.01:
                i += 1
            if abs(creditor["net"]) < 0.01:
                j += 1

        return recommendations


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)

    trip = db.relationship("Trip", back_populates="participants")
    expenses_paid = db.relationship("Expense", back_populates="payer", cascade="all, delete-orphan")
    shares = db.relationship("ExpenseShare", back_populates="participant", cascade="all, delete-orphan")

    @property
    def total_paid(self):
        return sum(expense.amount for expense in self.expenses_paid)

    @property
    def total_owed(self):
        return sum(share.share_amount for share in self.shares)

    @property
    def net_balance(self):
        return round(self.total_paid - self.total_owed, 2)


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    payer_id = db.Column(db.Integer, db.ForeignKey("participants.id"), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)

    payer = db.relationship("Participant", back_populates="expenses_paid")
    trip = db.relationship("Trip", back_populates="expenses")
    shares = db.relationship("ExpenseShare", back_populates="expense", cascade="all, delete-orphan")

    def build_equal_shares(self):
        participants = [share.participant for share in self.shares]
        count = len(participants)
        if count == 0:
            return []

        amount = float(self.amount) / count
        for share in self.shares:
            share.share_amount = round(amount, 2)

        return self.shares


class ExpenseShare(db.Model):
    __tablename__ = "expense_shares"

    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey("expenses.id"), nullable=False)
    participant_id = db.Column(db.Integer, db.ForeignKey("participants.id"), nullable=False)
    share_amount = db.Column(db.Numeric(10, 2), nullable=False)

    expense = db.relationship("Expense", back_populates="shares")
    participant = db.relationship("Participant", back_populates="shares")
