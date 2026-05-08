
export const config = {
  apiUrl: window.__ENV__?.VITE_API_URL ?? import.meta.env.VITE_API_URL,
  uploadUrl: window.__ENV__?.VITE_UPLOAD_URL ?? import.meta.env.VITE_UPLOAD_URL,
  env: window.__ENV__?.VITE_ENV ?? import.meta.env.VITE_ENV,
};
