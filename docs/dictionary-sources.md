# English–Persian dictionary sources

## Selected baseline

The project uses the `generic-13` dictionary from Vahid Nasiri's [EnglishToPersianDictionaries collection](https://github.com/VahidN/EnglishToPersianDictionaries/tree/master/Dictionaries/generic-13) as its initial lookup source.

- License: Apache License 2.0
- Published entries: 241,281 across A–Z and small numeric/symbol groups
- Available format: JSON grouped by initial character
- Imported format: one compact JSON file per initial letter, plus a manifest
- Reproducibility: the importer is pinned to upstream commit `224f15d42d145c59b5dc2c6890c4736693613cc2`

Run `npm run data:import` to download, validate, normalize, deduplicate, and regenerate the browser assets. The normalization converts Arabic yeh/kaf code points commonly found in older Persian datasets to Persian Unicode code points.

This is a broad lookup dictionary, not a reviewed curriculum. Some translations are archaic, specialized, duplicated, split into numbered senses, or missing context. The repository states an Apache-2.0 license for the collection but does not document the provenance of every legacy sub-dictionary. Words used in scored lessons should live in a smaller, human-reviewed lesson dataset with difficulty, part of speech, transliteration, examples, and accepted-answer variants.

## Other sources reviewed

### Kaikki / English Wiktionary

[Kaikki's machine-readable Wiktionary extraction](https://kaikki.org/dictionary/index.html) provides structured senses, translations, pronunciation, and grammatical metadata. It is the best candidate for enriching reviewed words later, but its full raw English dump is very large and its CC BY-SA/GFDL terms require careful attribution and share-alike handling for derived dictionary data.

### English-Persian Dictionary Dataset (300k+)

The [308,000-headword compilation](https://github.com/shirin-manzari/english-persian-dictionary-dataset) is larger and convenient, but it combines resources with different or unspecified upstream licenses. Its own README tells commercial users to investigate those rights. It is not included until every upstream source and redistribution term can be verified.

### English-Persian Word Database

The [English-Persian Word Database](https://github.com/semnan-university-ai/English-Persian-Word-Database) is marked Apache-2.0 and offers SQL, XML, TXT, XLSX, MDB, and ACCDB formats. Its TXT export has 65,529 translation rows but only 33,101 unique English headwords, and the data ends at “twin” apart from two out-of-order W entries. Its SQL export is also truncated at 35,648 rows. It is not sufficiently complete for the main lookup dictionary.

### Dehkhoda Lexicon

The [Dehkhoda Lexicon dataset](https://huggingface.co/datasets/Maani/Dehkhoda-Lexicon) contains 19,895 Persian-centered entries with synonyms and antonyms. It is CC BY-SA 4.0 and better suited to Persian-to-English enrichment than the initial English-to-Persian lookup path.
