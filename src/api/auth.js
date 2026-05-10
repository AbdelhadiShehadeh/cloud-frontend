import api from './axios'

export const loginApi = (email, password) =>
  api.post('/api/auth/login', { email, password })

export const registerApi = (name, email, password) =>
  api.post('/api/auth/register', { name, email, password })
