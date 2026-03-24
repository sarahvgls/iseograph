#!/usr/bin/env python
"""
Main entry point for the Proteoform Web Application.
This file starts the Django server and opens the web browser.
"""

import os
import sys
import threading
import time
import webbrowser
from pathlib import Path


def setup_environment():
    """Setup environment variables and paths."""
    # Get the base directory
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_dir = Path(sys._MEIPASS)
    else:
        # Running as script
        base_dir = Path(__file__).resolve().parent

    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    # Set default SECRET_KEY if not set (for standalone executable)
    if not os.environ.get('SECRET_KEY'):
        os.environ['SECRET_KEY'] = 'django-insecure-standalone-key-change-in-production'

    # Set DEBUG to False for production
    if not os.environ.get('DEBUG'):
        os.environ['DEBUG'] = 'False'

    return base_dir


def open_browser(port=8002, delay=2):
    """Open the default web browser after a delay."""
    time.sleep(delay)
    url = f"http://127.0.0.1:{port}/"
    print(f"\n{'=' * 60}")
    print(f"Opening browser at: {url}")
    print(f"{'=' * 60}\n")
    webbrowser.open(url)


def run_server(port=8002):
    """Run the Django development server."""
    from django.core.management import execute_from_command_line

    print(f"\n{'=' * 60}")
    print("IseoGraph WEB APPLICATION")
    print(f"{'=' * 60}")
    print(f"\nStarting server on http://127.0.0.1:{port}")
    print(f"Press CTRL+C to stop the server")
    print(f"{'=' * 60}\n")

    # Start browser in a separate thread
    browser_thread = threading.Thread(target=open_browser, args=(port, 3))
    browser_thread.daemon = True
    browser_thread.start()

    # Run Django server
    execute_from_command_line(['manage.py', 'runserver', f'127.0.0.1:{port}', '--noreload'])


def main():
    """Main entry point."""
    try:
        # Setup environment
        base_dir = setup_environment()

        # Import Django
        import django
        django.setup()

        # Run the server
        run_server(port=8002)

    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
