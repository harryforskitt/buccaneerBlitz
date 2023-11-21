#Before running the flask app, run the follwing to activate the virtual environemnt:
#. .venv/bin/activate

#Use the command below to run in debug mode (live updates when you save changes)
#flask run --debug

#this looks funny but it makes sure vscode recognises both flask and Flask
import flask
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS, cross_origin
import json
import jwt
from jwt import decode
import datetime
from functools import wraps

#Database dependencies:

import os
import sys
import pymongo
from dotenv import load_dotenv

#This is a helper functino to parse BSON from MongoDB to JSON
from bson import json_util
def parse_json(data):
    return json.loads(json_util.dumps(data))

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'thisisthesecretkey'
CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")

users = []

class User:
    def __init__(self, username, password):
        self.username = username
        self.password = password

users.append(User('harry', 'password'))

games = []

#This will need to get game UUIDs from database, it's used when creating a new game to ensure that the game's ID is not duplicated
gameIDs = []

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print('verifying token')
        print(request)
        token = request.headers.get('Authorization') #http://1237.0.0.1:500/route?token=ahglhajkghdajkslghsajklg
        print('token: ' + str(token))

        if not token:
            return jsonify({'message' : 'Token is missing!'}), 401

        try:
            print('trying to decode')
            data = jwt.decode(token, 'thisisthesecretkey', algorithms=["HS256"])
        except:
            return jsonify({'message' : 'Token is invalid'}), 401

        return f(*args, **kwargs)
    
    return decorated

#This function gets the data from the JWT
def getTokenData(token):
    data = jwt.decode(token, 'thisisthesecretkey', algorithms=["HS256"])
    return(data)

#This route returns the username from the JWT
@app.route('/getUsername', methods=['GET'])
@token_required
def getUsername():
    for i in range(0, len(users)):
        if users[i].JWT == request.headers.get('Authorization'):
            username = users[i].username
            break
    return jsonify({'username' : username})

@app.route('/listGames', methods=['GET'])
@token_required
def listGames():
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']

    games = list(parse_json(mycol.find({}, {"name": 1})))

    print(games)

    client.close()
    # return jsonify({games})
    print('games', games)
    return games

def createGameID():
    id = len(games)
    while True:
        id += 1;
        if id not in games:
            return(id)




@app.route('/', methods=['GET'])
def yourMethod():
    # username = request.get_json().get('username')
    # password = request.get_json().get('password')
    # print(username)
    # print(password)
    response = flask.jsonify({'some': 'data5'})
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
    inputUsername = request.get_json().get('username')
    inputPassword = request.get_json().get('password')

    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['users']

    storedPassword = mycol.find_one({"username": inputUsername}, {"password": 1})['password']

    client.close()

    if inputPassword == storedPassword:
        token = jwt.encode({'user' : inputUsername , 'exp' : datetime.datetime.utcnow() + datetime.timedelta(minutes=30)}, app.config['SECRET_KEY'], algorithm="HS256")
        print('returning token')
        users[0].JWT = token
        print(users[0].JWT)
        # for i in range(0, len(users)):
        #     if users[i].username == username:
        #         users[i].JWT = user
        #         break
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

@app.route('/createGame', methods=['POST'])
@cross_origin()
def create_game():
    name = request.get_json().get('name')
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
    CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']

    #insert
    new_game = {"name": name}
    mycol.insert_one(new_game)
    client.close()
    return response

units = []

def createUnit(tile, user, type):
    unit = {}
    unit.tile = tile
    unit.user = user
    unit.type = type
    units.append(unit)

#@app.route("/")
#def hello_world():
    #return "<p>Hello, World!</p>"
