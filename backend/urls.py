"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Serve frontend at root
    path('admin/', admin.site.urls),
    path("get_csrf_token/", views.get_csrf_token, name="get_csrf_token"),
    path('api/get_available_files/', views.get_available_files, name='get_available_files'),
    path('api/convert_file/', views.convert_file, name='convert_file'),
    path('api/generate_base_graph/', views.generate_base_graph, name='generate_base_graph'),
    path('api/upload_file/', views.upload_file, name='upload_file'),
]

# Serve static files - always enabled for built mode and development
# In production with a real web server, use nginx/apache instead
import os

static_root = None
if settings.STATICFILES_DIRS and os.path.exists(settings.STATICFILES_DIRS[0]):
    static_root = settings.STATICFILES_DIRS[0]
elif os.path.exists(settings.STATIC_ROOT):
    static_root = settings.STATIC_ROOT
else:
    # Fallback: try to find static folder relative to BASE_DIR
    static_root = os.path.join(settings.BASE_DIR, 'static')

urlpatterns += static(settings.STATIC_URL, document_root=static_root)
