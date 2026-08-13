# Local Game Data and Icons

The bundled catalog is a redistribution-safe normalized Satisfactory 1.2 dataset: 195 item identities,
11 production buildings and 291 recipes. It omits raw descriptions, source paths and game artwork.
The library exposes all 13 supported extractable resources and one clear card per production building;
recipe selection happens after a machine is added. SatisPlanner's importer also supports localized
Satisfactory 1.2 files from the user's own installation and records source kind, file name, locale,
encoding, game/build version, importer version and SHA-256 provenance.

Typical source locations end in:

```text
<Satisfactory installation>/CommunityResources/Docs/en-US.json
```

Open **Game data catalog** in the left library and select the JSON file. The importer opens the source
read-only, validates encoding/schema/size, normalizes it and never writes into the game installation
or stores the raw file. If the game is absent, canceled or unsupported, use the complete bundled
catalog.

Local artwork is optional. SatisPlanner does not extract encrypted game packages and ships no game
artwork. The supported icon workflow accepts a user-selected, already extracted folder, resolves
safe `/Game/...Package.Object` mappings and writes resized WebP copies only into the app-owned cache.
Missing, invalid or renamed files use generic icons.

Current limitation: local Docs selection is available, but local artwork activation is not yet
connected to the UI. The first-run guide documents the source and privacy model; generic icons remain
available for every catalog entry. See [Known Limitations](../release-candidate/KNOWN-LIMITATIONS.md).
