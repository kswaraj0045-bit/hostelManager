const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const remapLocalhostToCurrentHost = (value) => {
  if (typeof window === 'undefined' || !value) return value;

  const currentHost = window.location.hostname;
  if (!currentHost || LOCAL_HOSTS.has(currentHost)) return value;

  try {
    const url = new URL(value);
    if (!LOCAL_HOSTS.has(url.hostname)) return value;

    url.hostname = currentHost;
    return trimTrailingSlash(url.toString());
  } catch {
    return value;
  }
};

const resolveServerOrigin = (envValue) => {
  if (!envValue) return '';
  return trimTrailingSlash(remapLocalhostToCurrentHost(envValue.trim()));
};

export const resolveApiBaseUrl = () => {
  const origin = resolveServerOrigin(import.meta.env.VITE_API_URL);
  if (!origin) return '/api';
  return origin.endsWith('/api') ? origin : `${origin}/api`;
};

export const resolveSocketUrl = () => resolveServerOrigin(import.meta.env.VITE_SOCKET_URL);
