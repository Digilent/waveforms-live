export interface WifiInfoContainer {
    ssid: string | null,
    bssid: string | null,
    securityType: 'wep40' | 'wep104' | 'wpa' | 'wpa2' | 'open' | null,
    channel: number | null,
    signalStrength: number | null
}

export interface NicStatusContainer {
    adapter: string | null,
    securityType: 'wep40' | 'wep104' | 'wpa' | 'wpa2' | 'open' | null,
    status: 'connected' | 'disconnected' | 'scanning' | 'connecting' | null,
    ssid: string | null,
    ipAddress?: string
}

export interface SavedWifiInfoContainer {
    ssid: string | null,
    bssid: string | null,
    securityType: 'wep40' | 'wep104' | 'wpa' | 'wpa2' | 'open' | null,
    storageLocation: string,
    autoConnect: boolean
}