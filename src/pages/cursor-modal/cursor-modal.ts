import { NavParams, ViewController, Platform, PopoverController } from 'ionic-angular';
import { Component, ViewChild } from '@angular/core';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

@Component({
    templateUrl: "cursor-modal.html"
})
export class ModalCursorPage {
    @ViewChild('typeDropPop') typeDropPop: DropdownPopoverComponent;
    @ViewChild('c1DropPop') c1DropPop: DropdownPopoverComponent;
    @ViewChild('c2DropPop') c2DropPop: DropdownPopoverComponent;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public cursorTypeArray: string[] = ['Disabled', 'Time', 'Track', 'Voltage'];
    public cursorChanArray: string[] = [];
    public popoverCtrl: PopoverController;
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceService;
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
                this.activeChans.push((i < this.activeDevice.instruments.osc.numChans ? 'Osc ' : 'LA ') + (i < this.activeDevice.instruments.osc.numChans ? i + 1 : i + 1 - this.activeDevice.instruments.osc.numChans));
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

    ngOnInit() {
        this.setCurrentValuesInDropdown();
    }

    setCurrentValuesInDropdown() {
        this.typeDropPop.setActiveSelection(this.chartComponent.cursorType);
        this.c1DropPop.setActiveSelection(this.chartComponent.cursor1Chan);
        this.c2DropPop.setActiveSelection(this.chartComponent.cursor2Chan);
    }

    cursorTypeSelect(event) {
        console.log(event);
        this.chartComponent.cursorType = event;
        this.chartComponent.handleCursors();
    }

    availableChannelSelect(event, channel: number) {
        if (channel === 1) {
            this.chartComponent.cursor1Chan = event;
        }
        else {
            this.chartComponent.cursor2Chan = event;
        }
        this.chartComponent.handleCursors();
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
            /*let activeChans = [];
            for (let i = 0; i < this.chartComponent.oscopeChansActive.length; i++) {
                if (this.chartComponent.currentBufferArray[i] !== undefined && this.chartComponent.currentBufferArray[i].y !== undefined) {
                    activeChans.push('Osc ' + (i + 1));
                }
            }*/
            popover = this.popoverCtrl.create(GenPopover, {
                dataArray: this.activeChans
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