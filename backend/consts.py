from pathlib import Path

PROJECT_ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT_DIR / "backend"
FRONTEND_DIR = PROJECT_ROOT_DIR / "frontend"

MAX_GRAPHML_FILES = 15

TEST_MODE = False  # If set to True, the data-test-files are provided instead of the real data files.
EVAL_MODE = False
# EVAL_DIR = "many_siblings"
# EVAL_DIR = "large_nodes_150_nodes" #done
# EVAL_DIR = "length_of_graph" # done
# EVAL_DIR = "large_nodes" # outdated
# EVAL_DIR = "many_isoforms_150_nodes" # done
EVAL_DIR = "many_edges"  # done
