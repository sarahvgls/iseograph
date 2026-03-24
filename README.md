# IseoGraph

developed by me, Sarah Vogels, as part of my bachelor's thesis.

### Tool summary

IseoGraph can be used to visualize proteins' primary structure based on amino acid sequences as graphs. It includes all
known isoforms and single amino acid variations published on UniProt (https://www.uniprot.org/).
Additionally, peptides can be matched to the amino acid sequence.
The underlying graph structure is created by Jannes Konarski's modified version of ProtGraph to be found
at https://github.com/Tisch-hinten-rechts/ProtGraph.

### Usage guide

Download `IseoGraph.zip` from the latest release from the
release-tab (https://github.com/sarahvgls/iseograph/releases/tag/release-feature%2Finstall-6).
After expanding the Zipfile, execute the `IseoGraphApp` file found by double clicking on it. Your operation system might
ask you to approve the file even though it was downloaded from the internet. You have to accept this.
A console window is opened. Wait until the following text appears. The application will open on its own:

```

============================================================
Opening browser at: http://127.0.0.1:8000/
============================================================
```

#### Trouble shooting

Error "Port already in use": Try to find out what uses this port and kill that process. (Google/ AI may help here.)

### Dev Guide: Serve Application

Manually serve a new version of IseoGraph via Pyinstaller by running.

```
python scripts/build_executable.py
```

The executable file is created in `\dist\IseoGraphApp`. Note: This file is only compatible with the operating system of
the device, the script was executed on due to platform-specific PyInstaller.

### Dev Guide: Set up locally

1.) Clone the repository to your device.

2.) Install dependencies:

```
uv sync
```

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

The initial example files present the protein Q8WUI4.

To upload a new protein, open the side menu and follow the instructions listed.

For the user guide, open the side menu and click on the third panel.