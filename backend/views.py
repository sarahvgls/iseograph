import json
import os
from pathlib import Path
import subprocess
from django.views.decorators.csrf import ensure_csrf_cookie

from django.http import JsonResponse
import requests

from backend.consts import PROJECT_ROOT_DIR, TEST_MODE, MAX_GRAPHML_FILES
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
        raise ValueError("File must be a .graphml file: " + file_name)

    input_file = os.path.join(PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data", file_name)
    output_dir = PROJECT_ROOT_DIR / "generated"

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file '{input_file}' does not exist")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    convert_graphml_to_json(input_file, output_dir)


def force_uniprot_ids(file_name: str, uniprot_id: str, alternative_id: str) -> None:
    """
    Replaces alternative identifiers in the file with the correct UniProt ID.
    """
    uploads_dir = PROJECT_ROOT_DIR / "uploads"
    file_path = uploads_dir / file_name

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File '{file_path}' does not exist")

    with open(file_path, "r") as file:
        content = file.read()

    # Replace alternative ID with UniProt ID
    content = content.replace(alternative_id, uniprot_id)

    with open(file_path, "w") as file:
        file.write(content)


def load_protein_file(id, peptide_file):
    """
    Downloads a protein file from UniProt and saves it to the data directory.
    If an alternative identifier is provided, first searches for the correct UniProt ID.
    """
    # First try to find the correct UniProt ID if necessary
    uniprot_id = id
    if not id.startswith('P') and not id.startswith('Q') and not id.startswith('O'):
        search_url = f"https://rest.uniprot.org/uniprotkb/search?query={id}&fields=accession&format=json"
        search_response = requests.get(search_url)
        if search_response.status_code == 200:
            search_data = search_response.json()
            if search_data.get('results') and len(search_data['results']) > 0:
                uniprot_id = search_data['results'][0]['primaryAccession']
            else:
                return ""  # No matching UniProt ID found
        else:
            return ""  # Search request failed

        if peptide_file:
            force_uniprot_ids(peptide_file, uniprot_id, id)

    # Now download the protein file with the correct UniProt ID
    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.txt"
    r = requests.get(url)
    if r.status_code != 200:
        return ""

    download_dir = PROJECT_ROOT_DIR / "downloads"
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    protein_file = f"{download_dir}/{uniprot_id}.txt"
    Path(protein_file).write_bytes(r.content)
    return protein_file


def clean_up(file_name: str) -> None:
    # clear downloads and uploads folder
    downloads_dir = PROJECT_ROOT_DIR / "downloads"
    if os.path.exists(downloads_dir):
        for file in os.listdir(downloads_dir):
            file_path = os.path.join(downloads_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
    uplaods_dir = PROJECT_ROOT_DIR / "uploads"
    if os.path.exists(uplaods_dir):
        for file in os.listdir(uplaods_dir):
            file_path = os.path.join(uplaods_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

    if TEST_MODE:
        return
    # check last_recently_added.json
    last_recently_added_file = PROJECT_ROOT_DIR / "data" / "last_recently_added.json"
    if os.path.exists(last_recently_added_file):
        with open(last_recently_added_file, "r") as f:
            last_recently_added = json.load(f)

        last_n_proteins = last_recently_added.get("last_n_protein_ids", [])
        if file_name in last_n_proteins:
            # if file is already in the list, remove it
            last_n_proteins.remove(file_name)
        # remove first, if there are already too many entries
        if len(last_n_proteins) >= MAX_GRAPHML_FILES:
            oldest_id = last_n_proteins[0]
            last_n_proteins.pop(0)
            # remove old protein file
            old_protein_file = PROJECT_ROOT_DIR / "data" / f"{oldest_id}.graphml"
            if os.path.exists(old_protein_file):
                os.remove(old_protein_file)

        # add new protein id
        last_n_proteins.append(file_name)
        last_recently_added["last_n_protein_ids"] = last_n_proteins
        with open(last_recently_added_file, "w") as f:
            json.dump(last_recently_added, f, indent=4)
    else:
        last_recently_added = {
            "last_n_protein_ids": [file_name],
        }
        with open(last_recently_added_file, "w") as f:
            json.dump(last_recently_added, f, indent=4)


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
    clean_up(file_name.split(".")[0])  # remove file extension for clean_up
    return JsonResponse({"success": True, "message": f"File '{file_name}' converted successfully."})


@ensure_csrf_cookie
def generate_base_graph(request):
    """
    API endpoint to generate a graph with this organizations fork of protgraph.
    """
    # TODO implement new parameter "substitute" in data
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)
    data = json.loads(request.body)
    protein_id = data.get("protein_id")

    peptide_file = data.get("peptide_file", "")
    path_to_protein_file = load_protein_file(protein_id, peptide_file)
    uniprot_id = path_to_protein_file.split("/")[-1].split(".")[0]

    if not path_to_protein_file:
        return JsonResponse({"success": False, "message": f"Failed to download protein file for {protein_id}."},
                            status=500)
    output_folder_path = f"{PROJECT_ROOT_DIR}/data"

    features = "-ft VAR_SEQ "
    if "features" in data:  # arg sollte eine Liste sein, werte in der List nur aus dieser Auswahl MUTAGEN, VARIANT, CONFLICT, VAR_SEQ
        for feature in data.get("features"):
            features = features + f"-ft {feature} "

    peptide_file = ""  # quasi optional, aber müssen wa nochmal drüber reden #csv mit Sample,Protein ID,Sequence,Intensity
    if "peptide_file" in data:  # ein pfad
        peptide_file = "-sg -pf " + data.get("peptide_file")

    metadata_file = ""  # Sample,XX,..,ZZ
    if "metadata_file" in data:  # einpfad, optional
        metadata_file = "-mf " + data.get("metadata_file")

    compare_column = ""
    if "compare_column" in data:  # ein string, der einem Spaltennamen aus metadata file entspricht, welcher nicht Sample ist, optional
        compare_column = "-cc " + data.get("compare_column")

    intensity = ""  # optional
    if "intensity" in data:
        intensity = "-int"

    count = ""  # optional
    if "count" in data:
        count = "-cpep"

    merge_peptides = ""  # optional ABC B AB
    if "merge_peptides" in data:
        merge_peptides = "-mp"

    o_aggregation = ""  # optional Graph ABC ->  Peptide AB BC  01,10
    if "o_aggregation" in data:  # string, auswahl aus median, sum, mean
        o_aggregation = "-oi " + data.get("o_aggregation").lower()

    m_aggregation = ""
    if "m_aggregation" in data:  # string, auswahl aus median, sum, mean (default median)
        m_aggregation = "-mi " + data.get("m_aggregation").lower()

    output_file = ""
    custom_file_name = f"{protein_id}"  # default file name
    if "new_file_name" in data:  # string, optional
        custom_file_name = data.get("new_file_name", "")
        custom_file_name = custom_file_name.replace(" ", "_")
        output_file = "-of " + custom_file_name
    elif protein_id != uniprot_id:
        # case: given protein name was converted to uniprot id: name file with original id
        output_file = "-of " + custom_file_name

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
                    {output_file} \
                    -d skip -o {output_folder_path}/statistics.csv"

    subprocess.run(cmd_string, shell=True)

    output_file = os.path.join(output_folder_path, f"{custom_file_name}.graphml")
    if not os.path.exists(output_file):
        return JsonResponse({"success": False, "message": f"Failed to generate graph for {protein_id}."}, status=500)

    run_conversion_script(f"{custom_file_name}.graphml")
    clean_up(custom_file_name)

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
