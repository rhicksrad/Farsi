# Third-party data notices

## EnglishToPersianDictionaries / generic-13

The generated files under `public/data/dictionary/` are adapted from the [`generic-13` dictionary](https://github.com/VahidN/EnglishToPersianDictionaries/tree/master/Dictionaries/generic-13) in Vahid Nasiri's EnglishToPersianDictionaries collection, distributed under the [Apache License 2.0](https://github.com/VahidN/EnglishToPersianDictionaries/blob/master/LICENSE.md).

Changes made by this project: conversion to a compact chunked JSON schema, case-insensitive headword merging, duplicate removal, whitespace normalization, and normalization of Arabic yeh/kaf characters to their Persian Unicode forms.

## ipa-dict Persian pronunciations

Pronunciation-linked gameplay entries in `public/data/dictionary/game-pronounced.json` use the Persian word list from [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict), distributed under the [MIT License](https://github.com/open-dict-data/ipa-dict/blob/master/LICENSE). IPA values are retained for phonetic clues and converted to a simplified Latin spelling for the secondary clue.

## Common English word ranking

Gameplay vocabulary is filtered through the 20,000-word frequency list from [david47k/top-english-wordlists](https://github.com/david47k/top-english-wordlists), distributed under the [Creative Commons Attribution 3.0 license](https://creativecommons.org/licenses/by/3.0/). This removes obscure dictionary headwords and keeps the bank focused on practical modern vocabulary.

## Poly Haven texture pack

The files under `public/assets/textures/rock-ground/` are the 1K JPG maps from [Rock Ground](https://polyhaven.com/a/rock_ground) by Rob Tuytel, distributed through Poly Haven under the [CC0 1.0 Universal license](https://creativecommons.org/publicdomain/zero/1.0/).

Included maps: diffuse, OpenGL normal, roughness, and displacement. The game uses the diffuse and roughness maps to texture the deformable terrain at runtime.

## Poly Haven sky

`public/assets/textures/sky/partly-cloudy.webp` is a web-optimized derivative of [Kloofendal 38d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_38d_partly_cloudy_puresky) by Greg Zaal and Jarod Guest, distributed through Poly Haven under CC0 1.0 Universal. The original tone-mapped panorama was resized and converted to WebP for browser delivery.
