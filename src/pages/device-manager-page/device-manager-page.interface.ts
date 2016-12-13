export interface DeviceCardInfo {
    deviceDescriptor: any,
    ipAddress: string,
    hostname: string,
    bridge: boolean,
    deviceBridgeAddress: string,
    connectedDeviceAddress: string
}

export interface DeviceConfigureParams {

    potentialDevices: any,
    deviceBridgeAddress: string,
    bridge: boolean,
    deviceManagerPageRef: any
    deviceObject: any
}