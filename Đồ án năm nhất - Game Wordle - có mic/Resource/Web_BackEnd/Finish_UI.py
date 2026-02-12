from flask import Blueprint, render_template, request


Finish_display = Blueprint('Finish_display',
                           __name__,
                           template_folder="../Web_FrontEnd",
                            static_folder="../Web_FrontEnd")

@Finish_display.route('/Finishing', methods = ['GET', 'POST'])
def Finishing():
    result = request.args.get("result")
    return render_template("Finish_UI/Finish_UI.html",result = result)

                                               