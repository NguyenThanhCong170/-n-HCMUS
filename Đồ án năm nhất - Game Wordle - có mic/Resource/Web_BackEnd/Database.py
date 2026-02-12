from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()

class Store_User_Login(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name_user = db.Column(db.String(200), nullable=False)
    password_user = db.Column(db.String(200), nullable = False)
    point = db.Column(db.Integer,nullable = False, default = 0)
    time = db.Column(db.Float,nullable = False, default = 10**10)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return '<User %r> ' % self.id
    
