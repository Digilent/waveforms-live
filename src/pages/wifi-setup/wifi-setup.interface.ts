export interface WifiInfoContainer {
    ssid: string | null,
    bssid: string | null,
    securityType: string | null,
    channel: number | null,
    signalStrength: number | null
}