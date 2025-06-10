# scripts/convert_graphml_to_json.py
from pyexpat import features
from random import random, randint

import networkx as nx
import json

# Load GraphML file
G = nx.read_graphml("../test_data/expected_JKBAIE.graphml")
nodes = G.nodes(data=True)
# Print nodes and edges for debugging
print("Nodes:")
for node in nodes:
    print(node)

# Convert to React Flow format
nodes = [
    {
        "id": node[0],
        "type": "custom",
        "data": {"sequence": node[1]["aminoacid"],
                 "intensity": randint(1, 5),
                 "feature": node[1].get("feature", "")
                 },
        "position": {"x": node[1]["position"] * 100 if "position" in node[1] else -100, "y": 0},  # basic layout
    }
    for i, node in enumerate(G.nodes(data=True))
]

# Print edges for debugging
print("Edges:")
edges = G.edges(data=True)
for source, target, data in edges:
    print(f"{source} -> {target}")

edges = [
    {
        "id": f"e{source}-{target}",
        "source": str(source),
        "target": str(target),
        "isoforms": data.get("isoforms", ""),
    }
    for source, target, data in G.edges(data=True)
]

# Save to files
with open("../generated/nodes.json", "w") as f:
    json.dump(nodes, f, indent=2)

with open("../generated/edges.json", "w") as f:
    json.dump(edges, f, indent=2)

print("Converted and saved nodes and edges.")
