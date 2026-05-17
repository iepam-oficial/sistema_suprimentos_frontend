import baseUrl from '@/utils/enviroments'
import axios from 'axios'
import { getRefreshedAccessToken, shouldSkip401Handling } from '@/utils/auth401Handler'
import { performLogout } from '@/utils/logout'

export const api = axios.create({
    baseURL: baseUrl,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@ti-assistant:token')
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
            return Promise.reject(error)
        }

        const requestUrl = originalRequest.url || ''

        if (shouldSkip401Handling(requestUrl)) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        const refreshToken = localStorage.getItem('@ti-assistant:refresh-token')
        if (!refreshToken) {
            await performLogout()
            return Promise.reject(error)
        }

        const newToken = await getRefreshedAccessToken()
        if (!newToken) {
            await performLogout()
            return Promise.reject(error)
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
    }
)
