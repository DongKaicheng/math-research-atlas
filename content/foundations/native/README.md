# Foundations web edition

This directory contains the English HTML reading projection of `sealed-1097`. The source manuscript was matched to the sealed edition through its compiled PDF SHA-256. The projection uses the English text, mathematical notation, figures and cross-references of that edition. Each Tag retains the coverage status of its permanent record.

`index.json.gz` records the source hash, chapter catalogue, permanent Tag locations and bookmark destinations. The other gzip files contain the ordered HTML blocks and section headings for individual parts, chapters and appendices. The site builder reuses these blocks for Tag statements and adjacent proofs. Named destinations without a standalone statement have chapter links. The coverage register lists Tags without a verified named destination.

The publishing build reads these derived files directly and checks their edition binding and Tag anchors. The fixed edition remains available for citation. The original source package is kept with the project owner.
