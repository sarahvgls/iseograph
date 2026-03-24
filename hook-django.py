"""PyInstaller hook to prevent early Django initialization."""
# This hook is automatically loaded by PyInstaller for django imports
# It prevents Django from initializing during analysis phase

import sys
from PyInstaller.utils.hooks import get_module_file_attribute, collect_data_files

# Tell PyInstaller to lazy-load Django modules
hiddenimports = [
    'django.conf',
    'django.apps',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.core',
    'django.db',
    'django.http',
    'django.urls',
    'django.views',
]

datas = collect_data_files('django', subdir='conf/locale')
