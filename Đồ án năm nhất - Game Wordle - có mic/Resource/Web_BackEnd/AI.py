from flask import Blueprint, render_template, jsonify,request, redirect, url_for
import random
import os

from Finish_AI_UI import Finish_AI_display
from Database import db,Store_User_Login

AI_display = Blueprint("AI_display",
                       __name__,
                        template_folder="../Web_FrontEnd",
                        static_folder="../Web_FrontEnd"
                        )

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_display.register_blueprint(Finish_AI_display)

#Lựa chọn chế độ chơi
difficulty_list = ['easy','medium','hard']
difficulty = difficulty_list[random.randint(0,2)]
type_list = ["english", "vietnamese"]
type = type_list[random.randint(0,1)]


@AI_display.route('/AI_Playing',methods=['GET', 'POST'])
def AI_start_playing():
    # Lấy từ dự đoán đầu tiên
    AI_word = ""
    if type == "english":
        AI_word = "proal"
    else:
        AI_word = "kieng"
    return render_template("AI_Playing/AI_Playing.html", AI_word = AI_word)


# Lấy select word    
@AI_display.route("/Words/AI/select", methods=["GET"])
def select_word():
    if type == "english":
        path = 'Resource/Web_BackEnd/Word/English/word_' + difficulty + '.txt'
    else: 
        path = 'Resource/Web_BackEnd/Word/Vietnamese/word_' + difficulty + '.txt'
    with open(path,'r') as f:
        lines = f.readlines()
        index = random.randint(0,len(lines)-1)
        select_word = lines[index]
        return select_word.strip()


@AI_display.route('/AI_Choose_Word', methods = ['POST'])
def AI_start_choose_word():
    data = request.get_json()
    remainingWordLetters = data.get("remainingWordLetters")
    currentWord = data.get("currentWord")
    word_needed_erased = data.get("word_needed_erased") or []
    # Lấy tất cả valid word
    if type == "english":
        path_all_word = "Resource/Web_BackEnd/Word/English/origin_txt/valid-wordle-words.txt"
    else:
        path_all_word = "Resource/Web_BackEnd/Word/Vietnamese/origin_txt/vi_5words.txt"
    all_word = []
    with open(path_all_word,"r") as f:
        lines = f.readlines()
        for line in lines:
            all_word.append(line.strip())

    valid_list = []
    invalid_list = []
    none_list = []
    min_count_word = [0 for _ in range(26)]
    max_count_word = [5 for _ in range(26)]

    # đếm số lần có thể xuất hiện của các chữ cái
    for index,word_status in enumerate(remainingWordLetters):
        if word_status == False:
            valid_list.append(index)
            min_count_word[ord(currentWord[index])-97]+=1
        elif word_status == "invalid":
            invalid_list.append(index)
            min_count_word[ord(currentWord[index])-97]+=1
    
    for index,word_status in enumerate(remainingWordLetters):
        if word_status != False and word_status != "invalid":
            none_list.append(index)
            max_count_word[ord(currentWord[index])-97] =  min_count_word[ord(currentWord[index])-97]
            

    # Lọc các từ dựa vào valid và invalid word trả về từ js
    all_word_valid = []
    for word in all_word:
        flag = True
        for index in valid_list:
            if currentWord[index] != word[index]:
                flag = False
                break
        if flag:
            all_word_valid.append(word)
    if len(all_word_valid) == 0:
        all_word_valid = all_word

    all_word_valid_invalid = []
    for word in all_word_valid:
        flag = True
        for index in invalid_list:
            if currentWord[index] not in word:
                flag = False
                break
            if currentWord[index] == word[index]:
                flag = False
                break
        if flag:
            all_word_valid_invalid.append(word)
    
    all_word_ok = []
    for word in all_word_valid_invalid:
        if word in word_needed_erased:
            continue
        counts = [0] * 26
        for ch in word:
            counts[ord(ch)-97] += 1

        flag = True
        for i in range(26):
            if counts[i] < min_count_word[i] or counts[i] > max_count_word[i]:
                flag = False
                break
        if flag:
            all_word_ok.append(word)


    next_word = all_word_ok[random.randint(0,len(all_word_ok) - 1)]
            
    return jsonify({
        "ok": True,
        "next_word": next_word,
    })
    
    

# Nếu chiến thắng thì chuyển qua Finish_UI
@AI_display.route("/AIGoFinishing", methods = ["GET"])
def Finish():
    result = request.args.get("result", "unknown")
    return redirect(url_for('AI_display.Finish_AI_display.AI_Finishing',result = result))

# Khởi tạo user cho AI
@AI_display.route("/AIPoint",methods = ["POST"])
def AI_point():
    data = request.get_json()
    point = int(data.get("point"))
    seconds = data.get("seconds")
    username = "AI"
    user = Store_User_Login.query.filter_by(name_user=username).first()

    if not user:
        #Khởi tạo db cho AI
        new_user = Store_User_Login(name_user=username,  password_user='123', point = point, time = seconds)
        db.session.add(new_user)
        
    else:
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


