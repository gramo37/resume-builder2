export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  /** Vite sets this from NODE_ENV. True for `npm run dev`, false in production builds. */
  showJsonEditor: import.meta.env.DEV,
} as const
