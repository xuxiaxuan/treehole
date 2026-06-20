import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

client.interceptors.request.use((c) => {
  const t = useAuthStore.getState().token
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

client.interceptors.response.use(
  (r) => {
    if (r.data.code !== 200) {
      if (r.data.code === 401 || r.data.code === 403) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(r.data.msg))
    }
    return r.data.data
  },
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
