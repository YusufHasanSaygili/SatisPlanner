import { type GameDataDiagnostic, errorDiagnostic } from "./errors";
import { MAX_DOCS_FILE_BYTES } from "./encoding";

export type InstallSourceKind = "steam" | "epic" | "custom";

export interface InstallPathHint {
	readonly kind: InstallSourceKind;
	readonly path: string;
	readonly selectedByUser?: boolean;
}

export interface DocsSourceCandidate {
	readonly id: string;
	readonly kind: InstallSourceKind;
	readonly installPath: string;
	readonly docsPath: string;
	readonly files: readonly DocsSourceFile[];
	readonly preferredFile: DocsSourceFile;
}

export interface DocsSourceFile {
	readonly fileName: string;
	readonly path: string;
	readonly locale: string;
	readonly format: "localized" | "legacy";
	readonly sizeBytes: number;
}

export interface SourceDiscoveryResult {
	readonly candidates: readonly DocsSourceCandidate[];
	readonly diagnostics: readonly GameDataDiagnostic[];
	readonly selectionRequired: boolean;
}

export interface ReadOnlySourceFileSystem {
	realPath(path: string): Promise<string>;
	directoryExists(path: string): Promise<boolean>;
	listFileNames(path: string): Promise<readonly string[]>;
	fileSize(path: string): Promise<number>;
}

function normalizePath(path: string): string {
	const normalized = path
		.trim()
		.replace(/\\/g, "/")
		.replace(/\/{2,}/g, "/");
	return normalized.length > 1 ? normalized.replace(/\/$/, "") : normalized;
}

function joinPath(parent: string, child: string): string {
	return `${normalizePath(parent)}/${child.replace(/^[/\\]+/, "")}`;
}

function isDocsDirectory(path: string): boolean {
	return normalizePath(path).toLowerCase().endsWith("/communityresources/docs");
}

function isWithin(parent: string, child: string): boolean {
	const canonicalParent = normalizePath(parent).toLowerCase();
	const canonicalChild = normalizePath(child).toLowerCase();
	return canonicalChild === canonicalParent || canonicalChild.startsWith(`${canonicalParent}/`);
}

function localeFromFileName(fileName: string): string | undefined {
	if (fileName.toLowerCase() === "docs.json") return "legacy";
	const match = /^([a-z]{2,3}(?:-[a-z0-9]{2,4})?)\.json$/i.exec(fileName);
	return match?.[1];
}

function sourceId(kind: InstallSourceKind, docsPath: string): string {
	let hash = 2_166_136_261;
	for (const character of `${kind}:${normalizePath(docsPath).toLowerCase()}`) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16_777_619);
	}
	return `${kind}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createCustomInstallHint(selectedPath: string): InstallPathHint {
	return { kind: "custom", path: selectedPath, selectedByUser: true };
}

export function createSteamInstallHint(installPath: string): InstallPathHint {
	return { kind: "steam", path: installPath };
}

export function createEpicInstallHint(installPath: string): InstallPathHint {
	return { kind: "epic", path: installPath };
}

export async function discoverDocsSources(
	fileSystem: ReadOnlySourceFileSystem,
	hints: readonly InstallPathHint[],
	preferredLocale = "en-US",
): Promise<SourceDiscoveryResult> {
	const diagnostics: GameDataDiagnostic[] = [];
	const candidates: DocsSourceCandidate[] = [];
	const seenDocsPaths = new Set<string>();

	for (const [index, hint] of hints.entries()) {
		const hintPath = hint.path.trim();
		if (hintPath.length === 0) {
			diagnostics.push(
				errorDiagnostic(
					"SOURCE_NOT_FOUND",
					`$hints[${index}].path`,
					"An empty game installation path was ignored.",
					"Choose the Satisfactory installation or CommunityResources/Docs folder.",
				),
			);
			continue;
		}

		try {
			const selectedCanonical = await fileSystem.realPath(hintPath);
			const installPath = isDocsDirectory(selectedCanonical)
				? normalizePath(selectedCanonical).replace(/\/CommunityResources\/Docs$/i, "")
				: selectedCanonical;
			const requestedDocsPath = isDocsDirectory(selectedCanonical)
				? selectedCanonical
				: joinPath(selectedCanonical, "CommunityResources/Docs");
			if (!(await fileSystem.directoryExists(requestedDocsPath))) {
				diagnostics.push(
					errorDiagnostic(
						"SOURCE_NOT_FOUND",
						`$hints[${index}]`,
						`No CommunityResources/Docs directory was found for the ${hint.kind} hint.`,
						"Verify the installation path or choose the Docs folder manually.",
					),
				);
				continue;
			}
			const docsPath = await fileSystem.realPath(requestedDocsPath);
			const authorizationRoot =
				hint.selectedByUser && isDocsDirectory(selectedCanonical) ? selectedCanonical : installPath;
			if (!isWithin(authorizationRoot, docsPath)) {
				diagnostics.push(
					errorDiagnostic(
						"SOURCE_NOT_AUTHORIZED",
						`$hints[${index}]`,
						"The canonical Docs path escapes the selected installation root.",
						"Select the real Satisfactory installation without symlink redirection.",
					),
				);
				continue;
			}
			const normalizedDocsPath = normalizePath(docsPath).toLowerCase();
			if (seenDocsPaths.has(normalizedDocsPath)) continue;

			const files: DocsSourceFile[] = [];
			for (const fileName of await fileSystem.listFileNames(docsPath)) {
				const locale = localeFromFileName(fileName);
				if (!locale) continue;
				const path = joinPath(docsPath, fileName);
				const canonicalFile = await fileSystem.realPath(path);
				if (!isWithin(docsPath, canonicalFile)) continue;
				const sizeBytes = await fileSystem.fileSize(canonicalFile);
				if (sizeBytes <= 0 || sizeBytes > MAX_DOCS_FILE_BYTES) {
					diagnostics.push(
						errorDiagnostic(
							"SOURCE_TOO_LARGE",
							`$source.${fileName}`,
							`Docs file ${fileName} is empty or exceeds the importer size limit.`,
							"Choose an official localized Docs file from the game installation.",
						),
					);
					continue;
				}
				files.push({
					fileName,
					path: canonicalFile,
					locale,
					format: fileName.toLowerCase() === "docs.json" ? "legacy" : "localized",
					sizeBytes,
				});
			}
			files.sort((left, right) => left.fileName.localeCompare(right.fileName));
			const preferredFile =
				files.find((file) => file.locale.toLowerCase() === preferredLocale.toLowerCase()) ??
				files.find((file) => file.locale.toLowerCase() === "en-us") ??
				files.find((file) => file.format === "localized") ??
				files[0];
			if (!preferredFile) {
				diagnostics.push(
					errorDiagnostic(
						"SOURCE_NOT_FOUND",
						`$hints[${index}]`,
						"The Docs directory contains no supported locale JSON or legacy Docs.json file.",
						"Verify the game files in Steam/Epic or choose another installation.",
					),
				);
				continue;
			}

			seenDocsPaths.add(normalizedDocsPath);
			candidates.push({
				id: sourceId(hint.kind, docsPath),
				kind: hint.kind,
				installPath,
				docsPath,
				files: Object.freeze(files),
				preferredFile,
			});
		} catch {
			diagnostics.push(
				errorDiagnostic(
					"SOURCE_NOT_READABLE",
					`$hints[${index}]`,
					`The ${hint.kind} installation hint could not be read.`,
					"Check folder permissions or choose the Docs folder manually.",
				),
			);
		}
	}

	return {
		candidates: Object.freeze(candidates),
		diagnostics: Object.freeze(diagnostics),
		selectionRequired: candidates.length > 1,
	};
}
