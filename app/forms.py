from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, DecimalField, SelectField, SelectMultipleField, DateField, TextAreaField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional, NumberRange


class RegistrationForm(FlaskForm):
    username = StringField(
        "Username",
        validators=[DataRequired(), Length(min=3, max=80)],
    )
    email = StringField(
        "Email",
        validators=[DataRequired(), Email(), Length(max=120)],
    )
    password = PasswordField(
        "Password",
        validators=[DataRequired(), Length(min=8, max=128)],
    )
    confirm_password = PasswordField(
        "Confirm Password",
        validators=[DataRequired(), EqualTo("password", message="Passwords must match")],
    )
    submit = SubmitField("Register")


class LoginForm(FlaskForm):
    email = StringField(
        "Email",
        validators=[DataRequired(), Email(), Length(max=120)],
    )
    password = PasswordField("Password", validators=[DataRequired()])
    remember = BooleanField("Remember me")
    submit = SubmitField("Login")


class TripForm(FlaskForm):
    name = StringField("Trip Name", validators=[DataRequired(), Length(max=140)])
    destination = StringField("Destination", validators=[Optional(), Length(max=140)])
    start_date = DateField("Start Date", validators=[Optional()], format="%Y-%m-%d")
    end_date = DateField("End Date", validators=[Optional()], format="%Y-%m-%d")
    submit = SubmitField("Save Trip")


class ParticipantForm(FlaskForm):
    name = StringField("Participant Name", validators=[DataRequired(), Length(max=120)])
    email = StringField("Email", validators=[Optional(), Email(), Length(max=120)])
    submit = SubmitField("Add Participant")


class ExpenseForm(FlaskForm):
    title = StringField("Expense Title", validators=[DataRequired(), Length(max=140)])
    amount = DecimalField(
        "Amount",
        validators=[DataRequired(), NumberRange(min=0.01)],
        places=2,
    )
    category = SelectField(
        "Category",
        choices=[
            ("Transportation", "Transportation"),
            ("Food", "Food"),
            ("Lodging", "Lodging"),
            ("Activities", "Activities"),
            ("Supplies", "Supplies"),
            ("Other", "Other"),
        ],
        validators=[DataRequired()],
    )
    payer = SelectField("Payer", coerce=int, validators=[DataRequired()])
    shared_participants = SelectMultipleField("Shared By", coerce=int, validators=[Optional()])
    date = DateField("Expense Date", validators=[DataRequired()], format="%Y-%m-%d")
    notes = TextAreaField("Notes", validators=[Optional(), Length(max=500)])
    submit = SubmitField("Record Expense")
