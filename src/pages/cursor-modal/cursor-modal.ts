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
    public cursorTypeArray: string[] = ['Disabled', 'Time', 'Track', 'Voltage'];
    public cursorChanArray: string[] = [];
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
        this.chartComponent = this.params.get('chartComponent');
        for (let i = 0; i < this.chartComponent.currentBufferArray.length; i++) {
            if (this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined) {
                this.activeChans.push('Osc ' + (i + 1));
            }
        }
        if (this.activeChans.indexOf(this.chartComponent.cursor1Chan) === -1) {
            this.chartComponent.cursor1Chan = this.activeChans[0];
            this.chartComponent.handleCursors();
        }
        if (this.activeChans.indexOf(this.chartComponent.cursor2Chan) === -1) {
            this.chartComponent.cursor2Chan = this.activeChans[0];
            this.chartComponent.handleCursors();
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
            for (let i = 0; i < this.chartComponent.oscopeChansActive.length; i++) {
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
        popover.onWillDismiss((data) => {
            if (data === null) { return; }
            if (type === 'cursorType') {
                this.chartComponent.cursorType = data.option
            }
            else if (type === 'cursor1Chan') {
                this.chartComponent.cursor1Chan = data.option;
            }
            else if (type === 'cursor2Chan') {
                this.chartComponent.cursor2Chan = data.option;
            }
            else {
                console.log('error in show popover handler');
            }
            this.chartComponent.handleCursors();
        });
        
        popover.present({
            ev: event
        });


    }

}