#this looks funny but it makes sure vscode recognises both flask and Flask
import flask
from flask import Flask, request
from flask_cors import CORS, cross_origin
import json

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/', methods=['GET'])
def yourMethod():
    response = flask.jsonify({'some': 'data'})
    #Allow cross-origin requests
    #response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# ADD APP ROUTE FOR sendGame POST
@app.route('/post', methods=['POST'])
@cross_origin()
def handle_post():
    data = json.loads(request.data)
    #data.headers.add("Access-Control-Allow-Origin", "*")
    print(data)
    return data

@app.route('/createMap', methods=['GET'])
@cross_origin()
def create_map():
    colorRota = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff]
    tiles = {}
    id = 0
    for i in range(0, 3):
        for j in range(0, 3):
            #SET COLOR
            class Hex:
                def toJSON(self):
                    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
            hex = {}
            hex['a'] = -i-j
            hex['b'] = 2 * j + i
            hex['c'] = -j
            hex['color'] = colorRota[i % 3]
            print(hex)
            tiles[id] = hex
            id+=1
        id+=1
    print(tiles)
    response = flask.jsonify(tiles)
    #Allow cross-origin requests
    #response.headers.add('Access-Control-Allow-Origin', '*')
    return response


#@app.route("/")
#def hello_world():
    #return "<p>Hello, World!</p>"
