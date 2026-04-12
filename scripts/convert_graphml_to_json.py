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

    # Group edges by (source, target) and merge them
    edge_dict = {}
    for source, target, data in G.edges(data=True):
        edge_key = (str(source), str(target))
        if edge_key not in edge_dict:
            edge_dict[edge_key] = {
                "isoformString": data.get("isoforms", ""),
                "generic": data.get("generic", ""),
                "init_met": data.get("init_met", False),
                "signal": data.get("signal", False),
                "cleaved": data.get("cleaved", False),
                "cleaved_feature": data.get("cleaved_feature", ""),
                "peptidesString": data.get("peptides", ""),
                "intensitiesString": data.get("intensity", ""),
                "peptideCount": data.get("count", ""),
            }
        else:
            # Merge data from multiple edges with same source and target
            merged_data = edge_dict[edge_key]
            new_data = {
                "isoformString": data.get("isoforms", ""),
                "generic": data.get("generic", ""),
                "init_met": data.get("init_met", False),
                "signal": data.get("signal", False),
                "cleaved": data.get("cleaved", False),
                "cleaved_feature": data.get("cleaved_feature", ""),
                "peptidesString": data.get("peptides", ""),
                "intensitiesString": data.get("intensity", ""),
                "peptideCount": data.get("count", ""),
            }

            # Helper function to get default value for a field
            def get_default(field):
                if field in ["init_met", "signal", "cleaved"]:
                    return False
                if field in ["isoformString"]:
                    return "canonical"
                return "None"

            # For each field, prioritize non-default values
            for field in merged_data.keys():
                default_val = get_default(field)
                current_val = merged_data[field]
                new_val = new_data[field]

                # Check if both current and new values are non-default and different
                if current_val != default_val and new_val != default_val and current_val != new_val:
                    raise ValueError(
                        f"Conflicting non-default values for '{field}' in edges {edge_key}: "
                        f"'{current_val}' vs '{new_val}'. Multiple edges must have at most one non-default value."
                    )

                # Prioritize non-default value
                if new_val != default_val:
                    merged_data[field] = new_val

    edges = [
        {
            "id": f"e{source}-{target}",
            "source": source,
            "target": target,
            "type": "arrow",
            "data": data,
        }
        for (source, target), data in edge_dict.items()
    ]

    # Verify no duplicate edges exist (each source-target pair should appear exactly once)
    edge_pairs = [(edge["source"], edge["target"]) for edge in edges]
    if len(edge_pairs) != len(set(edge_pairs)):
        duplicate_pairs = [pair for pair in edge_pairs if edge_pairs.count(pair) > 1]
        raise ValueError(f"Duplicate edges found after merge: {set(duplicate_pairs)}")

    print(f"Merge completed: {len(G.edges())} original edges merged to {len(edges)} unique edges.")

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
