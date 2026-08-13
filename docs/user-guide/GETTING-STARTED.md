# Getting Started with SatisPlanner 1.0

SatisPlanner is an offline-first, independent fan-made factory planner for Satisfactory 1.2. It is
not affiliated with or endorsed by Coffee Stain Studios. Your plans, imported catalog snapshots and
icon cache stay on your machine.

## Install and first launch

1. Download `SatisPlanner-windows-x64-v1.0.0-setup.exe` from the
   [v1.0.0 release](https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v1.0.0).
2. The release is unsigned, so Windows may show a reputation warning. Download only from the
   official release; advanced users can verify GitHub provenance with `gh attestation verify`.
3. Run the current-user installer. Administrator access is not required. WebView2 may be downloaded
   on first installation if Windows does not already provide it.
4. Read the first-run guide and choose **Start planning**.

Satisfactory does not need to be installed. The fallback catalog and original generic icons are
enough to open all three [example plans](../../examples/README.md).

## First graph

1. Search the left library for `Iron Ore` and add it to the canvas.
2. Add **Smelter · Iron Ingot**, then **Constructor · Iron Plate**.
3. Connect output handles to matching input handles.
4. Select a node and edit purity, extractor tier, clock, Power Shards or Somersloops in the inspector.
5. Read requested, actual, surplus/deficit, efficiency and power values in the inspector.

Autosave starts automatically. Use **Save, import & migration** to export a canonical plan or preview
an existing SatisPlanner/upstream `.fcs` import before applying it.

Next: [local game data and icons](GAME-DATA-AND-ICONS.md), [using the planner](USING-THE-PLANNER.md),
[backup and recovery](BACKUP-AND-RECOVERY.md), and [troubleshooting](TROUBLESHOOTING.md).
