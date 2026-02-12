from User_login import app, Store_User_Login

with app.app_context():
    users = Store_User_Login.query.all()
    for user in users:
        print(user.id, user.name_user, user.password_user,user.point)
