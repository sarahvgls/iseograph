#!/usr/bin/env python
"""
Build script for creating a PyInstaller executable of the web application.
This script automates the entire build process:
1. Builds the frontend with pnpm
2. Collects static files
3. Prepares dependencies
4. Creates PyInstaller executable
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Get the project root directory
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = BASE_DIR / "dist"
BUILD_DIR = BASE_DIR / "build"


def run_command(command, cwd=None, shell=False):
    """Run a shell command and handle errors."""
    print(f"\n{'=' * 60}")
    print(f"Running: {' '.join(command) if isinstance(command, list) else command}")
    print(f"{'=' * 60}\n")

    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            check=True,
            text=True,
            capture_output=False
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return False
    except FileNotFoundError as e:
        print(f"Command not found: {e}")
        return False


def check_pnpm_installed():
    """Check if pnpm is installed."""
    try:
        subprocess.run(["pnpm", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def build_frontend():
    """Build the frontend using pnpm."""
    print("\n" + "=" * 60)
    print("STEP 1: Building Frontend")
    print("=" * 60)

    if not FRONTEND_DIR.exists():
        print(f"Error: Frontend directory not found at {FRONTEND_DIR}")
        return False

    # Check if pnpm is installed
    if not check_pnpm_installed():
        print("Error: pnpm is not installed. Please install pnpm first:")
        print("  npm install -g pnpm")
        return False

    # Install dependencies
    print("\nInstalling frontend dependencies...")
    if not run_command(["pnpm", "install"], cwd=FRONTEND_DIR):
        print("Failed to install frontend dependencies")
        return False

    # Build the frontend
    print("\nBuilding frontend...")
    if not run_command(["pnpm", "run", "build"], cwd=FRONTEND_DIR):
        print("Failed to build frontend")
        return False

    # Check if build was successful
    frontend_dist = FRONTEND_DIR / "dist"
    if not frontend_dist.exists():
        print(f"Error: Frontend build output not found at {frontend_dist}")
        return False

    print("\n✓ Frontend built successfully!")
    return True


def setup_django_static():
    """Setup Django to serve static files."""
    print("\n" + "=" * 60)
    print("STEP 2: Setting up Django Static Files")
    print("=" * 60)

    # Create a static root directory
    static_root = BASE_DIR / "static"
    templates_root = BASE_DIR / "templates"
    templates_root.mkdir(exist_ok=True)

    # Clear and recreate static root
    if static_root.exists():
        shutil.rmtree(static_root)
    static_root.mkdir()

    # Copy frontend build to staticfiles
    frontend_dist = FRONTEND_DIR / "dist"

    # copy index.html to templates
    shutil.copy(frontend_dist / "index.html", templates_root / "index.html")
    # copy other static files to static
    shutil.copytree(frontend_dist / "assets", static_root / "assets")
    shutil.copy(frontend_dist / "vite.svg", static_root / "vite.svg")

    # print contents of static and templates for verification
    print(f"\nContents of {static_root}:")
    for item in static_root.iterdir():
        if item.is_file():
            print(f"  - {item.name} ({item.stat().st_size} bytes)")
        else:
            print(f"  - {item.name}/ (directory)")
            # List contents of assets directory
            if item.name == "assets":
                for asset in item.iterdir():
                    if asset.is_file():
                        print(f"    - {asset.name} ({asset.stat().st_size} bytes)")
                    else:
                        print(f"    - {asset.name}/ (directory)")

    print(f"\nContents of {templates_root}:")
    for item in templates_root.iterdir():
        if item.is_file():
            print(f"  - {item.name} ({item.stat().st_size} bytes)")
        else:
            print(f"  - {item.name}/ (directory)")

    print(f"✓ Static files prepared at {static_root} and {templates_root}")
    print("\n" + "-" * 60)
    print("SUCCESS: You can now run the app with Django alone!")
    print("")
    print("  Run:    python manage.py runserver")
    print("  Visit:  http://localhost:8000/")
    print("")
    print("-" * 60)
    return True


def create_requirements_txt():
    """Create requirements.txt from poetry."""
    print("\n" + "=" * 60)
    print("STEP 3: Extracting Dependencies")
    print("=" * 60)

    # Export dependencies from poetry
    print("Exporting dependencies from poetry...")
    requirements_file = BASE_DIR / "requirements.txt"

    try:
        # Try to use poetry export
        result = subprocess.run(
            ["poetry", "export", "-f", "requirements.txt", "--output", str(requirements_file), "--without-hashes"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print("Poetry export failed, creating requirements.txt manually...")
            # Fallback: create requirements.txt manually from pyproject.toml
            create_requirements_manually()
    except FileNotFoundError:
        print("Poetry not found, creating requirements.txt manually...")
        create_requirements_manually()

    # Add PyInstaller to requirements
    with open(requirements_file, "a") as f:
        f.write("\npyinstaller==6.3.0\n")

    print(f"✓ Requirements saved to {requirements_file}")
    return True


def create_requirements_manually():
    """Create requirements.txt manually from pyproject.toml."""
    requirements = [
        "django>=5.2",
        "djangorestframework>=3.16.0",
        "django-cors-headers>=4.7.0",
        "python-decouple>=3.8",
        "networkx>=3.4.2",
        "requests>=2.32.4",
        "tqdm>=4.66.0",
        "git+https://github.com/Tisch-hinten-rechts/ProtGraph.git@dev#egg=protgraph",
    ]

    requirements_file = BASE_DIR / "requirements.txt"
    with open(requirements_file, "w") as f:
        f.write("\n".join(requirements))

    print(f"✓ Requirements created manually at {requirements_file}")


def create_pyinstaller_spec():
    """Create PyInstaller spec file."""
    print("\n" + "=" * 60)
    print("STEP 4: Creating PyInstaller Spec File")
    print("=" * 60)

    spec_content = """# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

block_cipher = None

# Collect all Django files
datas = []
binaries = []
hiddenimports = []

# Add Django
django_datas, django_binaries, django_hiddenimports = collect_all('django')
datas += django_datas
binaries += binaries
hiddenimports += django_hiddenimports

# Add DRF
drf_datas, drf_binaries, drf_hiddenimports = collect_all('rest_framework')
datas += drf_datas
binaries += binaries
hiddenimports += drf_hiddenimports

# Add CORS headers
cors_datas, cors_binaries, cors_hiddenimports = collect_all('corsheaders')
datas += cors_datas
binaries += binaries
hiddenimports += cors_hiddenimports

# Add networkx
nx_datas, nx_binaries, nx_hiddenimports = collect_all('networkx')
datas += nx_datas
binaries += binaries
hiddenimports += nx_hiddenimports

# Add tqdm (required by protgraph)
tqdm_datas, tqdm_binaries, tqdm_hiddenimports = collect_all('tqdm')
datas += tqdm_datas
binaries += binaries
hiddenimports += tqdm_hiddenimports

# Add protgraph if available
try:
    pg_datas, pg_binaries, pg_hiddenimports = collect_all('protgraph')
    datas += pg_datas
    binaries += binaries
    hiddenimports += pg_hiddenimports
except:
    pass

# Add backend module
datas += [('backend', 'backend')]

# Add static files
datas += [('staticfiles', 'staticfiles')]
datas += [('static', 'static')]

# Add templates
datas += [('templates', 'templates')]

# Add data directory
datas += [('data', 'data')]

# Add database if exists
if os.path.exists('db.sqlite3'):
    datas += [('db.sqlite3', '.')]


# Additional hidden imports
hiddenimports += [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'decouple',
    'networkx',
    'tqdm',
    'tqdm.std',
]

a = Analysis(
    ['start_app.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='IseoGraphApp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
"""

    spec_file = BASE_DIR / "iseograph_app.spec"
    with open(spec_file, "w") as f:
        f.write(spec_content)

    print(f"✓ PyInstaller spec file created at {spec_file}")
    return True


def build_executable():
    """Build the executable using PyInstaller."""
    print("\n" + "=" * 60)
    print("STEP 5: Building Executable with PyInstaller")
    print("=" * 60)

    spec_file = BASE_DIR / "iseograph_app.spec"

    if not spec_file.exists():
        print("Error: Spec file not found")
        return False

    print("\nBuilding executable (this may take several minutes)...")
    if not run_command(["pyinstaller", "--clean", str(spec_file)], cwd=BASE_DIR):
        print("Failed to build executable")
        return False

    exe_path = DIST_DIR / "IseoGraphApp"
    if exe_path.exists() or (exe_path.parent / "IseoGraphApp.exe").exists():
        print("\n" + "=" * 60)
        print("✓ BUILD SUCCESSFUL!")
        print("=" * 60)
        print(f"\nExecutable created at: {DIST_DIR}")
        return True
    else:
        print("Error: Executable not found after build")
        return False


def main():
    """Main build process."""
    print("\n" + "=" * 60)
    print("PROTEOFORM WEB APPLICATION - BUILD SCRIPT")
    print("=" * 60)
    print("\nThis script will:")
    print("1. Build the pnpm frontend")
    print("2. Configure Django to serve static files")
    print("3. Extract dependencies (no Poetry/pnpm needed for users)")
    print("4. Create a PyInstaller one-file executable")
    print("\n" + "=" * 60)

    # Check Python version
    if sys.version_info < (3, 10):
        print("Error: Python 3.10 or higher is required")
        return False

    # Run build steps
    if not build_frontend():
        print("\n✗ Frontend build failed")
        return False

    if not setup_django_static():
        print("\n✗ Django static setup failed")
        return False

    if not create_requirements_txt():
        print("\n✗ Requirements extraction failed")
        return False

    if not create_pyinstaller_spec():
        print("\n✗ PyInstaller spec creation failed")
        return False

    if not build_executable():
        print("\n✗ Executable build failed")
        return False

    print("\n" + "=" * 60)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
