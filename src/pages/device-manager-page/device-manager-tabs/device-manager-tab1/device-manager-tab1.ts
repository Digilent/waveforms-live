import { Component, Output, EventEmitter } from '@angular/core';
import { PopoverController, App, ToastController, NavController, ModalController } from 'ionic-angular';

//Pages
import { TestChartCtrlsPage } from '../../../../pages/test-chart-ctrls/test-chart-ctrls';
import { DeviceConfigureModal } from '../../../../pages/device-configure-modal/device-configure-modal';

//Components
import { GenPopover } from '../../../../components/gen-popover/gen-popover.component';

//Interfaces
import { DeviceCardInfo, DeviceConfigureParams } from './device-manager-tab1.interface';

//Services
import { DeviceManagerService } from '../../../../services/device/device-manager.service';
import { StorageService } from '../../../../services/storage/storage.service';

@Component({
    templateUrl: 'device-manager-tab1.html'
})
export class Tab1 {
    @Output() navToInstrumentPage: EventEmitter<any> = new EventEmitter;
    public app: App;
    public popoverCtrl: PopoverController;
    public toastCtrl: ToastController;
    public modalCtrl: ModalController;
    public navCtrl: NavController;
    public addDeviceIp: string;
    public deviceManagerService: DeviceManagerService;
    public storage: StorageService;
    public showDevMenu: boolean = false;
    public connectingToDevice: boolean = false;
    public selectedSimulatedDevice: string = 'Select a Device';
    public deviceBridgeAddress = 'http://localhost:56089';

    public devices: DeviceCardInfo[] = [];

    constructor(_popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService,
        _toastCtrl: ToastController,
        _storage: StorageService,
        _navCtrl: NavController,
        _modalCtrl: ModalController,
        _app: App) {
        console.log('tab1 constructor');
        this.app = _app;
        this.popoverCtrl = _popoverCtrl;
        this.toastCtrl = _toastCtrl;
        this.navCtrl = _navCtrl;
        this.modalCtrl = _modalCtrl;
        this.addDeviceIp = "http://"
        this.deviceManagerService = _deviceManagerService;
        this.storage = _storage;
        this.storage.getData('savedDevices').then((data) => {
            if (data !== null) {
                this.devices = JSON.parse(data);
            }
        });
    }

    ionViewDidEnter() {
        this.app.setTitle('Saved Devices');
    }

    ngOnDestroy() {
        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
    }

    openPopover(event, arrayIndex: number) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['connect', 'remove', 'configure']
        });
        genPopover.present({
            ev: event
        });
        genPopover.onDidDismiss((data) => {
            if (data === null) { return; }
            if (data.option === 'remove') {
                this.devices.splice(arrayIndex, 1);
                this.storage.saveData('savedDevices', JSON.stringify(this.devices));
            }
            else if (data.option === 'connect') {
                this.connectToDevice(arrayIndex);
            }
            else if (data.option === 'configure') {
                this.openConfigureModal(arrayIndex);
            }
        });
    }

    openConfigureModal(deviceArrayIndex: number) {
        let deviceConfigureParams: DeviceConfigureParams = {
            potentialDevices: null,
            deviceBridgeAddress: null,
            bridge: false,
            tab1Ref: this,
            deviceObject: this.devices[deviceArrayIndex]
        };
        let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
        modal.onDidDismiss((data) => {
            console.log(data);
        });
        modal.present();
    }

    toggleAddDevMenu() {
        this.showDevMenu = !this.showDevMenu;
    }

    checkIfMatchingIp(ipAddress: string) {
        for (let i = 0; i < this.devices.length; i++) {
            if (this.devices[i].ipAddress === ipAddress) {
                return true;
            }
        }
        return false;
    }

    checkIfMatchingBridge(bridgeAddress: string) {
        for (let i = 0; i < this.devices.length; i++) {
            if (this.devices[i].deviceBridgeAddress === bridgeAddress && this.devices[i].bridge) {
                return true;
            }
        }
        return false;
    }

    checkIfMatchingLocal(device: string) {
        for (let i = 0; i < this.devices.length; i++) {
            if (this.devices[i].deviceDescriptor.deviceModel === device && this.devices[i].ipAddress === 'local') {
                return true;
            }
        }
        return false;
    }

    attemptBridgeConnect(deviceBridgeAddress: string) {
        //Note: no need to check if device exists since it depends on selection of device from config utility
        if (this.checkIfMatchingBridge(deviceBridgeAddress)) {
            this.createToast('Agent Is Added Already. Use Settings To Configure Active Device', true);
            return;
        }

        this.connectingToDevice = true;
        this.deviceManagerService.connectBridge(deviceBridgeAddress).subscribe(
            (success) => {
                this.connectingToDevice = false;
                console.log(success);
                if (success.agent == undefined || success.agent[0].statusCode > 0) {
                    let message = 'Error Parsing Agent Response To Devices Enumeration';
                    console.log(message);
                    this.createToast('Error Parsing Agent Response To Devices Enumeration', true);
                    return;
                }
                if (success.agent[0].devices.length === 0) {
                    this.createToast('Error: No UART Devices Found', true);
                    return;
                }
                let deviceConfigureParams: DeviceConfigureParams = {
                    potentialDevices: success.agent[0].devices,
                    deviceBridgeAddress: deviceBridgeAddress,
                    bridge: true,
                    tab1Ref: this,
                    deviceObject: null
                };
                let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
                modal.onDidDismiss((data) => {
                });
                modal.present();
            },
            (err) => {
                console.log(err);
                this.connectingToDevice = false;
                this.createToast('Error: Invalid Response From Agent', true);
            },
            () => {

            }
        );
    }

    bridgeDeviceSelect(data, deviceBridgeAddress: string): boolean {
        console.log(data);
        this.connectingToDevice = false;
        if (data == null) { return false; }
        if (data.deviceEnum.device == undefined) {
            this.createToast('Error Parsing Enumeration Command', true);
            return false;
        }
        this.devices.unshift(
            {
                deviceDescriptor: data.deviceEnum.device[0],
                ipAddress: deviceBridgeAddress + ' - ' + data.selectedDevice,
                hostname: 'Hostname',
                bridge: true,
                deviceBridgeAddress: deviceBridgeAddress,
                connectedDeviceAddress: data.selectedDevice
            }
        );
        console.log(this.devices);
        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
        this.showDevMenu = false;
        this.createToast('Device Added Successfully');
        return true;
    }

    attemptConnect(ipAddress: string) {
        if (this.checkIfMatchingIp(ipAddress)) {
            this.createToast('Device is Added Already', true);
            return;
        }

        this.connectingToDevice = true;
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                console.log(success);
                this.connectingToDevice = false;
                this.devices.unshift(
                    {
                        deviceDescriptor: success.device[0],
                        ipAddress: ipAddress,
                        hostname: 'Hostname',
                        bridge: false,
                        deviceBridgeAddress: null,
                        connectedDeviceAddress: null
                    }
                );
                this.storage.saveData('savedDevices', JSON.stringify(this.devices));
                this.showDevMenu = false;
                this.createToast('Device Added Successfully');
            },
            (err) => {
                this.connectingToDevice = false;
                console.log(err);
                this.createToast('Error: No Response Received', true);
            },
            () => { }
        );
    }

    openSimDevice() {
        if (this.selectedSimulatedDevice === 'OpenScope-MZ') {
            if (this.checkIfMatchingLocal(this.selectedSimulatedDevice)) {
                this.createToast('Device is Added Already', true);
                return;
            }
            else {
                this.connectingToDevice = true;
                this.deviceManagerService.connectLocal(this.selectedSimulatedDevice).subscribe(
                    (success) => {
                        console.log('WHUWHU');
                        console.log(success);
                        this.connectingToDevice = false;
                        this.devices.unshift(
                            {
                                deviceDescriptor: success.device[0],
                                ipAddress: 'local',
                                hostname: 'Simulated ' + this.selectedSimulatedDevice,
                                bridge: false,
                                deviceBridgeAddress: null,
                                connectedDeviceAddress: null
                            }
                        );
                        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
                        this.showDevMenu = false;
                        this.createToast('Device Added Successfully');
                    },
                    (err) => {
                        this.connectingToDevice = false;
                        this.createToast('Error: No Response Received', true);
                    },
                    () => { }
                );
            }
        }
    }

    openSimDevicePopover(event) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['OpenScope-MZ']
        });
        genPopover.present({
            ev: event
        });
        genPopover.onDidDismiss(data => {
            if (data === null) { return; }
            this.selectedSimulatedDevice = data.option;
        });
    }

    connectToDevice(deviceIndex: number) {
        if (this.devices[deviceIndex].ipAddress === 'local') {
            this.deviceManagerService.addDeviceFromDescriptor('local', { device: [this.devices[deviceIndex].deviceDescriptor] });
            this.navCtrl.parent.parent.setRoot(TestChartCtrlsPage);
            return;
        }
        this.connectingToDevice = true;
        let ipAddress = this.devices[deviceIndex].ipAddress;
        if (this.devices[deviceIndex].bridge) {
            ipAddress = this.devices[deviceIndex].deviceBridgeAddress;
            this.deviceManagerService.transport.setUri(ipAddress);
            let command = {
                "agent": [
                    {
                        "command": "setActiveDevice",
                        "device": this.devices[deviceIndex].connectedDeviceAddress
                    }
                ]
            };
            console.log(command);
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    let statusCode;
                    try {
                        let duhString = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(duhString);
                        data = JSON.parse(duhString);
                        statusCode = data.agent[0].statusCode;
                    }
                    catch (e) {
                        console.log('Error Parsing Set Active Device Response');
                        console.log(e);
                    }
                    console.log(data);
                    if (data.agent[0].statusCode === 0) { this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress); }
                    else {
                        this.createToast('Agent Could Not Connect To Device', true);
                        this.connectingToDevice = false;
                    }
                },
                (err) => {
                    console.log(err);
                    this.createToast('No Response From Agent', true);
                    this.connectingToDevice = false;
                },
                () => { }
            );
            return;
        }
        console.log(this.devices[deviceIndex]);
        this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress);
    }

    sendEnumerationCommandAndLoadInstrumentPanel(ipAddress: string) {
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                this.connectingToDevice = false;
                this.deviceManagerService.addDeviceFromDescriptor(ipAddress, success);
                /*Navigate to the parents of the tab controller so they have the nav type.
                Without navigating to the parents, the navCtrl is a 'Tab' and thus the 
                new root page will have the tab bar.*/
                this.navCtrl.parent.parent.setRoot(TestChartCtrlsPage);
            },
            (err) => {
                console.log(err);
                this.createToast('Error: No Response Received', true);
                this.connectingToDevice = false;
            },
            () => { }
        );
    }

    createToast(message?: string, showCloseButton?: boolean, duration?: number, position?: string) {
        //Check optional parameters and load defaults if required
        message = message == undefined ? 'Error Occurred' : message;
        showCloseButton = showCloseButton == undefined ? false : showCloseButton;
        duration = duration == undefined ? 3000 : duration;
        position = position == undefined ? 'bottom' : position;

        let toast = this.toastCtrl.create({
            message: message,
            showCloseButton: showCloseButton,
            duration: duration,
            position: position
        });
        toast.present();
    }
}