import "dotenv/config";

export default ({ config }) => {
  const baseConfig = config;
  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra, // <<< THIS IS THE CRUCIAL LINE! Spread existing extra properties
      eas: {
        ...baseConfig.extra?.eas, // Also spread existing EAS properties if they exist
        projectId: "46d48457-3d50-40e2-8a3f-011aa2939a79", // Ensure your actual project ID is here
      },
      LEFU_API_KEY: process.env.LEFU_API_KEY ?? "default_api_key",
      LEFU_API_SECRET: process.env.LEFU_API_SECRET ?? "default_api_secret",
    },
  };
};
