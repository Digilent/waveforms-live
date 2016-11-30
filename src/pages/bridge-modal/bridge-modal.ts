import { NavParams, ViewController, Platform } from 'ionic-angular';
import { Component } from '@angular/core';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: "bridge-modal.html"
})

export class BridgeModalPage {
    public platform: Platform;
    public deviceManagerService: DeviceManagerService;
    public viewCtrl: ViewController;
    public params: NavParams;

    public potentialDevices: string[];
    public deviceBridgeAddress: string;

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.potentialDevices = this.params.get('potentialDevices');
        this.deviceBridgeAddress = this.params.get('deviceBridgeAddress');
    }

    selectDevice(selectedIndex: number) {
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": this.potentialDevices[selectedIndex]
                }
            ]
        };
        this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
            (data) => {
                console.log(this.deviceBridgeAddress);
                this.deviceManagerService.connect(this.deviceBridgeAddress).subscribe(
                    (data) => {
                        console.log(data);
                        
                        this.viewCtrl.dismiss({
                            selectedDevice: this.potentialDevices[selectedIndex],
                            deviceEnum: data
                        });
                    },
                    (err) => {
                        console.log(err);
                    },
                    () => { }
                );
            },
            (err) => {
                console.log(err);
            },
            () => {
                console.log('complete');
            }
        );
    }

}