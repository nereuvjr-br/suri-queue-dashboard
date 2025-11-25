/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_API_KEY: string
    readonly VITE_BUSINESS_START_HOUR: string
    readonly VITE_BUSINESS_END_HOUR: string
    readonly VITE_REFRESH_INTERVAL: string
    readonly VITE_SLA_LIMIT: string
    readonly VITE_VIEW_DURATION: string
    readonly VITE_APP_PASSWORD: string
    readonly VITE_PORTAL_URL: string
    readonly VITE_PORTAL_API_URL: string
    readonly VITE_STATUS_CHECK_INTERVAL: string
    readonly VITE_EXTERNAL_URLS: string
    readonly VITE_AVG_TIME_ALERT_LIMIT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
