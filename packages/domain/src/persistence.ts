import {
	FACTORY_PLAN_SCHEMA_VERSION,
	type FactoryPlanV4,
	type JsonValue,
	parseFactoryPlan,
	serializeFactoryPlan,
} from "./plan-schema";

export const PLAN_EXPORT_FORMAT_VERSION = 1 as const;

export interface PlanExportManifest {
	readonly formatVersion: typeof PLAN_EXPORT_FORMAT_VERSION;
	readonly planId: string;
	readonly planName: string;
	readonly planSchemaVersion: number;
	readonly gameDataSnapshotId: string;
	readonly exportedAt: string;
	readonly serializedPlanBytes: number;
}

export interface PlanExportBundle {
	readonly manifest: PlanExportManifest;
	readonly plan: FactoryPlanV4;
}

export interface PlanMigrationReport {
	readonly sourceSchemaVersion: number;
	readonly targetSchemaVersion: typeof FACTORY_PLAN_SCHEMA_VERSION;
	readonly appliedVersions: readonly string[];
	readonly snapshotStatus: "match" | "mismatch";
	readonly sourceSnapshotId: string;
	readonly activeSnapshotId: string;
	readonly unresolvedRecipeIds: readonly string[];
}

export type PlanImportPreview =
	| {
			readonly ok: true;
			readonly plan: FactoryPlanV4;
			readonly report: PlanMigrationReport;
			readonly originalText: string;
	  }
	| {
			readonly ok: false;
			readonly issues: readonly { readonly path: string; readonly message: string }[];
			readonly originalText: string;
	  };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

export function createPlanExportBundle(
	plan: FactoryPlanV4,
	exportedAt = new Date().toISOString(),
): PlanExportBundle {
	const serializedPlan = serializeFactoryPlan(plan);
	return {
		manifest: {
			formatVersion: PLAN_EXPORT_FORMAT_VERSION,
			planId: plan.planId,
			planName: plan.name,
			planSchemaVersion: plan.schemaVersion,
			gameDataSnapshotId: plan.gameDataSnapshotId,
			exportedAt,
			serializedPlanBytes: utf8Bytes(serializedPlan),
		},
		plan,
	};
}

export function serializePlanExportBundle(bundle: PlanExportBundle): string {
	return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function previewFactoryPlanImport(
	originalText: string,
	activeSnapshotId: string,
	knownRecipeIds: ReadonlySet<string> = new Set(),
): PlanImportPreview {
	let parsed: unknown;
	try {
		parsed = JSON.parse(originalText);
	} catch {
		return {
			ok: false,
			issues: [{ path: "$", message: "Import is not valid JSON." }],
			originalText,
		};
	}
	const candidate =
		isRecord(parsed) && "manifest" in parsed && "plan" in parsed ? parsed.plan : parsed;
	const sourceSchemaVersion =
		isRecord(candidate) && typeof candidate.schemaVersion === "number"
			? candidate.schemaVersion
			: 0;
	const result = parseFactoryPlan(candidate);
	if (!result.ok) {
		return {
			ok: false,
			issues: result.issues.map((issue) => ({ path: issue.path, message: issue.message })),
			originalText,
		};
	}
	const unresolvedRecipeIds = result.value.nodes
		.filter(
			(node) =>
				node.kind === "machine" && knownRecipeIds.size > 0 && !knownRecipeIds.has(node.recipeId),
		)
		.map((node) => (node.kind === "machine" ? node.recipeId : ""))
		.filter(
			(recipeId, index, entries) => recipeId.length > 0 && entries.indexOf(recipeId) === index,
		)
		.sort();
	const appliedVersions = Array.from(
		{ length: Math.max(0, FACTORY_PLAN_SCHEMA_VERSION - sourceSchemaVersion) },
		(_, index) => `${sourceSchemaVersion + index}→${sourceSchemaVersion + index + 1}`,
	);
	return {
		ok: true,
		plan: result.value,
		report: {
			sourceSchemaVersion,
			targetSchemaVersion: FACTORY_PLAN_SCHEMA_VERSION,
			appliedVersions,
			snapshotStatus: result.value.gameDataSnapshotId === activeSnapshotId ? "match" : "mismatch",
			sourceSnapshotId: result.value.gameDataSnapshotId,
			activeSnapshotId,
			unresolvedRecipeIds,
		},
		originalText,
	};
}

export function exportManifestMetadata(
	manifest: PlanExportManifest,
): Readonly<Record<string, JsonValue>> {
	return {
		formatVersion: manifest.formatVersion,
		planSchemaVersion: manifest.planSchemaVersion,
		gameDataSnapshotId: manifest.gameDataSnapshotId,
		exportedAt: manifest.exportedAt,
		serializedPlanBytes: manifest.serializedPlanBytes,
	};
}
