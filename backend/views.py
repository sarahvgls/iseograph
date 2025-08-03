import json
import os
from pathlib import Path
import subprocess
from django.views.decorators.csrf import ensure_csrf_cookie

from django.http import JsonResponse
import requests

from backend.consts import PROJECT_ROOT_DIR, TEST_MODE
from scripts.convert_graphml_to_json import convert_graphml_to_json
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage


def get_available_file_names() -> list[str]:
    """
    Returns a list of available files in the data directory.
    """

    data_dir = PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data"
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

    input_file = os.path.join(PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data", file_name)
    output_dir = PROJECT_ROOT_DIR / "generated"

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file '{input_file}' does not exist")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    convert_graphml_to_json(input_file, output_dir)


def load_protein_file(id):
    """
    Downloads a protein file from UniProt and saves it to the data directory.
    """
    url = f"https://rest.uniprot.org/uniprotkb/{id}.txt"
    r = requests.get(url)
    r.raise_for_status()
    download_dir = PROJECT_ROOT_DIR / "downloads"
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)
    protein_file = f"{download_dir}/{id}.txt"
    Path(protein_file).write_bytes(r.content)
    return protein_file


def clean_up(protein_id: str) -> None:
    # clear downloads folder
    downloads_dir = PROJECT_ROOT_DIR / "downloads"
    if os.path.exists(downloads_dir):
        for file in os.listdir(downloads_dir):
            file_path = os.path.join(downloads_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

    # check last_recently_added.json
    last_recently_added_file = PROJECT_ROOT_DIR / "data" / "last_recently_added.json"
    if os.path.exists(last_recently_added_file):
        with open(last_recently_added_file, "r") as f:
            last_recently_added = json.load(f)

        last_10_proteins = last_recently_added.get("last_10_protein_ids", [])
        if protein_id not in last_10_proteins:
            # remove first, if there are already 10 entries
            if len(last_10_proteins) >= 10:
                last_10_proteins.pop(0)
            # add new protein id
            last_10_proteins.append(protein_id)
            with open(last_recently_added_file, "w") as f:
                json.dump(last_recently_added, f)
    else:
        last_recently_added = {
            "last_10_protein_ids": [protein_id],
        }

        with open(last_recently_added_file, "w") as f:
            json.dump(last_recently_added, f)

    return True


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


@ensure_csrf_cookie
def generate_base_graph(request):
    """
    API endpoint to generate a graph with this organizations fork of protgraph.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)
    data = json.loads(request.body)
    protein_id = data.get("protein_id")

    path_to_protein_file = load_protein_file(protein_id)
    output_folder_path = f"{PROJECT_ROOT_DIR}/data"

    features = ""
    if "features" in data:  # arg sollte eine Liste sein, werte in der List nur aus dieser Auswahl MUTAGEN, VARIANT, CONFLICT, VAR_SEQ
        for feature in data.get("features"):
            features = features + f"-ft {feature} "

    peptide_file = ""  # quasi optional, aber müssen wa nochmal drüber reden
    if "peptide_file" in data:  # ein pfad
        peptide_file = "-sg -pf " + data.get("peptide_file")

    metadata_file = ""
    if "metadata_file" in data:  # einpfad, optional
        metadata_file = "-mf " + data.get("metadata_file")

    compare_column = ""
    if "compare_column" in data:  # ein string, der einem Spaltennamen aus metadata file entspricht, welcher nicht Sample ist, optional
        compare_column = "-cc " + data.get("compare_colum")

    intensity = ""  # optional
    if "intensity" in data:
        intensity = "-int"

    count = ""  # optional
    if "count" in data:
        count = "-cpep"

    merge_peptides = ""  # optional
    if "merge_peptides" in data:
        merge_peptides = "-mp"

    o_aggregation = ""  # optional
    if "o_aggregation" in data:  # string, auswahl aus median, sum, mean
        o_aggregation = "-oi " + data.get("o_aggregation")

    m_aggregation = ""
    if "m_aggregation" in data:  # string, auswahl aus median, sum, mean (default median)
        m_aggregation = "-oi " + data.get("m_aggregation")

    cmd_string = f"protgraph -egraphml {path_to_protein_file} \
                --export_output_folder={output_folder_path} \
                {features} \
                {peptide_file} \
                {metadata_file} \
                {compare_column} \
                {intensity} \
                {count} \
                {merge_peptides} \
                {m_aggregation} \
                {o_aggregation} \
                -d skip -o {output_folder_path}/statistics.csv"

    subprocess.run(cmd_string, shell=True)

    output_file = os.path.join(output_folder_path, f"{protein_id}.graphml")
    if not os.path.exists(output_file):
        return JsonResponse({"success": False, "message": f"Failed to generate graph for {protein_id}."}, status=500)

    clean_up(protein_id)

    return JsonResponse({"success": True, "message": f"Generated {protein_id} a graph as .graphml successfully."})


@csrf_exempt
def upload_file(request):
    """
    API endpoint to handle file uploads.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"success": False, "message": "No file provided."}, status=400)

    upload_dir = PROJECT_ROOT_DIR / "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    valid_file_name = uploaded_file.name.replace(" ", "_").replace("..", ".")
    file_path = upload_dir / valid_file_name
    with default_storage.open(file_path, "wb+") as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    return JsonResponse({"success": True, "filePath": str(file_path), "message": "File uploaded successfully."})
