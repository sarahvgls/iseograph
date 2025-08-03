export const tooltips = {
  peptideFile:
    "Select a csv file with peptide and intensity information. It should have the format: Sample,Protein ID,Sequence,Intensity,PEP.\n" +
    "Only the peptides that belong to the protein (including isoforms) from the EMBL-Entry will searched on the graph \n" +
    "Intensity will not be displayed automatically, click the intensity checkbox for this.'",
  metadataFile:
    "Select a csv file with metadata information for the peptide file. It should have the format: Sample,Column1,...,ColumnX",
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
};
