export const DOMAIN_FOUNDATION_VERSION = 1 as const;

export interface DomainFoundationStatus {
	readonly kind: "domain-foundation";
	readonly version: typeof DOMAIN_FOUNDATION_VERSION;
	readonly frameworkIndependent: true;
}

export function getDomainFoundationStatus(): DomainFoundationStatus {
	return {
		kind: "domain-foundation",
		version: DOMAIN_FOUNDATION_VERSION,
		frameworkIndependent: true,
	};
}

export * from "./errors";
export * from "./game-profile";
export * from "./graph";
export * from "./machine";
export * from "./persistence";
export * from "./plan-clipboard";
export * from "./plan-history";
export * from "./plan-schema";
export * from "./rational";
export * from "./transport";
export * from "./units";
export * from "./workspace-metadata";
