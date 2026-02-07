from sqlalchemy.ext.mutable import MutableList
from Database import db


class Store_State(db.Model):
    __bind_key__ = "resume" 
    id = db.Column(db.Integer, primary_key = True)
    name_user = db.Column(db.String(200),unique=True, nullable=False)
    select_word = db.Column(db.String(200), nullable=False)
    history = db.Column(MutableList.as_mutable(db.JSON), nullable=False, default=list)
    currentWord = db.Column(db.String(200), nullable=False)
    point = db.Column(db.Integer,nullable = False, default = 0)
    start = db.Column(db.Float,nullable = False, default = 10**10)
    boardState = db.Column(MutableList.as_mutable(db.JSON), nullable=False, default=list)

    def __repr__(self):
        return '<User %r> ' % self.id