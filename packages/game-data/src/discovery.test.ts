import { describe, expect, it } from "vitest";
import {
	createCustomInstallHint,
	createEpicInstallHint,
	createSteamInstallHint,
	discoverDocsSources,
	type ReadOnlySourceFileSystem,
} from "./discovery";

function normalize(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/\/{2,}/g, "/")
		.replace(/\/$/, "")
		.toLowerCase();
}

class FakeReadOnlyFileSystem implements ReadOnlySourceFileSystem {
	readonly #directories = new Map<string, readonly string[]>();
	readonly #sizes = new Map<string, number>();
	readonly #aliases = new Map<string, string>();

	addDocsDirectory(path: string, files: Readonly<Record<string, number>>): this {
		const canonical = normalize(path);
		this.#directories.set(canonical, Object.keys(files));
		for (const [fileName, size] of Object.entries(files)) {
			this.#sizes.set(normalize(`${canonical}/${fileName}`), size);
		}
		return this;
	}

	alias(path: string, canonicalPath: string): this {
		this.#aliases.set(normalize(path), normalize(canonicalPath));
		return this;
	}

	async realPath(path: string): Promise<string> {
		const requested = normalize(path);
		const hasAlias = this.#aliases.has(requested);
		const canonical = this.#aliases.get(requested) ?? requested;
		const isInstallRoot = [...this.#directories.keys()].some((entry) =>
			entry.startsWith(`${canonical}/communityresources/docs`),
		);
		if (
			!this.#directories.has(canonical) &&
			!this.#sizes.has(canonical) &&
			!isInstallRoot &&
			!hasAlias
		) {
			throw new Error("missing path");
		}
		return canonical;
	}

	async directoryExists(path: string): Promise<boolean> {
		const canonical = this.#aliases.get(normalize(path)) ?? normalize(path);
		return this.#directories.has(canonical);
	}

	async listFileNames(path: string): Promise<readonly string[]> {
		return this.#directories.get(normalize(path)) ?? [];
	}

	async fileSize(path: string): Promise<number> {
		return this.#sizes.get(normalize(path)) ?? 0;
	}
}

describe("read-only game installation discovery", () => {
	it("discovers Steam, Epic and user-selected custom sources without write capability", async () => {
		const fileSystem = new FakeReadOnlyFileSystem()
			.addDocsDirectory("C:/Steam/Satisfactory/CommunityResources/Docs", {
				"en-US.json": 1_000,
				"tr.json": 1_100,
			})
			.addDocsDirectory("D:/Epic/Satisfactory/CommunityResources/Docs", {
				"en-US.json": 1_200,
			})
			.addDocsDirectory("E:/Custom/Satisfactory/CommunityResources/Docs", {
				"Docs.json": 900,
			});
		const result = await discoverDocsSources(
			fileSystem,
			[
				createSteamInstallHint("C:/Steam/Satisfactory"),
				createEpicInstallHint("D:/Epic/Satisfactory"),
				createCustomInstallHint("E:/Custom/Satisfactory/CommunityResources/Docs"),
			],
			"tr",
		);

		expect(result.candidates).toHaveLength(3);
		expect(result.selectionRequired).toBe(true);
		expect(result.diagnostics).toEqual([]);
		expect(result.candidates[0]?.preferredFile.locale).toBe("tr");
		expect(result.candidates[2]?.preferredFile.format).toBe("legacy");
		expect("writeFile" in fileSystem).toBe(false);
	});

	it("returns user-facing diagnostics for missing, fake and oversized sources without crashing", async () => {
		const fileSystem = new FakeReadOnlyFileSystem().addDocsDirectory(
			"C:/Fake/Satisfactory/CommunityResources/Docs",
			{ "en-US.json": 40 * 1024 * 1024 },
		);
		const result = await discoverDocsSources(fileSystem, [
			{ kind: "steam", path: "Z:/Missing/Satisfactory" },
			{ kind: "custom", path: "C:/Fake/Satisfactory", selectedByUser: true },
		]);
		expect(result.candidates).toEqual([]);
		expect(result.diagnostics.map((entry) => entry.code)).toEqual(
			expect.arrayContaining(["SOURCE_NOT_READABLE", "SOURCE_TOO_LARGE", "SOURCE_NOT_FOUND"]),
		);
	});

	it("rejects a canonical Docs path that escapes the authorized installation", async () => {
		const fileSystem = new FakeReadOnlyFileSystem()
			.addDocsDirectory("C:/Outside/CommunityResources/Docs", { "en-US.json": 1_000 })
			.alias("C:/Game", "C:/Game")
			.alias("C:/Game/CommunityResources/Docs", "C:/Outside/CommunityResources/Docs");
		const result = await discoverDocsSources(fileSystem, [{ kind: "steam", path: "C:/Game" }]);
		expect(result.candidates).toEqual([]);
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({ code: "SOURCE_NOT_AUTHORIZED" }),
		);
	});
});
