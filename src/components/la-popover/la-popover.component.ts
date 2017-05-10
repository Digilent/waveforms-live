import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

@Component({
    templateUrl: 'la-popover.html'
})

export class LaPopover {
    public pinoutAddress: string;
    public activeDevice: DeviceService;
    public laChans: number[] = [];
    public bitmask: string = '';
    public edgeDirections: edgeDirection[] = [];

    constructor(
        public viewCtrl: ViewController, 
        public params: NavParams,
        public deviceManagerService: DeviceManagerService
    ) {
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        for (let i = 0; i < this.activeDevice.instruments.la.chans[0].numDataBits; i++) {
            this.laChans.push(i + 1);
            this.bitmask += 'x';
            this.edgeDirections.push('off');
        }
        this.bitmask = this.params.get('bitmask');
        this.loadBitmask(this.bitmask);
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            bitmask: this.bitmask
        });
    }

    setTrigType(edgeDirection: edgeDirection, channel: number) {
        if (this.edgeDirections[channel] === 'rising' || this.edgeDirections[channel] === 'falling' || this.edgeDirections[channel] === 'either') {
            if (edgeDirection === 'off') {
                this.edgeDirections[channel] = 'off';
            }
            else if (edgeDirection === this.edgeDirections[channel]) {
                //Toggle off
                this.edgeDirections[channel] = 'off';
            }
            else if (this.edgeDirections[channel] === 'either') {
                this.edgeDirections[channel] = edgeDirection === 'rising' ? 'falling' : 'rising';
            }
            else {
                //The other is already on (rising or falling)
                this.edgeDirections[channel] = 'either';
            }
        }
        else {
            this.edgeDirections[channel] = edgeDirection;
        }
        this.updateBitmask(this.edgeDirections[channel], channel);
    }

    setAll(edgeDirection: edgeDirection) {
        this.bitmask = '';
        for (let i = 0; i < this.edgeDirections.length; i++) {
            this.edgeDirections[i] = edgeDirection;
            switch (edgeDirection) {
                case 'rising':
                    this.bitmask += 'r';
                    break;
                case 'falling':
                    this.bitmask += 'f';
                    break;
                case 'off':
                    this.bitmask += 'x';
                    break;
                case 'either':
                    this.bitmask += 'e';
                    break;
                default:
                    this.bitmask += 'x';
            }
        }
    }

    private loadBitmask(bitmask: string) {
        this.bitmask = bitmask;
        for (let i = 0; i < bitmask.length; i++) {
            switch (bitmask.charAt(bitmask.length - i - 1)) {
                case 'e':
                    this.edgeDirections[i] = 'either';
                    break;
                case 'r':
                    this.edgeDirections[i] = 'rising';
                    break;
                case 'f':
                    this.edgeDirections[i] = 'falling';
                    break;
                default:
                    this.edgeDirections[i] = 'off';
            }
        }
    }

    private updateBitmask(edgeDirection: edgeDirection, channel: number) {
        let stateChar: string;
        switch (edgeDirection) {
            case 'rising':
                stateChar = 'r';
                break;
            case 'falling':
                stateChar = 'f';
                break;
            case 'off':
                stateChar = 'x';
                break;
            case 'either':
                stateChar = 'e';
                break;
            default:
                stateChar = 'x';
                break;
        }
        let index = this.bitmask.length - channel - 1;
        this.bitmask = this.bitmask.slice(0, index) + stateChar + this.bitmask.slice(index + 1);
    }
}

export type edgeDirection = 'rising' | 'falling' | 'off' | 'either';