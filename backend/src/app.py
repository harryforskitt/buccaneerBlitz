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

from flask_socketio import SocketIO, emit

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
CORS(app, origins='*')
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'thisisthesecretkey'

# # Define a function to add CORS headers to every response
# def add_cors_headers(response):
#     # Replace '*' with the origin that you want to allow, or use request.headers.get('Origin') to echo the request origin
#     response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
#     response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
#     response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
#     return response

# # Register the add_cors_headers function to be called after each request
# app.after_request(add_cors_headers)

socket = SocketIO(app, cors_allowed_origins="*")
somelist = ["apple", "peas", "juice", "orange"]
f = 0

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

        print('gameID: ', gameID)

        playersQuery = list(parse_json(mycol.find({'_id': ObjectId(gameID)}, {"players": 1})))
        
        client.close()
        print('printing playersQuery')
        print('players query: ', playersQuery)
        # for i in playersQuery:
        #     print("playersQuery[i]: ", playersQuery[i])
        print('printed playersQuery')

        players = playersQuery[0]['players']
        print(players)

        if username not in players:
            message = str('user ' + username + ' is not in game ' + gameID)
            return jsonify({'message' : message}), 401

        return f(*args, **kwargs)
    
    return decorated

def unit_match(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print('verifying that user owns unit')
        json = request.get_json()
        unitID = json.get('unitID')

        token = request.headers.get('Authorization')
        tokenData = getTokenData(token)
        username = (tokenData['user'])        

        client = pymongo.MongoClient(CONNECTION_STRING)

        mydb = client['society']
        mycol = mydb['games']

        # unitUser = mycol.find_one({"units._id": ObjectId(unitID)}, {'units': 1})
        # unitUser = mycol.find_one([{ "$match": {"player": ObjectId(unitID)}}])
        # for i in unitUser:
        #     print('unitUser[i]', i)
        unitCursor = mycol.aggregate([{"$match": {"units._id": ObjectId(unitID)}},
        {"$project": {
            "units": {
                "$filter": {
                    "input": "$units",
                    "as": "unit",
                    "cond": {"$eq": ["$$unit._id", ObjectId(unitID)]}
                }
            }
        }}
        ])
        # index = mycol.aggregate({"$indexOfArray:": [["$units"], [ObjectId(unitID)]] })
        print('found')
        for i in unitCursor:
            print('i in unitCursor: ', i)
            units = i['units']
            unit = units[0]
            unitUser = units[0]['player']
            break
        print('unit: ', unit)
            
        client.close()

        if unitUser != username:
            message = str('user ' + str(username) + ' does not own unit ' + str(unitID))
            print(message)
            return jsonify({'message' : message}), 401
        
        message = str('user ' + str(username) + ' does own unit ' + str(unitUser))
        print(message)

        return f(*args, **kwargs)
    
    return decorated

#This function gets the data from the JWT
def getTokenData(token):
    data = jwt.decode(token, 'thisisthesecretkey', algorithms=["HS256"])
    return(data)

@socket.on('connect')
def handle_connect():
    print('Client connected')
    emit('message', 'Hello from server!')

@socket.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socket.on("message")
def handle_message(msg):
    print(msg)
    # emit('message', 'message')
    global f
    if f < len(somelist):
        socket.emit('message', somelist[f])
        f = f+1

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
    tiles = []
    units = []
    colorRota = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff]
    id = "0"
    k = 0

    for i in range(0, 10):
        for j in range(0, 10):
            
            hex = {}

            hex['_id'] = ObjectId()
            hex['a'] = -i-j
            hex['b'] = 2 * j + i
            hex['c'] = -j
            hex['i'] = i
            hex['j'] = j
            hex['k'] = k
            hex['color'] = colorRota[i % 3]
            hex['startColor'] = colorRota[i % 3]
            # print(hex)
            tiles.append(hex)
            id = str(int(id)+1)
        k += 7.5

    startPositions = random.sample(range(0, len(tiles)), len(players))
    print("start positions: ", startPositions)

    for i in range(0, len(startPositions)):
        print('startPositions[i] :', startPositions[i])
        print('tiles: ', tiles)
        # startPositionString = str(startPositions[i])
        print('tile: ', tiles[startPositions[i]])
        startPosition_id = tiles[startPositions[i]]['_id']
        unit = createUnit(startPosition_id, players[i], 'scout', 2, 100, 2, 20, 1)
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

def createUnit(tile, player, type, movepoints, hp, attackdistance, attackdamage, maxattacks):
    unit = {}
    unit['tile'] = tile
    unit['player'] = player
    unit['type'] = type
    unit['_id'] = ObjectId()
    unit['movepoints'] = movepoints
    unit['usedmovepoints'] = 0
    unit['maxhp'] = hp
    unit['hp'] = hp
    unit['attackdistance'] = attackdistance
    unit['attackdamage'] = attackdamage
    unit['maxattacks'] = maxattacks
    unit['usedattacks'] = 0
    return(unit)


#change this to move selected unit to selected tile (it currently uses a hard-coded unit and tile)
@app.route('/moveUnit', methods=['POST'])
@token_required
@user_match
@unit_match
def moveUnit():
    print(request)
    json = request.get_json()
    print('json received: ', json)
    unitID = json.get('unitID')
    # unitID = ObjectId("6565dc3b7b7ea8ca4c42ffce")
    tile = json.get('tile')
    print('tile to move to: ', tile)
    client = pymongo.MongoClient(CONNECTION_STRING)

    mydb = client['society']
    mycol = mydb['games']
    print(unitID)

    # unit = mycol.find_one({'$elemMatch': { "units._id": ObjectId("655fbf67c57836915cf8acbb")}, "units.player":  "harry"},{"units": 1})
    # unit = mycol.find_one({"tags": ObjectId("655f7b39b8ca04514dd5c427")},{})
    # unit = mycol.find({},{"units"})

    unitCursor = mycol.aggregate([{"$match": {"units._id": ObjectId(unitID)}},
        {"$project": {
            "units": {
                "$filter": {
                    "input": "$units",
                    "as": "unit",
                    "cond": {"$eq": ["$$unit._id", ObjectId(unitID)]}
                }
            }
        }}
        ])
    for i in unitCursor:
        units = i['units']
        unit = units[0]
        print('unit before move: ', unit)
        startTile = units[0]['tile']
        break

    # endTile = mycol.find_one({"_id": ObjectId(endTileID)})
    # endTile = mycol.find_one({"tiles._id": ObjectId("65afdeb6d5431a537eeb1f86")})
    # endTile = mycol.find_one({}, {tilenumber: 1})
    # print('END TILE: ', endTile)
    # ea = unit['a']
    # eb = unit['b']
    # ec = unit['c']

    # print('start tile: ', startTile)
    # print('start a: ', sa)
    # print('start b: ', sb)
    # print('start c: ', sc)
    # print('end tile ID: ', endTileID)
    # print('end a: ', ea)
    # print('end b: ', eb)
    # print('end c: ', ec)

    validmove = validateMove(json['unitID'], json['tile'])
    if validmove == False:
        return({"error": "invalid move (not enough movement?)"}, 400)

    try:
        # Define the filter to match the document by its ID and the specific unit within the array
        filter_query = {"units._id": ObjectId(json['unitID'])}

        # Define the update operation
        update_operation = {"$set": {"units.$.tile": ObjectId(str(json['tile']))}}

        # Execute the update operation
        result = mycol.update_one(filter_query, update_operation)

        # result = mycol.update_one({"_id": ObjectId("65afdeb6d5431a537eeb1fb4")}, { "$set": {"units._id": ObjectId(str(json['tile']))}})
        if result.modified_count == 1:
            print("Tile value updated successfully.")
        else:
            print("No document found to update or update operation failed.")
    except Exception as e:
        print("An error occurred:", e)
    #This should use the actual number of moves used, but I've hardcoded it to 2 for now
    mycol.update_one({"units._id": ObjectId(json['unitID'])}, { "$set": {"units.$.movepointsleft": '0'}})
    mycol.update_one({"units._id": ObjectId(json['unitID'])}, { "$set": {"units.$.usedmovepoints": 2}})

    unitCursor = mycol.aggregate([{"$match": {"units._id": ObjectId(unitID)}},
            {"$project": {
                "units": {
                    "$filter": {
                        "input": "$units",
                        "as": "unit",
                        "cond": {"$eq": ["$$unit._id", ObjectId(unitID)]}
                    }
                }
            }}
            ])
    for i in unitCursor:
        units = i['units']
        unit = units[0]
        print('unit after move: ', unit)
        startTile = units[0]['tile']
        break





    # mycol.update_one({"_id": ObjectId("6563a25e89b2fbac2dff7a15")}, { "$set": {"type": "test"}})
    # mycol.update_one({ "_id": ObjectId(unitID) }, { "$set": {"units.$.tile":  tile}})
    
        
    client.close()

    # socket.emit('message', 'unit moved')
    socket.emit('moveunit', json)

    # print(unit)
    return({"some": "data"}, 200)

def validateMove(unitID, tileID):
    client = pymongo.MongoClient(CONNECTION_STRING)
    mydb = client['society']
    mycol = mydb['games']



    result = mycol.find_one({"units._id": ObjectId(unitID)}) 
    tiles = [tile for _, tile in result["tiles"].items()]
    print('tiles: ', tiles)

    tiles_number = int(len(tiles))
    print('tilesnumber: ', tiles_number)

    tile = next((tile for tile in tiles if tile['_id'] == ObjectId(tileID)), None)
    print('tile: ', tile)

    # get unit
    unitCursor = mycol.aggregate([{"$match": {"units._id": ObjectId(unitID)}},
        {"$project": {
            "units": {
                "$filter": {
                    "input": "$units",
                    "as": "unit",
                    "cond": {"$eq": ["$$unit._id", ObjectId(unitID)]}
                }
            }
        }}
        ])
    client.close()
    for i in unitCursor:
        units = i['units']
        unit = units[0]
        print('unit after move: ', unit)
        startTile = units[0]['tile']
        break


    unit['a'] = tile['a']
    unit['b'] = tile['b']
    unit['c'] = tile['c']
    print('unit: ', unit)

    moverange = int(unit['movepoints'] - int(unit['usedmovepoints']))
    print('range (movepointsleft): ', moverange)

    validMoves = get_moves(unit, moverange, tiles, tiles_number)
    print('validMoves: ', validMoves)
    valid = False
    unittileID = unit['tile']
    print('unittileID: ', unittileID)
    for i in range(0, len(validMoves)):
        print('move: ', validMoves[i]['_id'])
        
        if str(validMoves[i]['_id']) == str(unittileID):
            valid = True
            print('move is valid')
            return(True)
    if valid == False:
        print('move is invalid')
        return(False)
    

def get_moves(unit, moverange, tiles, tiles_number):
    a = unit['a']
    lba = a - moverange
    uba = a + moverange

    b = unit['b']
    lbb = b - moverange
    ubb = b + moverange

    c = unit['c']
    lbc = c - moverange
    ubc = c + moverange

    moves = []
    print('tiles_number ', tiles_number)
    for i in range(0, int(tiles_number)):
        testa = tiles[i]['a']
        testb = tiles[i]['b']
        testc = tiles[i]['c']
        # Assuming 'scene.getObjectByProperty' is a function that returns a tile object
        # tile = scene.getObjectByProperty('_id', tiles[i])
        if (lba <= testa <= uba) and (lbb <= testb <= ubb) and (lbc <= testc <= ubc):
            moves.append(tiles[i])

    return moves

#@app.route("/")
#def hello_world():
    #return "<p>Hello, World!</p>"

@app.route('/simple_start_task')
def call_method():
    app.logger.info("Invoking Method ")
    #                        queue name in task folder.function name
    r = simple_app.send_task('tasks.longtime_add', kwargs={'x': 1, 'y': 2})
    app.logger.info(r.backend)
    return r.id


@app.route('/simple_task_status/<task_id>')
def get_status(task_id):
    status = simple_app.AsyncResult(task_id, app=simple_app)
    print("Invoking Method ")
    return "Status of the Task " + str(status.state)


@app.route('/simple_task_result/<task_id>')
def task_result(task_id):
    result = simple_app.AsyncResult(task_id).result
    return "Result of the Task " + str(result)

print(call_method)

import time
import atexit

from apscheduler.schedulers.background import BackgroundScheduler


def print_date_time():
    print(time.strftime("%A, %d %B %Y %I:%M:%S %p"))

def newturn(gameID):

    client = pymongo.MongoClient(CONNECTION_STRING)
    mydb = client['society']
    mycol = mydb['games']

    turn = mycol.find_one({"_id": ObjectId("6565dc3b7b7ea8ca4c42ffd0")}, {'turn': 1})
    turn = turn['turn']
    turn = int(turn) + 1
    print('turn ', turn)

    mycol.update_one({"_id": ObjectId("6565dc3b7b7ea8ca4c42ffd0")}, { "$set": {"turn": turn}})
    #update all units used movement to 0 - not working yet
    mycol.update_many({}, { "$set": {"units.$[].usedmovepoints": 0}})
    # mycol.update_many({}, { "$set": {"units.$[].movepoints": 2}})
    # mycol.update_many({}, { "$set": {"units.$.usedmovepoints": ObjectId(tile)}})

if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler(job_defaults={'max_instances': 999999})
    scheduler.add_job(func=newturn, args=["6565dc3b7b7ea8ca4c42ffd0"], trigger="interval", seconds=30)
    scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())