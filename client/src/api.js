import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })
export const errorText = error => error.response?.data?.error?.message || 'The case room is unavailable. Check the server and try again.'
export default api
