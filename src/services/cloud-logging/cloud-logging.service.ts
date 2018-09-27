import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CloudLoggingService {

    private activeDevice: DeviceService;
    public enabled: boolean = false;
    public params: CloudLoggingParams;
    public defaultParams: CloudLoggingParams = {
        apiKey: '',
        channelId: '',
        sampleFreq: 10,
        analogChans: []
    };

    constructor(
        public deviceManagerService: DeviceManagerService,
        public storageService: StorageService,
        public events: Events
    ) {
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.params = this.defaultParams;
        this.storageService.getData('cloudLogging').then((data) => {
            if (data) {
                data = JSON.parse(data);
                this.params.apiKey = data.apiKey
                this.params.channelId = data.channelId;
                this.params.sampleFreq = data.sampleFreq;
            }
        });
    }

    public saveAndEnable(params: CloudLoggingParams) {
        this.params = params;
        this.enabled = true;
        this.storageService.saveData('cloudLogging', JSON.stringify(params));
        this.events.publish('cloudLogging:enabled', { sampleFreq: this.params.sampleFreq });

        // TODO: send command to device to enable cloud logging
    }

    public disable() {
        this.enabled = false;

        // TODO: send command to device to disable cloud logging
    }

    public getSavedParams(): CloudLoggingParams {
        if (this.params.analogChans.length == 0) {
            this.params.analogChans = this.getActiveDeviceChannels();
        }
        return this.params;
    }

    public getActiveDeviceChannels(): boolean[] {
        let chans = [];
        for (let i = 0; i < this.activeDevice.instruments.logger.analog.numChans; i++) {
            chans.push(true);
        }
        return chans;
    }

    public resetService() {
        this.enabled = false;
        this.params = this.defaultParams;
    }

}

export interface CloudLoggingParams {
    apiKey: string,
    channelId: string,
    sampleFreq: number,
    analogChans: boolean[]
}