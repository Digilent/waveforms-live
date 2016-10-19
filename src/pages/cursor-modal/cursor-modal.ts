import { NavParams, ViewController, Platform, PopoverController } from 'ionic-angular';
import { Component } from '@angular/core';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { DeviceComponent } from '../../components/device/device.component';
import { SilverNeedleChart } from '../../components/chart/chart.component';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: "cursor-modal.html"
})
export class ModalCursorPage {
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public cursorType: string;
    public cursor1Chan: string;
    public cursor2Chan: string;
    public cursorTypeArray: string[] = ['disabled', 'time', 'track', 'voltage'];
    public cursorChanArray: string[] = [];

    public value: number;
    public popoverCtrl: PopoverController;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public chartComponent: SilverNeedleChart;
    public activeChans: string[] = [];

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
            this.cursorChanArray.push('Osc ' + (i + 1));
        }
        this.cursorType = this.params.get('cursorType');
        this.cursor1Chan = this.params.get('cursor1Chan');
        this.cursor2Chan = this.params.get('cursor2Chan');
        this.chartComponent = this.params.get('chartComponent');
        for (let i = 0; i < this.chartComponent.currentBufferArray.length; i++) {
            if (this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined) {
                this.activeChans.push('Osc ' + (i + 1));
            }
        }
        if (this.activeChans.indexOf(this.cursor1Chan) === -1) {
            this.cursor1Chan = this.activeChans[0];
        }
        if (this.activeChans.indexOf(this.cursor2Chan) === -1) {
            this.cursor2Chan = this.activeChans[0];
        }
    }

    //Close modal and save settings if they are changed
    closeModal(save: boolean) {
        if (save) {
            this.viewCtrl.dismiss({
                save: save,
                cursorType: this.cursorType,
                cursor1Chan: this.cursor1Chan,
                cursor2Chan: this.cursor2Chan
            });
        }
        else {
            this.viewCtrl.dismiss({
                save: save
            });
        }
    }

    //Show cursor settings popover and return data as a navparam on dismiss
    showPopover(event, type: string) {
        let popover;
        if (type === 'cursorType') {
            popover = this.popoverCtrl.create(GenPopover, {
                dataArray: this.cursorTypeArray
            });
        }
        else if (type === 'cursor1Chan' || 'cursor2Chan') {
            let activeChans = [];
            for (let i = 0; i < this.chartComponent.currentBufferArray.length; i++) {
                if (this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined) {
                    activeChans.push('Osc ' + (i + 1));
                }
            }
            popover = this.popoverCtrl.create(GenPopover, {
                dataArray: activeChans
            });
        }
        else {
            console.log('error in show popover');
        }

        popover.present({
            ev: event
        });
        popover.onDidDismiss(data => {
            if (data === null) { return; }
            if (type === 'cursorType') {
                this.cursorType = data.option
            }
            else if (type === 'cursor1Chan') {
                this.cursor1Chan = data.option;
            }
            else if (type === 'cursor2Chan') {
                this.cursor2Chan = data.option;
            }
            else {
                console.log('error in show popover handler');
            }
        });
    }

}