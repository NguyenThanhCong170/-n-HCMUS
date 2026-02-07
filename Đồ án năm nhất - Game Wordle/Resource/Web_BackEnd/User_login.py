from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from pathlib import Path

from Game import Game_display
from Instruction import Instruction_display
from Score_board import Score_board_display
from AI import AI_display

from Database import db, Store_User_Login
from Database_resume import Store_State

app = Flask(
    __name__,
    template_folder="../Web_FrontEnd", # template là dành cho html
    static_folder="../Web_FrontEnd"  # static là dành cho css, js
)

app.register_blueprint(Game_display)
app.register_blueprint(Instruction_display)
app.register_blueprint(Score_board_display)
app.register_blueprint(AI_display)

ROOT_DIR = Path(__file__).resolve().parents[1]

# Link tới database của login
DB_USER = ROOT_DIR / "Database" / "User-point.db"
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_USER}" 
# Link tới database của game cũ
DB_RESUME = ROOT_DIR / "Database" / "Resume.db"
app.config["SQLALCHEMY_BINDS"] = {
    "resume": f"sqlite:///{DB_RESUME}"
}
db.init_app(app)

app.secret_key = "secret"



@app.route('/', methods=['GET', 'POST'])
def Userlogin():
    if request.method == 'POST':
        # Tên đăng nhập và mật khẩu do người dùng nhập
        username = request.form.get('username')
        password = request.form.get('password')
        difficulty = request.form.get('difficulty')
        type = request.form.get('type')

        # Tên đăng nhập trong hệ thống
        user = Store_User_Login.query.filter_by(name_user=username).first()

        if not user:
            new_user = Store_User_Login(name_user=username, password_user=password)
            db.session.add(new_user)
            db.session.commit()
            session['username'] = username
            session['difficulty'] = difficulty
            session['type'] = type
            return redirect(url_for('Game_display.Playing'))


        if user.password_user == password:
            session['username'] = username
            session['difficulty'] = difficulty
            session['type'] = type
            return redirect(url_for('Game_display.Playing'))

        return render_template("User_login/User_login.html")

    return render_template("User_login/User_login.html")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        db.create_all(bind_key="resume")
    app.run(debug=True)