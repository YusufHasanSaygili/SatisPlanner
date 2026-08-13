# v1.0.0 User Acceptance Walkthrough

## Automated acceptance

- R-001: three independent machine instances persist isolated settings through reload.
- R-003: Constructor/Assembler/Manufacturer Somersloop slot and multiplier matrices pass.
- R-009: Coal 1,200→780/min Mk.5 bottleneck and Mk.6 resolution pass.
- Three canonical examples parse, migrate, serialize and recalculate to golden outputs in the
  production-built frontend used by the desktop package.
- First-run no-game onboarding and fallback catalog walkthrough pass Playwright/axe.
- Real local Satisfactory 1.2 Docs read-only import passes without changing source bytes.
- Windows clean host installs, launches, autosaves/reopens, uninstalls and retains user data.

## Human release check

1. Verify installer checksum and attestation; install without administrator access.
2. Confirm first-run privacy/fallback text and reopen it from **First-run guide**.
3. Import each file in [`examples`](../../examples/README.md), apply after preview and compare golden rates.
4. Export the active plan; preview re-import; cancel once and apply once.
5. Uninstall and confirm the exported plan and app-owned save remain.

Final product acceptance remains pending until the user explicitly approves the published v1.0.0.
