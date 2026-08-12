import { DomainValidationError } from "./errors";
import type { FactoryPlanV3, PlanNodeV3, TransportEdgeV3 } from "./plan-schema";
import { parseFactoryPlan } from "./plan-schema";

export const PLAN_CLIPBOARD_KIND = "satisplanner/subgraph" as const;
export const PLAN_CLIPBOARD_VERSION = 1 as const;

export interface PlanClipboardPayload {
	readonly kind: typeof PLAN_CLIPBOARD_KIND;
	readonly version: typeof PLAN_CLIPBOARD_VERSION;
	readonly nodes: readonly PlanNodeV3[];
	readonly edges: readonly TransportEdgeV3[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function copyPlanSubgraph(plan: FactoryPlanV3, selectedNodeIds: readonly string[]): string {
	const selected = new Set(selectedNodeIds);
	const nodes = plan.nodes.filter((node) => selected.has(node.id));
	const selectedPorts = new Set(nodes.flatMap((node) => node.ports.map((port) => port.id)));
	const edges = plan.edges.filter(
		(edge) => selectedPorts.has(edge.fromPortId) && selectedPorts.has(edge.toPortId),
	);
	return JSON.stringify({ kind: PLAN_CLIPBOARD_KIND, version: 1, nodes, edges });
}

export interface PastePlanSubgraphResult {
	readonly plan: FactoryPlanV3;
	readonly pastedNodeIds: readonly string[];
	readonly pastedEdgeIds: readonly string[];
}

export function pastePlanSubgraph(
	plan: FactoryPlanV3,
	text: string,
	createUuid: () => string,
	offset = { x: 40, y: 40 },
): PastePlanSubgraphResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new DomainValidationError("INVALID_PLAN", "Clipboard is not valid JSON.");
	}
	if (
		!isRecord(raw) ||
		raw.kind !== PLAN_CLIPBOARD_KIND ||
		raw.version !== PLAN_CLIPBOARD_VERSION ||
		!Array.isArray(raw.nodes) ||
		!Array.isArray(raw.edges) ||
		raw.nodes.length === 0
	) {
		throw new DomainValidationError(
			"INVALID_PLAN",
			"Clipboard does not contain a valid SatisPlanner subgraph.",
		);
	}

	const portIds = new Map<string, string>();
	const nodes = raw.nodes.map((rawNode) => {
		if (!isRecord(rawNode) || typeof rawNode.id !== "string" || !Array.isArray(rawNode.ports))
			throw new DomainValidationError("INVALID_PLAN", "Clipboard contains a malformed node.");
		const nodeId = createUuid();
		const ports = rawNode.ports.map((rawPort) => {
			if (!isRecord(rawPort) || typeof rawPort.id !== "string")
				throw new DomainValidationError("INVALID_PLAN", "Clipboard contains a malformed port.");
			const portId = createUuid();
			portIds.set(rawPort.id, portId);
			return { ...rawPort, id: portId };
		});
		const position = isRecord(rawNode.position)
			? { x: Number(rawNode.position.x) + offset.x, y: Number(rawNode.position.y) + offset.y }
			: rawNode.position;
		return { ...rawNode, id: nodeId, ports, position } as unknown as PlanNodeV3;
	});
	const edges = raw.edges.map((rawEdge) => {
		if (
			!isRecord(rawEdge) ||
			typeof rawEdge.fromPortId !== "string" ||
			typeof rawEdge.toPortId !== "string" ||
			!portIds.has(rawEdge.fromPortId) ||
			!portIds.has(rawEdge.toPortId)
		) {
			throw new DomainValidationError(
				"INVALID_PLAN",
				"Clipboard contains an external or malformed edge.",
			);
		}
		return {
			...rawEdge,
			id: createUuid(),
			fromPortId: portIds.get(rawEdge.fromPortId),
			toPortId: portIds.get(rawEdge.toPortId),
		} as unknown as TransportEdgeV3;
	});
	const candidate = {
		...plan,
		updatedAt: new Date().toISOString(),
		nodes: [...plan.nodes, ...nodes],
		edges: [...plan.edges, ...edges],
	};
	const validation = parseFactoryPlan(candidate);
	if (!validation.ok) {
		throw new DomainValidationError(
			"INVALID_PLAN",
			validation.issues[0]?.message ?? "Clipboard graph is invalid.",
			validation.issues[0]?.path,
		);
	}
	return {
		plan: validation.value,
		pastedNodeIds: nodes.map((node) => node.id),
		pastedEdgeIds: edges.map((edge) => edge.id),
	};
}
