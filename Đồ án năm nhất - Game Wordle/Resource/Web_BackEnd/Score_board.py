from flask import Blueprint, render_template, redirect, url_for
from Database import db,Store_User_Login
from sqlalchemy import desc

Score_board_display = Blueprint('Score_board_display',        
                        __name__,
                        template_folder="../Web_FrontEnd",
                        static_folder="../Web_FrontEnd"
                        )

@Score_board_display.route('/ScoreBoard', methods = ['GET', 'POST'])
def Board():
    # uses với người nào có point cao hơn thì được xếp trước
    users = Store_User_Login.query.order_by(
        desc(Store_User_Login.point), 
        Store_User_Login.time.asc(),
        Store_User_Login.id.asc()
        ).all()
    return render_template("Score_board/Score_board.html", users=users)

@Score_board_display.route('/RemoveBoard', methods = ['GET'])
def remove():
    Store_User_Login.query.delete()
    db.session.commit()
    return redirect(url_for('Score_board_display.Board'))