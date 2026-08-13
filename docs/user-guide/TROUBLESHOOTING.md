# Troubleshooting

## Windows warns about the installer

v1.0.0 is unsigned because no commercial Authenticode certificate is configured. Download only from
the official release, verify `SHA256SUMS.txt`, and optionally run `gh attestation verify <file> -R
YusufHasanSaygili/SatisPlanner`. Do not bypass a warning if verification fails.

## The game or icons are missing

This is supported: use the fallback catalog and generic icons. For local Docs, select an official,
unmodified locale JSON within the size limit. Icon sources must be an already extracted folder;
automatic `.pak` extraction is intentionally unavailable.

## A plan is unresolved

Review the import preview for snapshot mismatch or recipe IDs absent from the active catalog. Keep the
original file, switch back to the matching catalog, or repair unresolved nodes manually. Never edit
schema/version/hash fields to silence validation.

## Autosave or startup recovery appears

Choose **Recover last-good** when the primary save is invalid or an interrupted temporary write was
found. Export the recovered plan immediately. If the application cannot remain open, attach the
failure diagnostics and a redacted exported plan to a
[GitHub issue](https://github.com/YusufHasanSaygili/SatisPlanner/issues/new/choose); never attach raw
game Docs, game artwork, personal paths or secrets.
