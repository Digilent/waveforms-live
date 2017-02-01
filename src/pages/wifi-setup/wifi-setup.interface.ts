export interface WifiInfoContainer {
    ssid: string | null,
    bssid: string | null,
    securityType: 'wep40' | 'wep104' | 'wpa' | 'wpa2',
    channel: number | null,
    signalStrength: number | null
}