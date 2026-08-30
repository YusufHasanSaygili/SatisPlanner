# SatisPlanner

SatisPlanner helps you plan Satisfactory factories before building them in the game. Add machines, connect production lines and check item flow, power use and transport limits.

## Download

The [latest release](https://github.com/YusufHasanSaygili/SatisPlanner/releases/latest) includes:

- a Windows installer
- a portable Windows build
- portable Linux and macOS builds

For the current release, see the [getting started guide](docs/user-guide/GETTING-STARTED.md) and the [example factories](examples/README.md).

## What it handles

- Individual machine settings, including clock speed, Power Shards, Somersloops and standby
- Miners and extractors with resource purity and tier settings
- Recipes, inputs, outputs and steady-state production rates
- Conveyor and pipeline capacity checks
- Power consumption
- Bottleneck warnings
- Save files, autosave and recovery
- Import and export
- Local game-data and icon imports

Plans and imported data stay on your computer.

## Development

You need Node.js 24, pnpm 11.16 or newer in the 11.x line, and the stable Rust toolchain.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Run the main checks:

```powershell
pnpm quality
pnpm test:e2e
pnpm desktop:bundle:windows
```

Check the Tauri side separately:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

## Where things are

```text
apps/desktop-ui/       React interface
packages/domain/       Factory and machine models
packages/game-data/    Imported Satisfactory data
packages/calculation/  Production and power calculations
packages/graph-adapter Graph view adapter
src-tauri/              Desktop shell
tests/e2e/              Browser tests
examples/               Example factories
docs/user-guide/        User documentation
```

The longer design and development notes are under `docs/` and `SatisPlanner-development-plan/`.

## Game files

SatisPlanner does not ship Coffee Stain Studios artwork or raw game-data dumps. You can point it at files from your own Satisfactory installation. Imported data is copied into SatisPlanner's own format; the game installation is not changed.

## Credits

The project uses [adepierre/ficsit-companion](https://github.com/adepierre/ficsit-companion) as a reference for behavior, file formats and architecture. Its MIT license and attribution are kept in [LICENSE](LICENSE).

SatisPlanner is a fan-made project. It is not affiliated with or endorsed by Coffee Stain Studios.