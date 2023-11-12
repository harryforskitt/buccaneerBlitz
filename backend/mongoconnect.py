#test connection to mongodb

#Make sure COSMOS_CONNECTION_STRING  is set as a PERMANENT environment variable
#When moving to production, will probably need to fix SSL cert issue with this: https://www.youtube.com/watch?v=dEBN1M609zk

import os
import sys

import pymongo
from dotenv import load_dotenv

load_dotenv()
CONNECTION_STRING = os.environ.get("COSMOS_CONNECTION_STRING")
client = pymongo.MongoClient(CONNECTION_STRING)

mydb = client['society']
mycol = mydb['games']

#insert
new_game = {"_id": "2", "name": "harry's second test game"}
mycol.insert_one(new_game)

#read all
# for i in mycol.find():
#     print(i)

#select
print(list(mycol.find({}, {})))

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

client.close()