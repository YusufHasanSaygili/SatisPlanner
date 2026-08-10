import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { discoverDocsSources, type ReadOnlySourceFileSystem } from "./discovery";
import { importDocsSnapshot } from "./snapshot";

const localDocsPath = process.env.SATISPLANNER_LOCAL_DOCS_FILE;
const localInstallRoot = process.env.SATISPLANNER_LOCAL_INSTALL_ROOT;
const localDescribe = localDocsPath || localInstallRoot ? describe : describe.skip;

class NodeReadOnlySourceFileSystem implements ReadOnlySourceFileSystem {
	async realPath(path: string): Promise<string> {
		return realpathSync(path);
	}

	async directoryExists(path: string): Promise<boolean> {
		return existsSync(path) && statSync(path).isDirectory();
	}

	async listFileNames(path: string): Promise<readonly string[]> {
		return readdirSync(path, { withFileTypes: true })
			.filter((entry) => entry.isFile())
			.map((entry) => entry.name);
	}

	async fileSize(path: string): Promise<number> {
		return statSync(path).size;
	}
}

localDescribe("installed Satisfactory Docs smoke", () => {
	it("discovers and imports the user-owned file without storing or modifying it", async () => {
		let sourcePath = localDocsPath;
		if (localInstallRoot) {
			const discovery = await discoverDocsSources(
				new NodeReadOnlySourceFileSystem(),
				[{ kind: "steam", path: localInstallRoot }],
				"en-US",
			);
			expect(discovery.diagnostics).toEqual([]);
			expect(discovery.candidates).toHaveLength(1);
			sourcePath = discovery.candidates[0]?.preferredFile.path;
		}
		if (!sourcePath) return;
		const before = readFileSync(sourcePath);
		const result = await importDocsSnapshot({
			bytes: new Uint8Array(before),
			fileName: "en-US.json",
			sourceKind: "steam",
			gameVersion: "1.2",
			buildId: process.env.SATISPLANNER_LOCAL_BUILD_ID,
		});
		if (!result.ok) throw new Error(JSON.stringify(result.diagnostics.slice(0, 10)));
		expect(result.ok).toBe(true);
		expect(result.snapshot.catalog.items.length).toBeGreaterThan(100);
		expect(result.snapshot.catalog.buildings.length).toBeGreaterThan(5);
		expect(result.snapshot.catalog.recipes.length).toBeGreaterThan(100);
		expect(readFileSync(sourcePath)).toEqual(before);
	}, 30_000);
});
