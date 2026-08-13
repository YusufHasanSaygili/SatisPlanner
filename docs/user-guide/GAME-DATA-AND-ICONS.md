# Local Game Data and Icons

The bundled fallback catalog is intentionally small and redistribution-safe. SatisPlanner's importer
supports localized Satisfactory 1.2 files from the user's own installation and records source kind,
file name, locale, encoding, game/build version, importer version and SHA-256 provenance.

Typical source locations end in:

```text
<Satisfactory installation>/CommunityResources/Docs/en-US.json
```

The importer opens the selected source read-only, validates encoding/schema/size, normalizes it and
byte-compares it after the integration test. It never writes into the game installation or commits
the raw file. If the game is absent, canceled or unsupported, keep using the fallback catalog.

Local artwork is optional. SatisPlanner does not extract encrypted game packages and ships no game
artwork. The supported icon workflow accepts a user-selected, already extracted folder, resolves
safe `/Game/...Package.Object` mappings and writes resized WebP copies only into the app-owned cache.
Missing, invalid or renamed files use generic icons.

Current v1.0 limitation: the importer/cache engines and read-only verification are complete, but a
native folder-picker activation screen is not shipped. The first-run guide documents the source and
privacy model; the planner remains fully usable with the fallback catalog. See
[Known Limitations](../release-candidate/KNOWN-LIMITATIONS.md).
