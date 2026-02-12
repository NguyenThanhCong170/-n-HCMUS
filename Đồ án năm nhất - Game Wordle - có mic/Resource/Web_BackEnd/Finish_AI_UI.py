from flask import Blueprint, render_template, request


Finish_AI_display = Blueprint('Finish_AI_display',
                           __name__,
                           template_folder="../Web_FrontEnd",
                            static_folder="../Web_FrontEnd")

@Finish_AI_display.route('/AIFinishing', methods = ['GET', 'POST'])
def AI_Finishing():
    result = request.args.get("result")
    return render_template("Finish_AI_UI/Finish_AI_UI.html",result = result)
