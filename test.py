import subprocess

from backend.consts import PROJECT_ROOT_DIR
from backend.views import load_protein_file

#run me in your shell with:  python3 -c "import test; test.sheeesh()"

def sheeesh():
    data = {
        "protein_id": "I3L2Z2",
        "features": ["VARIANT"],
    }
    protein_id = data.get("protein_id")

    path_to_protein_file = load_protein_file(protein_id)
    output_folder_path = f"{PROJECT_ROOT_DIR}/data"

    features = "-ft VAR_SEQ "
    if "features" in data:  #arg sollte eine Liste sein, werte in der List nur aus dieser Auswahl MUTAGEN, VARIANT, CONFLICT, VAR_SEQ
        for feature in data.get("features"):
            features = features + f"-ft {feature} "
    
    peptide_file = ""#quasi optional, aber müssen wa nochmal drüber reden #csv mit Sample,Protein ID,Sequence,Intensity
    if "peptide_file" in data:    #ein pfad 
        peptide_file = "-sg -pf " + data.get("peptide_file")

    metadata_file = ""          #Sample,XX,..,ZZ
    if "metadata_file" in data:    #einpfad, optional
        metadata_file = "-mf " + data.get("metadata_file")
    
    compare_column = ""
    if "compare_column" in data: #ein string, der einem Spaltennamen aus metadata file entspricht, welcher nicht Sample ist, optional
        compare_column = "-cc " + data.get("compare_colum")
    
    intensity = "" #optional
    if "intensity" in data:
        intensity = "-int"
    
    count = "" # optional
    if "count" in data:
        count = "-cpep"
    
    merge_peptides = "" #optional ABC B AB
    if "merge_peptides" in data:
        merge_peptides = "-mp"
    
    o_aggregation = "" # optional Graph ABC ->  Peptide AB BC  01,10 
    if "o_aggregation" in data: #string, auswahl aus median, sum, mean
        o_aggregation = "-oi " + data.get("o_aggregation")
    
    m_aggregation = "" 
    if "m_aggregation" in data:#string, auswahl aus median, sum, mean (default median)
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
    
    print("Damit versuche ich, dass Programm aufzurufen:", cmd_string)
    subprocess.run(cmd_string, shell=True)