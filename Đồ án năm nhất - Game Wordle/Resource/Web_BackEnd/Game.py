from flask import Blueprint, render_template, session, request, send_from_directory, redirect, url_for, jsonify
import os
import random

from Finish_UI import Finish_display
from Database import db,Store_User_Login
from Database_resume import Store_State

Game_display = Blueprint('Game_display',        
                        __name__,
                        template_folder="../Web_FrontEnd",
                        static_folder="../Web_FrontEnd"
                        )

Game_display.register_blueprint(Finish_display)

# Chơi
@Game_display.route('/Playing', methods=['GET', 'POST'])
def Playing():
    username = session.get('username')
    return render_template("Game/Game.html", username = username)

# Lưu trạng thái game
@Game_display.route("/game/state", methods=["GET", "POST", "DELETE"])
def game_state():
    username = session.get('username')

    if request.method == "GET":
        game_resume = Store_State.query.filter_by(name_user=username).first()

        state = {
            "select_word": game_resume.select_word,
            "history": game_resume.history,
            "currentWord": game_resume.currentWord,
            "point": game_resume.point,
            "start": game_resume.start,
            "boardState": game_resume.boardState
        }
        return jsonify(ok=True, state=state)

    if request.method == "POST":
        data = request.get_json()

        game_resume = Store_State.query.filter_by(name_user=username).first()
        if not game_resume:
            game_resume = Store_State(
                name_user=username,
                select_word=data.get("select_word"),
                history=data.get("history"),
                currentWord=data.get("currentWord"),
                point=int(data.get("point")),
                start=float(data.get("start")),
                boardState=data.get("boardState")
            )
            db.session.add(game_resume)
        else:
            game_resume.select_word = data.get("select_word")
            game_resume.history = data.get("history")
            game_resume.currentWord = data.get("currentWord")
            game_resume.point = int(data.get("point"))
            game_resume.start =float(data.get("start"))
            game_resume.boardState = data.get("boardState")
        db.session.commit()
        return jsonify(ok=True)

    if request.method == "DELETE":
        row = Store_State.query.filter_by(name_user=username).first()
        if row:
            db.session.delete(row)
            db.session.commit()
        return jsonify(ok=True)


# Lấy valid word
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@Game_display.route("/Words/valid", methods=["GET"])
def words_en5():
    type = session.get('type') 
    if type == "english":
        folder = os.path.join(BASE_DIR, "Word", "English", "origin_txt")
        return send_from_directory(folder, "valid-wordle-words.txt")
    else:
        return jsonify(ok=False), 400

# Lấy select word    
@Game_display.route("/Words/select", methods=["GET"])
def select_word():
    difficulty = session.get('difficulty')
    if difficulty == "random":
        difficulty_list = ['easy','medium','hard']
        difficulty = difficulty_list[random.randint(0,2)]
    
    type = session.get('type') 
    if type == "english":
        path = 'Web_BackEnd/Word/English/word_' + difficulty + '.txt'
    else: 
        path = 'Web_BackEnd/Word/Vietnamese/word_' + difficulty + '.txt'
    with open(path,'r') as f:
        lines = f.readlines()
        index = random.randint(0,len(lines)-1)
        select_word = lines[index]
        return select_word.strip()


# Nếu chiến thắng thì chuyển qua Finish_UI
@Game_display.route("/GoFinishing", methods = ["GET"])
def Finish():
    result = request.args.get("result", "unknown")
    return redirect(url_for('Game_display.Finish_display.Finishing',result = result))

#Lưu lại điểm số của lượt chơi
@Game_display.route("/point", methods = ["POST"])
def save_point():
    data = request.get_json() 
    point = int(data.get("point"))
    seconds = data.get("seconds")

    username = session.get('username')
    user = Store_User_Login.query.filter_by(name_user=username).first()

    if point > user.point:
        user.point = point
        user.time = seconds
    if point == user.point:
        if seconds < user.time:
            user.time = seconds
    db.session.commit()

    return jsonify({
        'ok': True
    })
