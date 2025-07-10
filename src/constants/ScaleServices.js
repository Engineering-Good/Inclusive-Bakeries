export const SCALE_SERVICES = {
	MOCK: 'MOCK',
	ETEKCITY: 'ETEKCITY',
	BLUETOOTH: 'BLUETOOTH',
	LEFU: 'LEFU',
}

export const SCALE_SERVICE_LABELS = {
	[SCALE_SERVICES.MOCK]: 'Mock Scale (Testing)',
	[SCALE_SERVICES.ETEKCITY]: 'Etekcity Scale',
	[SCALE_SERVICES.BLUETOOTH]: 'Generic Bluetooth Scale',
	[SCALE_SERVICES.LEFU]: 'Lefu Kitchen Scale',
}

export const SCALE_SERVICE_DESCRIPTIONS = {
	[SCALE_SERVICES.MOCK]: 'A mock scale service for testing and development',
	[SCALE_SERVICES.ETEKCITY]: 'Connect to an Etekcity smart scale',
	[SCALE_SERVICES.BLUETOOTH]: 'Connect to any compatible Bluetooth scale',
	[SCALE_SERVICES.LEFU]: 'Connect to a Lefu Kitchen Scale',
}
