# -*- coding: utf-8 -*-

''' Import statements '''
import csv, sys, json
from collections import defaultdict

edges = []
file = open("/Users/Dave/Sites/viz-whiz/examples/data/network_hs.json")
data = json.load(file)
total_nodes = 15
exceptions = ["021205","168403","021101","020806","116109","020813"]
nodes = []
new_nodes = []
for index, node in enumerate(data["nodes"]):
    if node["id"] not in exceptions:
        nodes.append(index)
        new_nodes.append(node)
    else:
        total_nodes = total_nodes - 1
    if len(nodes)-1 == total_nodes:
        break

edges = []
used_nodes = []
for edge in data["edges"]:
    if edge["source"] in nodes and edge["target"] in nodes:
        edge["source"] = nodes.index(edge["source"])
        edge["target"] = nodes.index(edge["target"])
        if edge["source"] not in used_nodes:
            used_nodes.append(edge["source"])
        if edge["target"] not in used_nodes:
            used_nodes.append(edge["target"])
        edges.append(edge)

print nodes, used_nodes
unused = []
for node in nodes:
    if node not in used_nodes:
        unused.append(data["nodes"][node]["id"])
    
print "Unused: ",unused

        
data["nodes"] = new_nodes
data["edges"] = edges

with open("/Users/Dave/Sites/viz-whiz/examples/data/network_hs_test.json", "w") as f:
  f.write(json.dumps(data))
