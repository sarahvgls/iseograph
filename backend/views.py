import json
import os
from pathlib import Path
import subprocess
from subprocess import CalledProcessError
from datetime import datetime

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
    # First try to find the correct UniProt ID
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


def validate_protein_file(file_path: str) -> bool:
    """
    Validates that an uploaded file is a valid protein text file from UniProt.
    Checks for basic structure and content validation.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
            content = file.read()

        # Check if file contains typical UniProt protein file markers
        # A valid UniProt text file should contain lines starting with two-letter codes like "ID ", "AC ", "DT ", etc.
        if not content:
            return False

        lines = content.split("\n")
        # Check for at least some UniProt-format lines
        has_id = any(line.startswith("ID ") for line in lines[:10])
        has_content = len(lines) > 5

        return has_id and has_content
    except Exception:
        return False


def clean_up(file_name: str) -> None:
    # clear downloads and uploads folder
    downloads_dir = PROJECT_ROOT_DIR / "downloads"  # used internally for downloads of txt files from uniprot
    if os.path.exists(downloads_dir):
        for file in os.listdir(downloads_dir):
            file_path = os.path.join(downloads_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
    uplaods_dir = PROJECT_ROOT_DIR / "uploads"  # used for uploads from user, not needed after ProtGraph run
    if os.path.exists(uplaods_dir):
        for file in os.listdir(uplaods_dir):
            file_path = os.path.join(uplaods_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)


# --- metadata management ---

def get_metadata_path(graphml_filename: str) -> Path:
    """
    Returns the metadata JSON file path for a given graphml file.
    """
    data_dir = PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data"
    # Replace .graphml with .metadata.json
    metadata_filename = graphml_filename.replace(".graphml", ".metadata.json")
    return data_dir / metadata_filename


def save_file_metadata(graphml_filename: str, metadata: dict) -> None:
    """
    Saves metadata for a generated graphml file.
    """
    metadata_path = get_metadata_path(graphml_filename)

    # Add timestamp if not present
    if "created_at" not in metadata:
        metadata["created_at"] = datetime.utcnow().isoformat()

    # Ensure filename is in metadata
    metadata["filename"] = graphml_filename

    try:
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save metadata for {graphml_filename}: {e}")


def load_file_metadata(graphml_filename: str) -> dict | None:
    """
    Loads metadata for a graphml file. Returns None if metadata doesn't exist.
    """
    metadata_path = get_metadata_path(graphml_filename)

    try:
        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load metadata for {graphml_filename}: {e}")

    return None


def delete_file_and_metadata(graphml_filename: str) -> bool:
    """
    Deletes both the graphml file and its metadata.
    Returns True if successful, False otherwise.
    """
    data_dir = PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data"
    graphml_path = data_dir / graphml_filename
    metadata_path = get_metadata_path(graphml_filename)

    try:
        if graphml_path.exists():
            os.remove(graphml_path)
        if metadata_path.exists():
            os.remove(metadata_path)
        return True
    except Exception as e:
        print(f"Warning: Failed to delete file {graphml_filename}: {e}")
        return False


def get_all_files_with_metadata() -> list[dict]:
    """
    Returns a list of all graphml files in the data directory with their metadata.
    """
    data_dir = PROJECT_ROOT_DIR / "test_data" if TEST_MODE else PROJECT_ROOT_DIR / "data"
    files_with_metadata = []

    if not os.path.exists(data_dir):
        return files_with_metadata

    for filename in sorted(os.listdir(data_dir)):
        if filename.endswith(".graphml"):
            metadata = load_file_metadata(filename)

            # Get file modification time as fallback
            file_path = data_dir / filename
            if metadata is None:
                # Create basic metadata if none exists
                mod_time = os.path.getmtime(file_path)
                created_at = datetime.fromtimestamp(mod_time).isoformat()
                metadata = {
                    "filename": filename,
                    "created_at": created_at
                }

            files_with_metadata.append(metadata)

    # Sort by creation date, newest first
    files_with_metadata.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return files_with_metadata


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

    try:
        run_conversion_script(file_name)
        clean_up(file_name.split(".")[0])  # remove file extension for clean_up
        return JsonResponse({"success": True, "message": f"File '{file_name}' converted successfully."})
    except Exception:
        error_msg = f"Failed to convert GraphML file '{file_name}'."
        return JsonResponse({"success": False, "message": error_msg}, status=500)


@ensure_csrf_cookie
def generate_base_graph(request):
    """
    API endpoint to generate a graph with this organizations fork of protgraph.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)
    data = json.loads(request.body)
    protein_id = data.get("protein_id")
    protein_file = data.get("protein_file", "")  # Option B: uploaded protein file

    peptide_file = data.get("peptide_file", "")

    # Determine which path to use
    if protein_file:
        # Option B: Use uploaded protein file
        path_to_protein_file = protein_file
        uniprot_id = path_to_protein_file.split("/")[-1].split(".")[0]
    else:
        # Option C: Download from UniProt
        path_to_protein_file = load_protein_file(protein_id, peptide_file)
        uniprot_id = path_to_protein_file.split("/")[-1].split(".")[0] if path_to_protein_file else ""

    if not path_to_protein_file:
        error_msg = f"Failed to download protein file for {protein_id}." if not protein_file else "Failed to process protein file."
        return JsonResponse({"success": False, "message": error_msg},
                            status=500)
    output_folder_path = f"{PROJECT_ROOT_DIR}/data"

    features = "-ft VAR_SEQ "
    if "features" in data:  # arg sollte eine Liste sein, werte in der List nur aus dieser Auswahl MUTAGEN, VARIANT, CONFLICT, VAR_SEQ, INIT_MET, SIGNAL, PROPEP, CHAIN, PEPTIDE
        for feature in data.get("features"):
            features = features + f"-ft {feature} "

    digestion = "skip"
    if "digestion" in data:  # arg sollte eins aus skip, trypsin, gluc, full 
        digestion = data.get("digestion")
    # skip sollte default sein. dann vllt noch irgwie ne info, dass Trypsin [ED](?!P) ist und Glu-C [ED](?!P) ist. (Glu-C scheint die offizielle bezeichung zu sein, gluc nur intern), full cuttet halt alles

    collapse = "--no_collapsing_edges"  # togglebar, ob man collapsed edges gaben will oder nicht, vllt sagen, dass bei aktiver digestion collapsed vllt empfohlen ist.
    if "collapse" in data:
        if data.get("collapse"):
            collapse = ""

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

    # remove file if it exists to ensure protgraph subprocess can be validated by checking if file was created
    file = output_folder_path + "/" + custom_file_name + ".graphml"
    if os.path.isfile(file):
        os.remove(file)

    substitute = ""
    if "substitute" in data:
        substitute = "-raa 'L->J' -raa 'I->J' "

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
                    {substitute} \
                    -d {digestion} {collapse} -o {output_folder_path}/statistics.csv"
    print("Running protgraph with command: ", cmd_string)

    try:
        subprocess.run(cmd_string, shell=True, check=True)
    except CalledProcessError as e:
        return JsonResponse({"success": False, "message": e.output}, status=e.returncode)
    except Exception as e:
        error_msg = f"Failed to run protgraph. Error: {e}"
        return JsonResponse({"success": False, "message": error_msg}, status=500)

    output_file = os.path.join(output_folder_path, f"{custom_file_name}.graphml")
    if not os.path.exists(output_file):
        return JsonResponse({"success": False, "message": f"Failed to generate graph for {protein_id}."}, status=500)

    # Save metadata about the generated file
    graphml_filename = f"{custom_file_name}.graphml"
    metadata = {
        "filename": graphml_filename,
        "created_at": datetime.utcnow().isoformat(),
        "protein_id": protein_id,
        "uniprot_id": uniprot_id,
        "features": data.get("features", ["VAR_SEQ"]),
        "digestion": digestion,
        "collapse_edges": data.get("collapse", False),
        "peptide_file": data.get("peptide_file", None),
        "metadata_file": data.get("metadata_file", None),
        "compare_column": data.get("compare_column", None),
        "has_intensity": "intensity" in data,
        "count_peptides": "count" in data,
        "merge_peptides": "merge_peptides" in data,
        "o_aggregation": data.get("o_aggregation", None),
        "m_aggregation": data.get("m_aggregation", None),
        "substitute": "substitute" in data,
        # Extract file names from paths for better display
        "peptide_file_name": data.get("peptide_file", "").split("/")[-1] if data.get("peptide_file") else None,
        "metadata_file_name": data.get("metadata_file", "").split("/")[-1] if data.get("metadata_file") else None,
        # Peptide handling methods
        "peptide_overlap_handling": "merge" if "merge_peptides" in data else "default",
        "multiple_peptide_instances": "aggregated" if data.get("m_aggregation") else "default",
    }
    save_file_metadata(graphml_filename, metadata)

    try:
        run_conversion_script(f"{custom_file_name}.graphml")
        clean_up(custom_file_name)
    except Exception:
        error_msg = f"Failed to convert GraphML to JSON for {protein_id}."
        return JsonResponse({"success": False, "message": error_msg}, status=500)

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


@ensure_csrf_cookie
def process_protein_file(request):
    """
    API endpoint to process an uploaded protein text file.
    Validates the file and prepares it for graph generation, similar to load_protein_file.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)

    data = json.loads(request.body)
    protein_file_path = data.get("protein_file_path")
    peptide_file = data.get("peptide_file", "")

    if not protein_file_path:
        return JsonResponse({"success": False, "message": "No protein file path provided."}, status=400)

    # Validate that the file exists and is readable
    if not os.path.exists(protein_file_path):
        return JsonResponse({"success": False, "message": f"Protein file '{protein_file_path}' does not exist."},
                            status=400)

    # Validate file format
    if not validate_protein_file(protein_file_path):
        return JsonResponse(
            {"success": False,
             "message": "Invalid protein file format. Please ensure the file is a valid UniProt protein text file."},
            status=400
        )

    # Extract the protein identifier from the file (first word after "ID " line)
    uniprot_id = ""
    try:
        with open(protein_file_path, "r", encoding="utf-8", errors="ignore") as file:
            for line in file:
                if line.startswith("ID "):
                    uniprot_id = line[3:].split()[0].strip()
                    break
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Failed to read protein file: {str(e)}"}, status=500)

    if not uniprot_id:
        return JsonResponse({"success": False, "message": "Could not extract protein ID from file."}, status=400)

    # Copy file to downloads directory (similar to load_protein_file behavior)
    download_dir = PROJECT_ROOT_DIR / "downloads"
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    processed_file = f"{download_dir}/{uniprot_id}.txt"
    try:
        with open(protein_file_path, "r", encoding="utf-8", errors="ignore") as src:
            with open(processed_file, "w", encoding="utf-8") as dst:
                dst.write(src.read())
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Failed to process protein file: {str(e)}"}, status=500)

    # If peptide file is provided, update UniProt IDs in it
    if peptide_file:
        try:
            force_uniprot_ids(os.path.basename(peptide_file), uniprot_id, uniprot_id)
        except Exception as e:
            # This is non-critical, log but don't fail
            print(f"Warning: Could not process peptide file: {str(e)}")

    return JsonResponse({
        "success": True,
        "message": f"Protein file processed successfully.",
        "protein_file": processed_file,
        "protein_id": uniprot_id
    })


@ensure_csrf_cookie
def get_files_with_metadata(request):
    """
    API endpoint to get all available files with their metadata.
    """
    if request.method != "GET":
        return JsonResponse({"success": False, "message": "Invalid request method. Use GET."}, status=405)

    try:
        files_with_metadata = get_all_files_with_metadata()
        return JsonResponse({"success": True, "data": files_with_metadata})
    except Exception as e:
        error_msg = f"Failed to retrieve files: {str(e)}"
        return JsonResponse({"success": False, "message": error_msg}, status=500)


@ensure_csrf_cookie
def delete_file(request):
    """
    API endpoint to delete a file and its metadata.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method. Use POST."}, status=405)

    data = json.loads(request.body)
    filename = data.get("filename")

    if not filename:
        return JsonResponse({"success": False, "message": "Filename must be provided."}, status=400)

    if not filename.endswith(".graphml"):
        return JsonResponse({"success": False, "message": "Invalid file type. Only .graphml files can be deleted."},
                            status=400)

    success = delete_file_and_metadata(filename)

    if success:
        return JsonResponse({"success": True, "message": f"File '{filename}' deleted successfully."})
    else:
        return JsonResponse({"success": False, "message": f"Failed to delete file '{filename}'."}, status=500)
