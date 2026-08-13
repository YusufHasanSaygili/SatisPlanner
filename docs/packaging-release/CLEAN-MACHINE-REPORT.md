# Slice 14 — Clean-Machine Verification

## Automated Windows host

The Windows GitHub-hosted runner is treated as the clean host. It has no Satisfactory installation
or SatisPlanner user profile. For every push it:

1. builds the portable release and current-user NSIS installer from frozen lockfiles;
2. installs silently without administrator or developer-toolchain prerequisites;
3. verifies the installed binary reports the expected SatisPlanner version;
4. launches with no game installed and waits for a stable fallback-catalog session;
5. confirms native autosave is written under the app-data `plans` directory;
6. closes and reopens the packaged app;
7. uninstalls and proves a user-data sentinel remains;
8. uploads installer, portable binary and logs/artifact manifest.

The smoke script is [`scripts/windows-clean-machine-smoke.ps1`](../../scripts/windows-clean-machine-smoke.ps1).
Failure output and standard GitHub Actions logs are retained with the run.

## Real Satisfactory 1.2 Docs

Real Docs cannot be redistributed to public CI. The existing opt-in integration test reads the
user-owned installation in place, imports its preferred locale, checks substantial item/building/
recipe counts and byte-compares the source afterward. It is run with:

```powershell
$env:SATISPLANNER_LOCAL_INSTALL_ROOT='<Satisfactory install folder>'
pnpm --filter @satisplanner/game-data exec vitest run src/local-install.integration.test.ts
```

Only source size, importer result counts and the normalized/source hashes are recorded; personal
paths and the game file itself are not committed or uploaded.

### Local read-only verification — 2026-08-13

- Source size: `10,640,180` bytes
- Source SHA-256: `a81d250e96aa13db3c0bf8c332c199ad930b2f15323e2c1a069afa4c07f971bb`
- Imported catalog: `195` items, `11` buildings, `291` recipes
- Result: discovery, import thresholds and the post-import byte comparison passed

The machine-specific installation path is intentionally omitted. The source file remained
byte-identical and was neither copied to the repository nor uploaded as test evidence.
