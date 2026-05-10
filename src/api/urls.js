import api from './axios'

export const shortenUrl = (originalUrl) =>
  api.post('/api/urls/shorten', { originalUrl })

export const getUrls = () => api.get('/api/urls')

export const deleteUrl = (id) => api.delete(`/api/urls/${id}`)

export const getAnalytics = (id) => api.get(`/api/urls/${id}/analytics`)
