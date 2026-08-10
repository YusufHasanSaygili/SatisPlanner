export interface CalculationFoundationStatus {
	readonly kind: "calculation-foundation";
	readonly engineEnabled: false;
}

export function getCalculationFoundationStatus(): CalculationFoundationStatus {
	return { kind: "calculation-foundation", engineEnabled: false };
}
