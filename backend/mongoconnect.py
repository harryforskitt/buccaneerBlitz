#test connection to mongodb

#Make sure COSMOS_CONNECTION_STRING  is set as a PERMANENT environment variable
#When moving to production, will probably need to fix SSL cert issue with this: https://www.youtube.com/watch?v=dEBN1M609zk

import os
import sys

import pymongo
# from dotenv import load_dotenv
from bson.objectid import ObjectId

# load_dotenv()
CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")
print("Connection string: ", CONNECTION_STRING)
client = pymongo.MongoClient(CONNECTION_STRING)

mydb = client['society']
mycol = mydb['games']
mydata = mycol['_id']

#insert
# new_game = {"_id": "4", "name": "harry's fourth test game"}
# mycol.insert_one(new_game)

#set turn to 0
# mycol.update_one({"_id": ObjectId("6565dc3b7b7ea8ca4c42ffd0")}, { "$set": {"turn": "0"}})

#udpate all units in one game:


# for i in mycol.find():
#     if i['_id'] == ObjectId("6565dc3b7b7ea8ca4c42ffd0"):
#         print(i['units'])

tilenumber = 'tiles.'+'0'
# endTile = mycol.find_one({"tiles._id": ObjectId("65b276857464b78484fb7443")}, {"$.tiles._id": 1})
# print('END TILE: ', endTile)


    # 6565dc3b7b7ea8ca4c42ffd0

# Delete all documents in the collection
# mycol.delete_many({})

# select unit by ID
# unitCursor = mycol.aggregate([{"$match": {"tiles.$._id": ObjectId("65b276857464b78484fb7443")}},
#         {"$project": {
#             "units": {
#                 "$filter": {
#                     "input": "$tiles",
#                     "as": "tiles",
#                     "cond": {"$eq": ["$$tiles._id", ObjectId("65b276857464b78484fb7443")]}
#                 }
#             }
#         }}
#         ])
# for i in unitCursor:
#     tile = i
#     print(tile)
#     break
# print(tile)

unitCursor = mycol.aggregate([{"$match": {"tiles._id": ObjectId("65b276857464b78484fb7443")}},
        {"$project": {
            "tiles": {
                "$filter": {
                    "input": "$tiles",
                    "as": "tile",
                    "cond": {"$eq": ["$$tile._id", ObjectId("65b276857464b78484fb7443")]}
                }
            }
        }}
        ])
print('found')
for i in unitCursor:
    print('i in unitCursor: ', i)
    units = i['tiles']
    unit = units[0]
    print('unit: ', unit)
    break

# #select


# udpate unit tile
# mycol.update_one({ "units._id": ObjectId("6560aded82be688c9ea474d8") }, { "$set": {"units.$.tile":  "1"}})

# for prop, value in vars(client.options).items():
#     print("Property: {}: Value: {} ".format(prop, value))

# # Get server information
# print("Server info:")
# for k, v in client.server_info().items():
#     print("Key: {} , Value: {}".format(k, v))

# # Get server status of admin database
# print("Server status:")
# print("Server status {}".format(client.admin.command("serverStatus")))

# # List databases
# print("Databases:")
# databases = client.list_database_names()
# print("Databases: {}".format(databases))

# unitID = ObjectId("6563a25e89b2fbac2dff7a15")
# mycol.update_one({"units._id": ObjectId("6563a25e89b2fbac2dff7a15")}, { "$set": {"units.$.type": "test2"}})
# mycol.update_one({"_id": ObjectId("6565e5c04cb6af43923bbb92")}, { "$set": {"moves": []}})


# unitID = "6565dc3b7b7ea8ca4c42ffcb"
# tile = "6565dc3b7b7ea8ca4c42ff7c"
# move = {"type": "move", "unitID": ObjectId(unitID), "tileID": ObjectId(tile)}
# print('move before storage: ', move)
# mycol.update_one({"_id": ObjectId("6565e5c04cb6af43923bbb92")}, { "$push": {"moves": move}})

# movesCursor = mycol.find({'_id': ObjectId("6565e5c04cb6af43923bbb92")}, {"moves": 1})

# moves = []

# for i in movesCursor:
#     moves.append(i)

# print(moves)

# moveQuery = moves[0]['moves'][2][0]
# moveFilter = moves[0]['moves'][2][1]

# print('moveQuery: ', moveQuery)
# print('moveFilter: ', moveFilter)

# fullquery = asdict()

# print(fullquery)

# mycol.update_one(fullquery)
     
# print(list(mycol.find({"units._id": ObjectId("6563a25e89b2fbac2dff7a15")}, {})))

#read all
# for i in mycol.find():
#     print(i)


client.close()