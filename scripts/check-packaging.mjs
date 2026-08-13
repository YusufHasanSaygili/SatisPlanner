import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const errors = [];
const expectedVersion = readJson("package.json").version;
const config = readJson("src-tauri/tauri.conf.json");
const capability = readJson("src-tauri/capabilities/default.json");

if (config.productName !== "SatisPlanner") errors.push("Tauri productName must be SatisPlanner.");
if (config.version !== expectedVersion) errors.push("Tauri/package versions must match.");
if (config.identifier !== "dev.satisplanner.desktop") errors.push("Bundle identifier changed.");
if (config.bundle?.active !== true) errors.push("Desktop bundling must be active.");
if (JSON.stringify(config.bundle?.targets) !== JSON.stringify(["nsis"])) {
	errors.push("The declared installer target must remain NSIS.");
}
if (config.bundle?.windows?.nsis?.installMode !== "currentUser") {
	errors.push("NSIS must remain current-user scoped and non-administrative.");
}
if (config.app?.windows?.[0]?.title !== "SatisPlanner") {
	errors.push("The desktop window title must be SatisPlanner.");
}
if (JSON.stringify(capability.permissions) !== JSON.stringify(["core:default"])) {
	errors.push("Desktop capability scope expanded beyond core:default.");
}
if (!String(capability.description).includes("no filesystem, shell, dialog, or network plugins")) {
	errors.push("Default-deny capability rationale is missing.");
}

const cargo = readFileSync(new URL("src-tauri/Cargo.toml", root), "utf8");
if (!cargo.includes(`version = "${expectedVersion}"`))
	errors.push("Cargo/package versions must match.");
for (const path of [
	"THIRD-PARTY-NOTICES.md",
	"CHANGELOG.md",
	"docs/packaging-release/DECISIONS.md",
]) {
	try {
		readFileSync(new URL(path, root), "utf8");
	} catch {
		errors.push(`${path} is required for packaged releases.`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(error);
	process.exit(1);
}
console.log(`Packaging policy verified for SatisPlanner v${expectedVersion}.`);
