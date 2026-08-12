import type { FactoryPlanV3, JsonValue } from "./plan-schema";

export interface WorkspaceGroup {
	readonly id: string;
	readonly label: string;
	readonly note: string;
	readonly color: string;
	readonly nodeIds: readonly string[];
}

export function workspaceGroups(plan: FactoryPlanV3): readonly WorkspaceGroup[] {
	const raw = plan.userMetadata.workspaceGroups;
	return Array.isArray(raw) ? (raw as unknown as readonly WorkspaceGroup[]) : [];
}

export function upsertWorkspaceGroup(plan: FactoryPlanV3, group: WorkspaceGroup): FactoryPlanV3 {
	const groups = workspaceGroups(plan).filter((entry) => entry.id !== group.id);
	return {
		...plan,
		updatedAt: new Date().toISOString(),
		userMetadata: {
			...plan.userMetadata,
			workspaceGroups: [...groups, group] as unknown as JsonValue,
		},
	};
}
