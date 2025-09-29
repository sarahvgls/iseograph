# scripts/convert_graphml_to_json.py
import argparse
import os
from random import randint

import networkx as nx
import json


def convert_graphml_to_json(input_file, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    print(f"Converting {input_file} to React Flow JSON format...")

    # Load GraphML file
    G = nx.read_graphml(input_file)
    nodes = G.nodes(data=True)
    # Print nodes and edges for debugging
    print("Nodes:")
    for node in nodes:
        print(node)

    # Convert to React Flow format
    nodes = [
        {
            "id": node[0],
            "type": "sequence",
            "data": {"sequence": node[1]["aminoacid"],
                     "peptidesString": node[1].get("peptides", ""),
                     "intensitiesString": node[1].get("intensity", ""),
                     "peptideCount": node[1].get("count", ""),
                     },
            "position": {"x": 0, "y": 0},
        }
        for i, node in enumerate(G.nodes(data=True))
    ]

    # Print edges for debugging
    print("Edges:")
    edges = G.edges(data=True)
    for source, target, data in edges:
        print(f"{source} -> {target}: ", data.get("isoforms", ""), data.get("generic", ""), data.get("peptides", ""),
              data.get("intensity", ""))

    edges = [
        {
            "id": f"e{source}-{target}",
            "source": str(source),
            "target": str(target),
            "type": "arrow",
            "data": {
                "isoformString": data.get("isoforms", ""),
                "generic": data.get("generic", ""),
                "peptidesString": data.get("peptides", ""),
                "intensitiesString": data.get("intensity", ""),
                "peptideCount": data.get("count", ""),
            },
        }
        for source, target, data in G.edges(data=True)
    ]

    # Save to files
    nodes_file = os.path.join(output_dir, "nodes.json")
    edges_file = os.path.join(output_dir, "edges.json")

    with open(nodes_file, "w") as f:
        json.dump(nodes, f, indent=2)

    with open(edges_file, "w") as f:
        json.dump(edges, f, indent=2)

    print("Converted and saved nodes and edges.")


def main():
    parser = argparse.ArgumentParser(description='Convert GraphML file to JSON format for React Flow')
    parser.add_argument('input_file', default='../data/custom.graphml', help='Path to the input GraphML file')
    parser.add_argument('--output-dir', default='../generated', help='Directory for output JSON files')

    args = parser.parse_args()
    convert_graphml_to_json(args.input_file, args.output_dir)


if __name__ == "__main__":
    main()
