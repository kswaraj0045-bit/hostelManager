const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

export const resolveApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return '/api'
  const origin = trimTrailingSlash(apiUrl.trim())
  return origin.endsWith('/api') ? origin : `${origin}/api`
}

export const resolveSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL
  if (!socketUrl) return ''
  return trimTrailingSlash(socketUrl.trim())
}