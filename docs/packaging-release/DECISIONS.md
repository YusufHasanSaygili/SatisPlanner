# Slice 14 — Packaging and Supply-Chain Decisions

## Distribution formats

Windows receives a **current-user NSIS installer** and a portable executable. The installer needs no
administrator rights and installs below `%LOCALAPPDATA%`. Linux and macOS remain portable development
binaries until platform signing/notarization is available. Web builds remain CI evidence rather than
an additional user-facing Release download.
The Windows installer uses Tauri's WebView2 download bootstrapper, so a missing WebView2 runtime is
installed without requiring a developer toolchain; first installation may require network access.

Application data is separate from installed program files under the platform app-data directory
(`dev.satisplanner.desktop`). NSIS uninstall removes program files but does not delete plans, local
catalog snapshots or icon caches. The clean-machine smoke writes a sentinel, installs, launches with
no game present, confirms autosave/reopen, uninstalls and proves the sentinel remains.

## Capability and local-game policy

`src-tauri/capabilities/default.json` grants only `core:default`. There is no arbitrary filesystem,
shell, dialog or network plugin capability. Native plan persistence is a narrow typed command that
writes only below app data. Satisfactory Docs/icon sources are selected by the user and read-only;
they are never copied into source control or release artifacts. Generic original fallback icons let
the packaged app run when no Satisfactory installation exists.

## Signing and provenance

`v1.0.0` is the first stable release and is **unsigned**: no Windows Authenticode,
Apple Developer ID or notarization secret is configured. Users can verify the GitHub/Sigstore build
attestation. The tag workflow builds on clean GitHub-hosted runners, enforces the frozen pnpm/Cargo
lockfiles, scans forbidden game artwork, attests each platform package and verifies tag, package
version, pushed SHA and downloaded artifact equality.

The release job has `contents: write`, `id-token: write` and `attestations: write`; build/test jobs
retain read-only repository access. No long-lived signing secret is used.

## License policy

Runtime components must use permissive licenses compatible with distribution. Pull requests run
GitHub dependency review and block high-severity vulnerabilities and newly introduced GPL-3.0,
AGPL-3.0 or SSPL-1.0 dependencies. `THIRD-PARTY-NOTICES.md` identifies primary shipped components and
the lockfiles preserve the exact transitive dependency inventory.
