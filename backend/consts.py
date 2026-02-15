import sys
from pathlib import Path

# Handle PyInstaller bundled files
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    PROJECT_ROOT_DIR = Path(sys._MEIPASS)
else:
    # Running as script
    PROJECT_ROOT_DIR = Path(__file__).resolve().parent.parent

BACKEND_DIR = PROJECT_ROOT_DIR / "backend"
FRONTEND_DIR = PROJECT_ROOT_DIR / "frontend"

TEST_MODE = False  # If set to True, the data-test-files are provided instead of the real data files.
