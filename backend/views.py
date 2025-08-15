import json
import os
from django.views.decorators.csrf import ensure_csrf_cookie

from django.http import JsonResponse

from backend.consts import PROJECT_ROOT_DIR, TEST_MODE, EVAL_MODE
from scripts.convert_graphml_to_json import convert_graphml_to_json
from django.middleware.csrf import get_token


def get_available_file_names() -> list[str]:
    """
    Returns a list of available files in the data directory.
    """

    if TEST_MODE:
        data_dir = PROJECT_ROOT_DIR / "test_data"
    elif EVAL_MODE:
        data_dir = PROJECT_ROOT_DIR / "./../proteoform-graph-eval/generated/length_of_graph"
    else:
        data_dir = PROJECT_ROOT_DIR / "data"

    files = []

    if not os.path.exists(data_dir):
        return files

    for filename in os.listdir(data_dir):
        if filename.endswith(".graphml"):
            files.append(filename)

    return files


def run_conversion_script(file_name: str) -> None:
    """
    Runs the conversion script for the specified file name.
    """
    if not file_name.endswith(".graphml"):
        raise ValueError("File must be a .graphml file")

    if TEST_MODE:
        data_dir = PROJECT_ROOT_DIR / "test_data"
    elif EVAL_MODE:
        data_dir = PROJECT_ROOT_DIR / "./../proteoform-graph-eval/generated/length_of_graph"
    else:
        data_dir = PROJECT_ROOT_DIR / "data"
    input_file = os.path.join(data_dir, file_name)
    output_dir = PROJECT_ROOT_DIR / "generated"

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file '{input_file}' does not exist")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    convert_graphml_to_json(input_file, output_dir)


# --- api calls ---

@ensure_csrf_cookie
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({"success": True, "csrfToken": csrf_token, "message": "CSRF cookie set."})


def get_available_files(request):
    """
    API endpoint to get available files in the data directory.
    """
    names = get_available_file_names()
    return JsonResponse({"success": True, "data": names})


@ensure_csrf_cookie
def convert_file(request):
    """
    API endpoint to convert a specified file.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)
    data = json.loads(request.body)
    file_name = data.get("file_name")
    if not file_name:
        raise ValueError("File name must be provided")

    run_conversion_script(file_name)
    return JsonResponse({"success": True, "message": f"File '{file_name}' converted successfully."})
