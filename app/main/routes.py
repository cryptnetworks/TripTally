from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.extensions import db
from app.forms import TripForm, ParticipantForm, ExpenseForm
from app.models import Trip, Participant, Expense, ExpenseShare

main_bp = Blueprint("main", __name__)


def _get_owner_trip(trip_id):
    return Trip.query.filter_by(id=trip_id, owner_id=current_user.id).first()


@main_bp.route("/")
@login_required
def dashboard():
    trips = Trip.query.filter_by(owner_id=current_user.id).order_by(Trip.start_date.desc()).all()
    return render_template("main/dashboard.html", trips=trips)


@main_bp.route("/trips/new", methods=["GET", "POST"])
@login_required
def create_trip():
    form = TripForm()
    if form.validate_on_submit():
        trip = Trip(
            name=form.name.data.strip(),
            destination=form.destination.data.strip() if form.destination.data else None,
            start_date=form.start_date.data,
            end_date=form.end_date.data,
            owner=current_user,
        )
        db.session.add(trip)
        db.session.commit()
        flash("Trip created successfully.", "success")
        return redirect(url_for("main.trip_detail", trip_id=trip.id))

    return render_template("main/trip_form.html", form=form, title="Create Trip")


@main_bp.route("/trips/<int:trip_id>/edit", methods=["GET", "POST"])
@login_required
def edit_trip(trip_id):
    trip = _get_owner_trip(trip_id)
    if not trip:
        flash("Trip not found or access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    form = TripForm(obj=trip)
    if form.validate_on_submit():
        trip.name = form.name.data.strip()
        trip.destination = form.destination.data.strip() if form.destination.data else None
        trip.start_date = form.start_date.data
        trip.end_date = form.end_date.data
        db.session.commit()
        flash("Trip updated successfully.", "success")
        return redirect(url_for("main.trip_detail", trip_id=trip.id))

    return render_template("main/trip_form.html", form=form, title="Edit Trip")


@main_bp.route("/trips/<int:trip_id>/delete", methods=["POST"])
@login_required
def delete_trip(trip_id):
    trip = _get_owner_trip(trip_id)
    if trip:
        db.session.delete(trip)
        db.session.commit()
        flash("Trip deleted successfully.", "success")
    else:
        flash("Trip not found or access denied.", "danger")

    return redirect(url_for("main.dashboard"))


@main_bp.route("/trips/<int:trip_id>")
@login_required
def trip_detail(trip_id):
    trip = _get_owner_trip(trip_id)
    if not trip:
        flash("Trip not found or access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    balances, settlements = trip.calculate_balances()
    return render_template(
        "main/trip_detail.html",
        trip=trip,
        balances=balances,
        settlements=settlements,
    )


@main_bp.route("/trips/<int:trip_id>/participants/new", methods=["GET", "POST"])
@login_required
def add_participant(trip_id):
    trip = _get_owner_trip(trip_id)
    if not trip:
        flash("Trip not found or access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    form = ParticipantForm()
    if form.validate_on_submit():
        participant = Participant(
            name=form.name.data.strip(),
            email=form.email.data.lower().strip() if form.email.data else None,
            trip=trip,
        )
        db.session.add(participant)
        db.session.commit()
        flash("Participant added to trip.", "success")
        return redirect(url_for("main.trip_detail", trip_id=trip.id))

    return render_template("main/participant_form.html", form=form, trip=trip)


@main_bp.route("/trips/<int:trip_id>/expenses/new", methods=["GET", "POST"])
@login_required
def add_expense(trip_id):
    trip = _get_owner_trip(trip_id)
    if not trip:
        flash("Trip not found or access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    participants = trip.participants
    if not participants:
        flash("Add participants before creating an expense.", "warning")
        return redirect(url_for("main.trip_detail", trip_id=trip.id))

    form = ExpenseForm()
    form.payer.choices = [(p.id, p.name) for p in participants]
    form.shared_participants.choices = [(p.id, p.name) for p in participants]

    if form.validate_on_submit():
        payer = Participant.query.filter_by(id=form.payer.data, trip_id=trip.id).first()
        selected_ids = form.shared_participants.data or [participant.id for participant in participants]
        shared_participants = Participant.query.filter(
            Participant.trip_id == trip.id,
            Participant.id.in_(selected_ids),
        ).all()

        if not shared_participants:
            flash("Select at least one participant for the expense.", "warning")
            return render_template("main/expense_form.html", form=form, trip=trip)

        expense = Expense(
            title=form.title.data.strip(),
            amount=form.amount.data,
            category=form.category.data,
            date=form.date.data,
            notes=form.notes.data.strip() if form.notes.data else None,
            payer=payer,
            trip=trip,
        )
        db.session.add(expense)
        db.session.flush()

        per_person_share = float(expense.amount) / len(shared_participants)
        for participant in shared_participants:
            expense.shares.append(
                ExpenseShare(participant=participant, share_amount=round(per_person_share, 2))
            )

        db.session.commit()
        flash("Expense recorded successfully.", "success")
        return redirect(url_for("main.trip_detail", trip_id=trip.id))

    return render_template("main/expense_form.html", form=form, trip=trip)
