import { Component, Output, EventEmitter } from '@angular/core';
import { PopoverController, App, ToastController, NavController, ModalController } from 'ionic-angular';

//Pages
import { TestChartCtrlsPage } from '../../../../pages/test-chart-ctrls/test-chart-ctrls';
import { DeviceConfigureModal } from '../../../../pages/device-configure-modal/device-configure-modal';
import { BridgeModalPage } from '../../../../pages/bridge-modal/bridge-modal';

//Components
import { GenPopover } from '../../../../components/gen-popover/gen-popover.component';

//Interfaces
import { DeviceCardInfo } from './device-manager-tab1.interface';

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
                this.openConfigureModal();
            }
        });
    }

    openConfigureModal() {
        let modal = this.modalCtrl.create(DeviceConfigureModal, {
            message: 'hey'
        });
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
            let toast = this.toastCtrl.create({
                message: 'Agent Is Added Already. Use Settings To Configure Active Device',
                showCloseButton: true,
                position: 'bottom'
            });
            toast.present();
            return;
        }

        this.connectingToDevice = true;
        this.deviceManagerService.connectBridge(deviceBridgeAddress).subscribe(
            (success) => {
                let start = performance.now();
                let finish;
                this.deviceManagerService.transport.writeRead('/config', JSON.stringify({
                    "agent": [
                        {
                            "command": "getInfo"
                        }
                    ]
                }), 'json').subscribe((data) => {
                    finish = performance.now();
                    console.log('get info latency');
                    console.log(finish - start);
                    console.log(data);
                });
                this.connectingToDevice = false;
                console.log(success);
                if (success.agent[0].devices.length === 0) {
                    let toast = this.toastCtrl.create({
                        message: 'No UART Devices Found',
                        showCloseButton: true,
                        duration: 3000,
                        position: 'bottom'
                    });
                    return; 
                }
                let modal = this.modalCtrl.create(BridgeModalPage, {
                    potentialDevices: success.agent[0].devices,
                    deviceBridgeAddress: deviceBridgeAddress
                });
                modal.onDidDismiss((data) => {
                    console.log(data);
                    this.connectingToDevice = false;
                    if (data == null) { return; }
                    this.devices.unshift(
                        {
                            deviceDescriptor: data.deviceEnum.device[0],
                            ipAddress: deviceBridgeAddress + ' - ' + data.selectedDevice,
                            hostname: 'Hostname',
                            bridge: true,
                            deviceBridgeAddress: deviceBridgeAddress
                        }
                    );
                    console.log(this.devices);
                    this.storage.saveData('savedDevices', JSON.stringify(this.devices));
                    this.showDevMenu = false;
                    let toast = this.toastCtrl.create({
                        message: 'Device Added Successfully',
                        duration: 5000,
                        position: 'bottom'
                    });
                    toast.present();
                });
                modal.present();
            },
            (err) => {
                console.log(err);
                this.connectingToDevice = false;
                let toast = this.toastCtrl.create({
                    message: 'Error: Invalid Response From Bridge',
                    showCloseButton: true,
                    duration: 5000,
                    position: 'bottom'
                });
                toast.present();
            },
            () => {

            }
        );
    }

    attemptConnect(ipAddress: string) {
        if (this.checkIfMatchingIp(ipAddress)) {
            let toast = this.toastCtrl.create({
                message: 'Device is Added Already',
                showCloseButton: true,
                position: 'bottom'
            });
            toast.present();
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
                        deviceBridgeAddress: null
                    }
                );
                this.storage.saveData('savedDevices', JSON.stringify(this.devices));
                this.showDevMenu = false;
                let toast = this.toastCtrl.create({
                    message: 'Device Added Successfully',
                    duration: 5000,
                    position: 'bottom'
                });
                toast.present();
            },
            (err) => {
                this.connectingToDevice = false;
                console.log(err);
                let toast = this.toastCtrl.create({
                    message: 'Error: No Response Received',
                    showCloseButton: true,
                    position: 'bottom'
                });
                toast.present();
            },
            () => { }
        );
    }

    openSimDevice() {
        if (this.selectedSimulatedDevice === 'OpenScope-MZ') {
            if (this.checkIfMatchingLocal(this.selectedSimulatedDevice)) {
                let toast = this.toastCtrl.create({
                    message: 'Device is Added Already',
                    showCloseButton: true,
                    position: 'bottom'
                });
                toast.present();
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
                                deviceBridgeAddress: null
                            }
                        );
                        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
                        this.showDevMenu = false;
                        let toast = this.toastCtrl.create({
                            message: 'Device Added Successfully',
                            duration: 5000,
                            position: 'bottom'
                        });
                        toast.present();
                    },
                    (err) => {
                        this.connectingToDevice = false;
                        let toast = this.toastCtrl.create({
                            message: 'Error: No Response Received',
                            showCloseButton: true,
                            position: 'bottom'
                        });
                        toast.present();
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
        let ipAddress = this.devices[deviceIndex].ipAddress;
        if (this.devices[deviceIndex].bridge) {
            ipAddress = this.devices[deviceIndex].deviceBridgeAddress;
        }
        console.log(this.devices[deviceIndex]);
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                this.deviceManagerService.addDeviceFromDescriptor(ipAddress, success);
                /*Navigate to the parents of the tab controller so they have the nav type.
                Without navigating to the parents, the navCtrl is a 'Tab' and thus the 
                new root page will have the tab bar.*/
                this.navCtrl.parent.parent.setRoot(TestChartCtrlsPage);
            },
            (err) => {
                console.log(err);
                let toast = this.toastCtrl.create({
                    message: 'Error: No Response Received',
                    showCloseButton: true,
                    position: 'bottom'
                });
                toast.present();
            },
            () => { }
        );
    }
}