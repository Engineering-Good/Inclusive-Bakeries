import "dotenv/config";

export default ({ config }) => {
  const baseConfig = config;
  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra, // <<< THIS IS THE CRUCIAL LINE! Spread existing extra properties
      eas: {
        ...baseConfig.extra?.eas, // Also spread existing EAS properties if they exist
        projectId: "2b2885a1-106c-4edc-ab00-74af333f62c0", // Ensure your actual project ID is here
      },
      LEFU_API_KEY: process.env.LEFU_API_KEY ?? "lefuad83f4414473e85e",
      LEFU_API_SECRET: process.env.LEFU_API_SECRET ?? "Q1dZvqOt6Lb48q6OhFr6Sf6JS9IyEQLFjrNwYuMyipM=",
    },
  };
};
