from flask import Blueprint, render_template

Instruction_display = Blueprint('Instruction_display',        
                        __name__,
                        template_folder="../Web_FrontEnd",
                        static_folder="../Web_FrontEnd"
                        )

@Instruction_display.route('/Instruction', methods=['GET', 'POST'])
def Instruction():
    return render_template("Instruction/Instruction.html")