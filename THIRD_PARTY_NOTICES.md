# Third-party data notices

## EnglishToPersianDictionaries / generic-13

The generated files under `public/data/dictionary/` are adapted from the [`generic-13` dictionary](https://github.com/VahidN/EnglishToPersianDictionaries/tree/master/Dictionaries/generic-13) in Vahid Nasiri's EnglishToPersianDictionaries collection, distributed under the [Apache License 2.0](https://github.com/VahidN/EnglishToPersianDictionaries/blob/master/LICENSE.md).

Changes made by this project: conversion to a compact chunked JSON schema, case-insensitive headword merging, duplicate removal, whitespace normalization, and normalization of Arabic yeh/kaf characters to their Persian Unicode forms.

## Reviewed Persian learning curriculum

`public/data/curriculum.json` is adapted from Wiktionary's [Miller–Aghajanian-Stewart Persian frequency list](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Persian/Miller_Aghajanian-Stewart_2009_(index)), which provides ranks, Persian script, IPA, parts of speech, and definitions for 5,000 high-frequency words. The underlying ranking is based on a 150-million-word corpus of spoken and written Iranian Persian. Wiktionary text is available under the [Creative Commons Attribution-ShareAlike 4.0 license](https://creativecommons.org/licenses/by-sa/4.0/).

Changes made by this project: selection of compact learner-appropriate senses from ranks 1–1,000; removal of proper nouns, inflections, ambiguous definitions, technical vocabulary, and duplicate English or Persian answers; correction of Persian Unicode/spelling artifacts; conversion of IPA to a readable Latin clue; assignment to three learning levels; and addition of a small project-reviewed set of conversational essentials. `public/data/curriculum.json` is distributed under CC BY-SA 4.0. The 241,000-headword reference dictionary does not determine scored answers.

## Poly Haven texture pack

The files under `public/assets/textures/rock-ground/` are the 1K JPG maps from [Rock Ground](https://polyhaven.com/a/rock_ground) by Rob Tuytel, distributed through Poly Haven under the [CC0 1.0 Universal license](https://creativecommons.org/publicdomain/zero/1.0/).

Included maps: diffuse, OpenGL normal, roughness, and displacement. The game uses the diffuse and roughness maps to texture the deformable terrain at runtime.

## Poly Haven sky

`public/assets/textures/sky/partly-cloudy.webp` is a web-optimized derivative of [Kloofendal 38d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_38d_partly_cloudy_puresky) by Greg Zaal and Jarod Guest, distributed through Poly Haven under CC0 1.0 Universal. The original tone-mapped panorama was resized and converted to WebP for browser delivery.
