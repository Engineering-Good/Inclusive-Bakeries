import 'dotenv/config'

export default ({ config }) => {
	return {
		...config,
		extra: {
			LEFU_API_KEY: process.env.LEFU_API_KEY ?? 'default_api_key',
			LEFU_API_SECRET: process.env.LEFU_API_SECRET ?? 'default_api_secret',
		},
	}
}
