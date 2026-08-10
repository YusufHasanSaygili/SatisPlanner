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
