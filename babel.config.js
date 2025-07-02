module.exports = function (api) {
	api.cache(true)
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			[
				'module-resolver',
				{
					root: ['./'],
					alias: {
						'@components': './src/components',
						'@utils': './src/utils',
						'@modules': './modules',
						// Add more aliases as needed
					},
				},
			],
		],
	}
}
