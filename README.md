# IseoGraph

developed by me, Sarah Vogels, as part of my bachelor's thesis.

### Tool summary

IseoGraph can be used to visualize proteins' primary structure based on amino acid sequences as graphs. It includes all
known isoforms and single amino acid variations published on UniProt (https://www.uniprot.org/).
Additionally, peptides can be matched to the amino acid sequence.
The underlying graph structure is created by Jannes Konarski's modified version of ProtGraph to be found
at https://github.com/Tisch-hinten-rechts/ProtGraph.

### Installation guide

1.) Clone the repository to your device.

2.) Start the backend server with the following command:

```
python manage.py runserver
```

3.) Start the application by navigating into the frontend folder:

```
cd frontend
```

And executing the following command:

```
pnpm dev
```

4). Open the page printed to the console to open the application.

### Usage

To upload a new protein, open the side menu and follow the instructions listed.

For the user guide, open the side menu and click on the third panel.