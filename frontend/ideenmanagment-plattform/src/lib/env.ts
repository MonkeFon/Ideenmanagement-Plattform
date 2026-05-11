export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  ENABLE_MSW: import.meta.env.VITE_ENABLE_MSW === 'true',
};

