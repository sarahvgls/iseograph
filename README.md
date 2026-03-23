# IseoGraph

developed by me, Sarah Vogels, as part of my bachelor's thesis.

### Tool summary

IseoGraph can be used to visualize proteins' primary structure based on amino acid sequences as graphs. It includes all
known isoforms and single amino acid variations published on UniProt (https://www.uniprot.org/).
Additionally, peptides can be matched to the amino acid sequence.
The underlying graph structure is created by Jannes Konarski's modified version of ProtGraph to be found
at https://github.com/Tisch-hinten-rechts/ProtGraph.

### Usage guide

Enter folder `/dist`. Double click IseoGraphApp. The application is opened automatically in a browser window.

### Dev Guide: Serve Application

Serve a new version of IseoGraph via Pyinstaller by running.

```
python build_executable.py
```

### Usage

The initial example files present the protein Q8WUI4.

To upload a new protein, open the side menu and follow the instructions listed.

For the user guide, open the side menu and click on the third panel.