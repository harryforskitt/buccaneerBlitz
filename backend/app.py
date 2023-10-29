#this looks funny but it makes sure vscode recognises both flask and Flask
import flask
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS, cross_origin
import json
import jwt
from jwt import decode
import datetime
from functools import wraps

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'thisisthesecretkey'

games = []

#This will need to get game UUIDs from database, it's used when creating a new game to ensure that the game's ID is not duplicated
gameIDs = []

def createGameID():
    id = len(games)
    while True:
        id += 1;
        if id not in games:
            return(id)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token') #http://1237.0.0.1:500/route?token=ahglhajkghdajkslghsajklg
        print('token: ' + token)

        if not token:
            return jsonify({'message' : 'Token is missing!'}), 401

        try:
            print('trying to decode')
            data = jwt.decode(token, 'thisisthesecretkey', algorithms=["HS256"])
        except:
            return jsonify({'message' : 'Token is invalid'}), 401

        return f(*args, **kwargs)
    
    return decorated


@app.route('/', methods=['POST'])
def yourMethod():
    username = request.get_json().get('username')
    password = request.get_json().get('password')
    print(username)
    print(password)
    response = flask.jsonify({'some': 'data'})
    #Allow cross-origin requests
    #response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/unprotected')
def unprotected():
    return jsonify({'message' : 'Anyone can view this!'})

@app.route('/protected')
@token_required
def protected():
    return jsonify({'message' : 'This is only available for people with valid tokens.'})

@app.route('/login', methods=['POST'])
def login():
    print('login called')
    username = request.get_json().get('username')
    password = request.get_json().get('password')

    if username == 'harry' and password == 'password':
        token = jwt.encode({'user' : username , 'exp' : datetime.datetime.utcnow() + datetime.timedelta(minutes=30)}, app.config['SECRET_KEY'], algorithm="HS256")
        print('returning token')
        return jsonify({'token' : token})

    return make_response('Could not verify', 401, {'WWW-Authenticate' : 'Basic realm="Login Required"'})

# ADD APP ROUTE FOR sendGame POST
@app.route('/post', methods=['POST'])
@cross_origin()
def handle_post():
    data = json.loads(request.data)
    #data.headers.add("Access-Control-Allow-Origin", "*")
    print(data)
    return data

@app.route('/createGame', methods=['GET'])
@cross_origin()
def create_game():
    game = {}
    game['id'] = createGameID()
    colorRota = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff]
    tiles = {}
    id = 0
    k = 0
    for i in range(0, 10):
        for j in range(0, 10):
            #SET COLOR
            class Hex:
                def toJSON(self):
                    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
            hex = {}
            hex['a'] = -i-j
            hex['b'] = 2 * j + i
            hex['c'] = -j
            hex['i'] = i
            hex['j'] = j
            hex['k'] = k
            hex['color'] = colorRota[i % 3]
            print(hex)
            tiles[id] = hex
            id+=1
        k += 7.5
    game['map'] = tiles
    games.append(game)
    print(game)
    response = flask.jsonify(game)
    #Allow cross-origin requests
    #response.headers.add('Access-Control-Allow-Origin', '*')
    return response


#@app.route("/")
#def hello_world():
    #return "<p>Hello, World!</p>"
