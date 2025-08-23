from pathlib import Path

PROJECT_ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT_DIR / "backend"
FRONTEND_DIR = PROJECT_ROOT_DIR / "frontend"

MAX_GRAPHML_FILES = 15

TEST_MODE = False  # If set to True, the data-test-files are provided instead of the real data files.
EVAL_MODE = True
