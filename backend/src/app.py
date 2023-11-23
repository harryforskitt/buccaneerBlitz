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

import random

#This is a helper functino to parse BSON from MongoDB to JSON
from bson import json_util
from bson.objectid import ObjectId
def parse_json(data):
    return json.loads(json_util.dumps(data))

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'thisisthesecretkey'
CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")

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

def user_match(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print('verifying user')
        print(request)
        token = request.headers.get('Authorization')
        tokenData = getTokenData(token)
        username = (tokenData['user'])

        gameID = request.headers.get('gameID')
        client = pymongo.MongoClient(CONNECTION_STRING)

        mydb = client['society']
        mycol = mydb['games']

        playersQuery = list(parse_json(mycol.find({'_id': ObjectId(gameID)}, {"players": 1})))
        
        client.close()

        players = playersQuery[0]['players']
        print (players)

        if username not in players:
            message = str('user ' + username + ' is not in game ' + gameID)
            return jsonify({'message' : message}), 401

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
    token = request.headers.get('Authorization')
    tokenData = getTokenData(token)
    username = (tokenData['user'])
    return jsonify({'username' : username})

@app.route('/listGames', methods=['GET'])
@token_required
def listGames():
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']

    games = list(parse_json(mycol.find({})))

    # print(games)

    client.close()
    # return jsonify({games})
    # print('games', games)
    return games

@app.route('/getGame', methods=['GET'])
@token_required
@user_match
def getGame():
    token = request.headers.get('Authorization')
    tokenData = getTokenData(token)
    username = (tokenData['user'])
    print("username: ", username)
    gameID = request.headers.get('gameID')

    print('getting game')
    
    print('gameID: ', gameID)

    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']

    games = list(parse_json(mycol.find({'_id': ObjectId(gameID)}, {})))

    # print('games', games)

    # print(type(games[0]['_id']))

    client.close()
    # return jsonify({games})
    # print('games', games)
    return games

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
        token = jwt.encode({'user' : inputUsername , 'exp' : datetime.datetime.utcnow() + datetime.timedelta(hours=8)}, app.config['SECRET_KEY'], algorithm="HS256")
        print('returning token')
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
    players = request.get_json().get('players')
    print('players: ', players)
    game = {}
    tiles = {}
    units = []
    colorRota = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff]
    id = "0"
    k = 0

    for i in range(0, 10):
        for j in range(0, 10):
            
            hex = {}
            hex['a'] = -i-j
            hex['b'] = 2 * j + i
            hex['c'] = -j
            hex['i'] = i
            hex['j'] = j
            hex['k'] = k
            hex['color'] = colorRota[i % 3]
            # print(hex)
            tiles[id] = hex
            id = str(int(id)+1)
        k += 7.5

    startPositions = random.sample(range(0, len(tiles)), len(players))
    print("start positions: ", startPositions)

    for i in range(0, len(startPositions)):
        unit = createUnit(startPositions[i], players[i], 'scout')
        # units[ObjectId()] = unit
        units.append(unit)

    print('units: ', units)

    # print('tiles: ', tiles)

    #print(game)
    CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']

    #insert
    new_game = {"name": name, "tiles": tiles, "players": players, "units": units}
    mycol.insert_one(new_game)

    client.close()
    print('new game units: ', new_game['units'])
    response = flask.jsonify(game)
    return response

def createUnit(tile, player, type):
    unit = {}
    unit['tile'] = tile
    unit['player'] = player
    unit['type'] = type
    unit['_id'] = ObjectId()
    return(unit)

@app.route('/moveUnit', methods=['POST'])
@token_required
@user_match
def moveUnit():
    print(request)
    json = request.get_json()
    unitID = json.get('unitID')['$oid']
    print('unit id from json: ', unitID)
    tile = json.get('tile')
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']
    print('trying to find')
    print(unitID)

    print('unitID: ', unitID)
    # unit = mycol.find_one({'$elemMatch': { "units._id": ObjectId("655fbf67c57836915cf8acbb")}, "units.player":  "harry"},{"units": 1})
    # unit = mycol.find_one({"tags": ObjectId("655f7b39b8ca04514dd5c427")},{})
    # unit = mycol.find({},{"units"})

    unit = mycol.aggregate([{"$match": {"units._id": ObjectId("655fbf67c57836915cf8acbb")}},
        {"$project": {
            "units": {
                "$filter": {
                    "input": "$units",
                    "as": "unit",
                    "cond": {"$eq": ["$$unit._id", ObjectId("655fbf67c57836915cf8acbb")]}
                }
            }
        }}
        ])

    print('found')
    for doc in unit:
        print(doc)
        break
    client.close()
    print('unit: ', unit)

    return({"some": "data"})

#@app.route("/")
#def hello_world():
    #return "<p>Hello, World!</p>"
