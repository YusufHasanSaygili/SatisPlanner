import type { FactoryPlanV3 } from "@satisplanner/domain";

export interface AutoLayoutOptions {
	readonly lockedNodeIds?: ReadonlySet<string>;
	readonly origin?: { readonly x: number; readonly y: number };
	readonly columnGap?: number;
	readonly rowGap?: number;
}

export function autoLayoutFactoryPlan(
	plan: FactoryPlanV3,
	options: AutoLayoutOptions = {},
): FactoryPlanV3 {
	const origin = options.origin ?? { x: 80, y: 80 };
	const columnGap = options.columnGap ?? 320;
	const rowGap = options.rowGap ?? 190;
	const locked = options.lockedNodeIds ?? new Set<string>();
	const ownerByPort = new Map<string, string>();
	for (const node of plan.nodes) for (const port of node.ports) ownerByPort.set(port.id, node.id);
	const outgoing = new Map<string, Set<string>>();
	const indegree = new Map(plan.nodes.map((node) => [node.id, 0]));
	for (const edge of plan.edges) {
		const from = ownerByPort.get(edge.fromPortId);
		const to = ownerByPort.get(edge.toPortId);
		if (!from || !to || from === to) continue;
		const targets = outgoing.get(from) ?? new Set<string>();
		if (!targets.has(to)) indegree.set(to, (indegree.get(to) ?? 0) + 1);
		targets.add(to);
		outgoing.set(from, targets);
	}
	const ranks = new Map<string, number>();
	const queue = plan.nodes
		.filter((node) => (indegree.get(node.id) ?? 0) === 0)
		.map((node) => node.id)
		.sort();
	for (const id of queue) ranks.set(id, 0);
	while (queue.length > 0) {
		const id = queue.shift() as string;
		const rank = ranks.get(id) ?? 0;
		for (const target of [...(outgoing.get(id) ?? [])].sort()) {
			ranks.set(target, Math.max(ranks.get(target) ?? 0, rank + 1));
			indegree.set(target, (indegree.get(target) ?? 1) - 1);
			if (indegree.get(target) === 0) {
				queue.push(target);
				queue.sort();
			}
		}
	}
	const cycleRank = Math.max(0, ...ranks.values()) + 1;
	for (const node of plan.nodes) if (!ranks.has(node.id)) ranks.set(node.id, cycleRank);
	const byRank = new Map<number, string[]>();
	for (const node of plan.nodes) {
		const rank = ranks.get(node.id) ?? 0;
		const ids = byRank.get(rank) ?? [];
		ids.push(node.id);
		byRank.set(rank, ids);
	}
	const positions = new Map<string, { x: number; y: number }>();
	for (const [rank, ids] of byRank) {
		ids.sort();
		ids.forEach((id, index) => {
			positions.set(id, { x: origin.x + rank * columnGap, y: origin.y + index * rowGap });
		});
	}
	return {
		...plan,
		updatedAt: new Date().toISOString(),
		nodes: plan.nodes.map((node) =>
			locked.has(node.id) ? node : { ...node, position: positions.get(node.id) ?? node.position },
		),
	};
}
