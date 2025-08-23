export const tooltips = {
  peptideFile:
    "Select a csv file with peptide and intensity information. It should have the format: Sample,Protein ID,Sequence,Intensity. " +
    "Only the peptides that belong to the protein (including isoforms) from the EMBL-Entry will be searched on the graph. " +
    "Intensity will not be displayed automatically, make sure the intensity checkbox is clicked for this.",
  metadataFile:
    "Select a csv file with metadata information for the peptide file. It should have the format: Sample,Column1,...,ColumnX. Column{N} may then be selected as comparison column.",
  compareColumn:
    "Select the column from the metadata file which will be used to compare the intensities of the different categories",
  mergePeptides:
    "Set if only the longest peptide sequence should be added to the peptide attribute of a node/edge when at least one other " +
    "peptide sequence starts and ends inside (including the first/last peptide) the displayed peptide sequence. " +
    "This means that the longest peptide sequence will be a singular node rather than cut when a sub-peptide-sequence would start/end. " +
    "E. g. given ABCD and BC would lead to a node ABCD rather than A-BC-D.",
  OAggregation:
    "Select the peptide intensity aggregation when there are overlapping different peptides with (different) intensities on one node/edge. " +
    "Accepted options are: sum, mean, median. When not set, all peptide intensities are displayed like this: XX, ..., ZZ " +
    "Important: This method is not compatible with selecting a compare column. Please choose either of them. If both are chosen, only compare column will be set.",
  FileName:
    "Optional, if not set, the file will be saved with the name of the protein." +
    "The file name with which it will be saved in /data. Example: enter 'P10636_cancer_research' will create a file named 'P10636_cancer_research.graphml' in /data. ",
  substitue:
    "Mass spectrometry cannot distinguish isoleucine (I) from leucine (L). Enable this option to substitute both with 'J' so they are treated as equivalent in peptide matching.",
};
