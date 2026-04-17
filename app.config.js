import "dotenv/config";

export default ({ config }) => {
  const baseConfig = config;
  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra, // <<< THIS IS THE CRUCIAL LINE! Spread existing extra properties
      eas: {
        ...baseConfig.extra?.eas, // Also spread existing EAS properties if they exist
      },
      LEFU_API_KEY: process.env.LEFU_API_KEY,
      LEFU_API_SECRET: process.env.LEFU_API_SECRET,
    },
  };
};
