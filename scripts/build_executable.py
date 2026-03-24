#!/usr/bin/env python
"""
Build script optimized for GitHub Actions CI/CD workflow.
This script ensures all dependencies are properly installed and configured
for a headless GitHub Actions environment (no pnpm pre-installed).

Compared to build_executable.py, this adds:
1. Automatic npm/pnpm installation if missing
2. Better error handling for CI environments
3. Verification of all build outputs
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Set UTF-8 encoding for Windows console output
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import codecs

    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, 'strict')

# Get the project root directory
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = BASE_DIR / "dist"
BUILD_DIR = BASE_DIR / "build"


def run_command(command, cwd=None, shell=False, capture_output=False):
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
            capture_output=capture_output
        )
        if capture_output and result.stderr:
            print(f"STDERR:\n{result.stderr}")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stderr:
            print(f"STDERR:\n{e.stderr}")
        if e.stdout:
            print(f"STDOUT:\n{e.stdout}")
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


def install_pnpm():
    """Install pnpm globally using npm."""
    print("\nInstalling pnpm via npm...")

    # On Windows, npm needs shell=True to work properly in GitHub Actions
    shell_flag = sys.platform == 'win32'

    if not run_command(["npm", "install", "-g", "pnpm"], shell=shell_flag):
        print("Warning: Failed to install pnpm globally")
        print("Attempting to use npx pnpm instead...")
        return False
    print("[OK] pnpm installed successfully")
    return True


def build_frontend():
    """Build the frontend using pnpm."""
    print("\n" + "=" * 60)
    print("STEP 1: Building Frontend")
    print("=" * 60)

    if not FRONTEND_DIR.exists():
        print(f"Error: Frontend directory not found at {FRONTEND_DIR}")
        return False

    # Check if pnpm is installed, if not, install it
    pnpm_available = check_pnpm_installed()
    if not pnpm_available:
        print("pnpm not found. Attempting to install...")
        pnpm_available = install_pnpm()

    # Determine which command to use
    pnpm_cmd = ["pnpm"] if pnpm_available else ["npx", "pnpm"]
    use_shell = sys.platform == 'win32'

    # Install dependencies
    print("\nInstalling frontend dependencies...")
    if not run_command(pnpm_cmd + ["install"], cwd=FRONTEND_DIR, shell=use_shell):
        print("Failed to install frontend dependencies")
        return False

    # Build the frontend
    print("\nBuilding frontend...")
    if not run_command(pnpm_cmd + ["run", "build"], cwd=FRONTEND_DIR, shell=use_shell):
        print("Failed to build frontend")
        return False

    # Check if build was successful
    frontend_dist = FRONTEND_DIR / "dist"
    if not frontend_dist.exists():
        print(f"Error: Frontend build output not found at {frontend_dist}")
        return False

    print("\n[OK] Frontend built successfully!")
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
    if (frontend_dist / "index.html").exists():
        shutil.copy(frontend_dist / "index.html", templates_root / "index.html")
    else:
        print("Warning: index.html not found in frontend build")

    # copy other static files to static
    assets_src = frontend_dist / "assets"
    if assets_src.exists():
        shutil.copytree(assets_src, static_root / "assets")
    else:
        print("Warning: assets directory not found in frontend build")

    if (frontend_dist / "vite.svg").exists():
        shutil.copy(frontend_dist / "vite.svg", static_root / "vite.svg")

    # print contents of static and templates for verification
    print(f"\nContents of {static_root}:")
    if static_root.exists():
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
    if templates_root.exists():
        for item in templates_root.iterdir():
            if item.is_file():
                print(f"  - {item.name} ({item.stat().st_size} bytes)")
            else:
                print(f"  - {item.name}/ (directory)")

    print(f"[OK] Static files prepared at {static_root} and {templates_root}")
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
            create_requirements_manually()
    except FileNotFoundError:
        print("Poetry not found, creating requirements.txt manually...")
        create_requirements_manually()

    # Add PyInstaller to requirements
    with open(requirements_file, "a") as f:
        f.write("\npyinstaller==6.3.0\n")

    print(f"[OK] Requirements saved to {requirements_file}")

    # Install all requirements so they're available for PyInstaller
    print("\nInstalling all dependencies...")

    # Set environment variables for installation
    env = os.environ.copy()
    env['SECRET_KEY'] = 'build-time-secret-key'
    env['DEBUG'] = 'False'
    env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

    # Run pip install with environment
    try:
        result = subprocess.run(
            ["pip", "install", "-r", str(requirements_file)],
            shell=sys.platform == 'win32',
            env=env,
            text=True,
            capture_output=True
        )
        if result.returncode != 0:
            print("Warning: Some dependencies may have failed to install")
            if result.stderr:
                print(f"Errors:\n{result.stderr}")
    except Exception as e:
        print(f"Warning: Error installing dependencies: {e}")

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

    print(f"[OK] Requirements created manually at {requirements_file}")


def create_pyinstaller_spec():
    """Create PyInstaller spec file."""
    print("\n" + "=" * 60)
    print("STEP 4: Creating PyInstaller Spec File")
    print("=" * 60)

    spec_content = """# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# Collect data files
datas = []
binaries = []
hiddenimports = []

# Collect Django data files
try:
    datas += collect_data_files('django', subdir='conf/locale')
except Exception as e:
    print(f"Warning: Could not collect Django data files: {e}")

try:
    datas += collect_data_files('rest_framework')
except Exception as e:
    print(f"Warning: Could not collect DRF data files: {e}")

try:
    datas += collect_data_files('corsheaders')
except Exception as e:
    print(f"Warning: Could not collect CORS data files: {e}")

# Add backend module
datas += [('backend', 'backend')]

# Add static files if they exist
if os.path.exists('static'):
    datas += [('static', 'static')]

if os.path.exists('staticfiles'):
    datas += [('staticfiles', 'staticfiles')]

# Add templates if they exist
if os.path.exists('templates'):
    datas += [('templates', 'templates')]

# Add data directory
if os.path.exists('data'):
    datas += [('data', 'data')]

# Add database if exists
if os.path.exists('db.sqlite3'):
    datas += [('db.sqlite3', '.')]

# Hidden imports for Django and related modules
hiddenimports = [
    'django',
    'django.conf',
    'django.apps',
    'django.apps.registry',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.auth.models',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.core',
    'django.core.management',
    'django.core.management.commands',
    'django.core.management.commands.runserver',
    'django.db',
    'django.http',
    'django.urls',
    'django.views',
    'rest_framework',
    'rest_framework.decorators',
    'rest_framework.response',
    'corsheaders',
    'corsheaders.middleware',
    'decouple',
    'networkx',
    'tqdm',
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
    excludes=['tcl', 'tk', 'tkinter', '_tkinter', 'matplotlib', 'scipy', 'numpy', 'pytest'],
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
    upx=False,
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

    print(f"[OK] PyInstaller spec file created at {spec_file}")
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

    print(f"\nSpec file location: {spec_file}")
    print(f"Working directory: {BASE_DIR}")
    print("\nBuilding executable (this may take several minutes)...")

    # Set Django environment variables for PyInstaller analysis
    env = os.environ.copy()
    env['SECRET_KEY'] = 'build-time-secret-key-for-pyinstaller-analysis'
    env['DEBUG'] = 'False'
    env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

    # Build with verbose output to debug issues
    try:
        result = subprocess.run(
            ["pyinstaller", "--clean", str(spec_file)],
            cwd=BASE_DIR,
            text=True,
            capture_output=True,
            env=env,
            check=False
        )

        if result.returncode != 0:
            print("\nPyInstaller build failed. Error output:")
            if result.stdout:
                print(f"\nSTDOUT:\n{result.stdout}")
            if result.stderr:
                print(f"\nSTDERR:\n{result.stderr}")
            return False
        else:
            print("PyInstaller completed successfully")
    except Exception as e:
        print(f"Error running PyInstaller: {e}")
        return False

    # Check multiple possible output locations
    possible_paths = [
        DIST_DIR / "IseoGraphApp.exe",
        DIST_DIR / "IseoGraphApp",
        BASE_DIR / "dist" / "IseoGraphApp.exe",
        BASE_DIR / "dist" / "IseoGraphApp",
    ]

    exe_found = False
    exe_path = None
    for path in possible_paths:
        if path.exists():
            exe_found = True
            exe_path = path
            print(f"\n[OK] Executable found at: {exe_path}")
            break

    if exe_found:
        print("\n" + "=" * 60)
        print("[OK] BUILD SUCCESSFUL!")
        print("=" * 60)
        print(f"\nExecutable created at: {exe_path}")
        return True
    else:
        print("\nError: Executable not found after build")
        print(f"Checked paths: {possible_paths}")
        # List contents of dist directory for debugging
        if DIST_DIR.exists():
            print(f"\nContents of {DIST_DIR}:")
            try:
                for item in DIST_DIR.rglob("*"):
                    if item.is_file():
                        print(f"  - {item.relative_to(DIST_DIR)}")
            except Exception as e:
                print(f"Error listing directory: {e}")
        return False


def verify_executable():
    """Verify the executable was created successfully."""
    print("\n" + "=" * 60)
    print("STEP 6: Verifying Executable")
    print("=" * 60)

    possible_paths = [
        DIST_DIR / "IseoGraphApp.exe",
        DIST_DIR / "IseoGraphApp",
        BASE_DIR / "dist" / "IseoGraphApp.exe",
        BASE_DIR / "dist" / "IseoGraphApp",
    ]

    for path in possible_paths:
        if path.exists():
            size = path.stat().st_size / (1024 * 1024)  # Size in MB
            print(f"[OK] Executable verified: {path.name}")
            print(f"  Size: {size:.2f} MB")
            return True

    print("[FAIL] No executable found for verification")
    return False


def validate_build_environment():
    """Validate that all required files exist before building."""
    print("\n" + "=" * 60)
    print("VALIDATION: Checking Build Environment")
    print("=" * 60)

    required_files = [
        (BASE_DIR / "start_app.py", "Entry point script"),
        (BASE_DIR / "backend" / "settings.py", "Django settings"),
        (BASE_DIR / "backend" / "urls.py", "Django URL config"),
        (BASE_DIR / "manage.py", "Django manage script"),
    ]

    required_dirs = [
        (BASE_DIR / "backend", "Backend module"),
        (BASE_DIR / "templates", "Templates directory"),
        (BASE_DIR / "static", "Static files directory"),
        (BASE_DIR / "data", "Data directory"),
    ]

    all_good = True

    print("\nChecking required files:")
    for file_path, description in required_files:
        if file_path.exists():
            print(f"  [OK] {description}: {file_path.name}")
        else:
            print(f"  [FAIL] {description}: NOT FOUND at {file_path}")
            all_good = False

    print("\nChecking required directories:")
    for dir_path, description in required_dirs:
        if dir_path.exists():
            file_count = sum(1 for _ in dir_path.rglob("*") if _.is_file())
            print(f"  [OK] {description}: {dir_path.name}/ ({file_count} files)")
        else:
            print(f"  [WARNING] {description}: NOT FOUND at {dir_path}")

    if all_good:
        print("\n[OK] All essential files present!")
        return True
    else:
        print("\n[FAIL] Missing essential files!")
        return False


def main():
    """Main build process."""
    print("\n" + "=" * 60)
    print("PROTEOFORM WEB APPLICATION - GitHub Actions Build Script")
    print("=" * 60)
    print("\nThis script will:")
    print("1. Build the pnpm frontend (auto-installs pnpm if needed)")
    print("2. Configure Django to serve static files")
    print("3. Extract dependencies")
    print("4. Create a PyInstaller one-file executable")
    print("5. Verify the executable was created")
    print("\n" + "=" * 60)

    # Check Python version
    if sys.version_info < (3, 10):
        print("Error: Python 3.10 or higher is required")
        return False

    # Validate build environment
    if not validate_build_environment():
        print("\n[FAIL] Build environment validation failed")
        return False

    # Run build steps
    if not build_frontend():
        print("\n[FAIL] Frontend build failed")
        return False

    if not setup_django_static():
        print("\n[FAIL] Django static setup failed")
        return False

    if not create_requirements_txt():
        print("\n[FAIL] Requirements extraction failed")
        return False

    if not create_pyinstaller_spec():
        print("\n[FAIL] PyInstaller spec creation failed")
        return False

    if not build_executable():
        print("\n[FAIL] Executable build failed")
        return False

    if not verify_executable():
        print("\n[FAIL] Executable verification failed")
        return False

    print("\n" + "=" * 60)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nThe executable is ready for release!")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
