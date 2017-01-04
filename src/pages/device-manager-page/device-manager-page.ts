import { Component, Output, EventEmitter } from '@angular/core';
import { PopoverController, App, NavController, ModalController, Platform, AlertController, LoadingController } from 'ionic-angular';

//Pages
import { TestChartCtrlsPage } from '../../pages/test-chart-ctrls/test-chart-ctrls';
import { DeviceConfigureModal } from '../../pages/device-configure-modal/device-configure-modal';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Interfaces
import { DeviceCardInfo, DeviceConfigureParams } from './device-manager-page.interface';

//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ToastService } from '../../services/toast/toast.service';

@Component({
    templateUrl: 'device-manager-page.html'
})
export class DeviceManagerPage {
    @Output() navToInstrumentPage: EventEmitter<any> = new EventEmitter;
    public app: App;
    public loadingCtrl: LoadingController;
    public toastService: ToastService;
    public alertCtrl: AlertController;
    public popoverCtrl: PopoverController;
    public platform: Platform;
    public modalCtrl: ModalController;
    public navCtrl: NavController;
    public addDeviceIp: string;
    public deviceManagerService: DeviceManagerService;
    public settingsService: SettingsService;
    public storage: StorageService;
    public showDevMenu: boolean = false;
    public selectedSimulatedDevice: string = 'OpenScope-MZ';
    public deviceBridgeAddress = 'http://localhost:56089';

    public devices: DeviceCardInfo[] = [];

    public simulatedDevices: string[] = ['OpenScope-MZ'];
    public deviceConnectionType: string = 'network';
    public showDeviceTypeCard: boolean = true;

    constructor(_popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService,
        _storage: StorageService,
        _navCtrl: NavController,
        _modalCtrl: ModalController,
        _app: App,
        _platform: Platform,
        _settingsService: SettingsService,
        _alertCtrl: AlertController,
        _toastService: ToastService,
        _loadingCtrl: LoadingController
    ) {
        console.log('tab1 constructor');
        this.app = _app;
        this.loadingCtrl = _loadingCtrl;
        this.toastService = _toastService;
        this.alertCtrl = _alertCtrl;
        this.settingsService = _settingsService;
        this.platform = _platform;
        this.popoverCtrl = _popoverCtrl;
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
        this.storage.getData('routeToStore').then((data) => {
            if ((data == null || data === true) && (this.platform.is('android') || this.platform.is('ios'))) {
                this.routeToStore();
            }
        });
    }

    dropdownPopoverSelection(event) {
        console.log(event);
    }

    displayLoading() {
        let loading = this.loadingCtrl.create({
            content: 'Connecting To Device...',
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });

        loading.present();

        return loading;
    }

    routeToStore() {
        let alert = this.alertCtrl.create();
        alert.setTitle('We Have An App! Would You Like to Download It?');

        alert.addInput({
            type: 'checkbox',
            label: 'Do Not Show Again',
            value: 'value1'
        });

        alert.addButton('Cancel');
        alert.addButton({
            text: 'Okay',
            handler: data => {
                console.log('Checkbox data:', data);
                if (data.length > 0) {
                    this.settingsService.setRouteToStore(false);
                }
                else {
                    if (this.platform.is('android')) {
                        window.location.href = "market://details?id=com.digilent";
                    }
                    else if (this.platform.is('ios')) {
                        window.location.href = "https://itunes.apple.com/us/app/solitaire/id593715088";
                    }
                }
            }
        });
        alert.present();
    }

    ionViewDidEnter() {
        this.app.setTitle('Saved Devices');
    }

    ngOnDestroy() {
        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
    }

    openPopover(event, arrayIndex: number) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Connect', 'Remove', 'Configure']
        });
        genPopover.present({
            ev: event
        });
        genPopover.onWillDismiss((data) => {
            if (data === null) { return; }
            if (data.option === 'Remove') {
                this.devices.splice(arrayIndex, 1);
                this.storage.saveData('savedDevices', JSON.stringify(this.devices));
            }
            else if (data.option === 'Connect') {
                this.connectToDevice(arrayIndex);
            }
            else if (data.option === 'Configure') {
                this.openConfigureModal(arrayIndex);
            }
        });
    }

    openConfigureModal(deviceArrayIndex: number) {
        let deviceConfigureParams: DeviceConfigureParams = {
            potentialDevices: null,
            deviceBridgeAddress: null,
            bridge: false,
            deviceManagerPageRef: this,
            deviceObject: this.devices[deviceArrayIndex]
        };
        let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
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
        if (deviceBridgeAddress.indexOf('http://') === -1) {
            deviceBridgeAddress = 'http://' + deviceBridgeAddress;
            this.deviceBridgeAddress = deviceBridgeAddress;
        }
        if (this.checkIfMatchingBridge(deviceBridgeAddress)) {
            this.toastService.createToast('agentExists', true);
            return;
        }

        let loading = this.displayLoading();

        this.deviceManagerService.connectBridge(deviceBridgeAddress).subscribe(
            (success) => {
                loading.dismiss();
                console.log(success);
                if (success.agent == undefined || success.agent[0].statusCode > 0) {
                    let message = 'Error Parsing Agent Response To Devices Enumeration';
                    console.log(message);
                    this.toastService.createToast('agentInvalidResponse', true);
                    return;
                }
                if (success.agent[0].devices.length === 0) {
                    this.toastService.createToast('agentEnumerateError', true);
                    return;
                }
                let deviceConfigureParams: DeviceConfigureParams = {
                    potentialDevices: success.agent[0].devices,
                    deviceBridgeAddress: deviceBridgeAddress,
                    bridge: true,
                    deviceManagerPageRef: this,
                    deviceObject: null
                };
                let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
                modal.onWillDismiss((data) => {
                });
                modal.present();
            },
            (err) => {
                console.log(err);
                loading.dismiss();
                this.toastService.createToast('agentInvalidResponse', true);
            },
            () => {

            }
        );
    }

    bridgeDeviceSelect(data, deviceBridgeAddress: string): boolean {
        //TODO: Not sure why this is here at the moment
        //this.connectingToDevice = false;

        if (data == null) { return false; }
        if (data.deviceEnum.device == undefined) {
            this.toastService.createToast('agentEnumerateError', true);
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
        this.storage.saveData('savedDevices', JSON.stringify(this.devices));
        this.showDevMenu = false;
        this.toastService.createToast('deviceAdded');
        return true;
    }

    attemptConnect(ipAddress: string) {
        if (ipAddress.indexOf('http://') === -1) {
            ipAddress = 'http://' + ipAddress;
            this.addDeviceIp = ipAddress;
        }
        console.log(ipAddress);
        if (this.checkIfMatchingIp(ipAddress)) {
            this.toastService.createToast('deviceExists', true);
            return;
        }

        //this.connectingToDevice = true;
        let loading = this.displayLoading();
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                console.log(success);
                loading.dismiss();
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
                this.toastService.createToast('deviceAdded');
            },
            (err) => {
                loading.dismiss();
                console.log(err);
                this.toastService.createToast('timeout', true);
            },
            () => { }
        );
    }

    openSimDevice() {
        if (this.selectedSimulatedDevice === 'OpenScope-MZ') {
            if (this.checkIfMatchingLocal(this.selectedSimulatedDevice)) {
                this.toastService.createToast('deviceExists', true);
                return;
            }
            else {
                let loading = this.displayLoading();
                this.deviceManagerService.connectLocal(this.selectedSimulatedDevice).subscribe(
                    (success) => {
                        console.log(success);
                        loading.dismiss();
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
                        this.toastService.createToast('deviceAdded');
                    },
                    (err) => {
                        loading.dismiss();
                        this.toastService.createToast('timeout', true);
                    },
                    () => { }
                );
            }
        }
    }

    checkForEnter(event, deviceType: string) {
        if (event.key === 'Enter') {
            if (deviceType === 'agent') {
                this.attemptBridgeConnect(this.deviceBridgeAddress);
            }
            else if (deviceType === 'network') {
                this.attemptConnect(this.addDeviceIp);
            }
        }
    }

    setConnectionType(deviceConnectionType: string) {
        this.deviceConnectionType = deviceConnectionType;
        this.showDeviceTypeCard = false;
    }

    backToChooseDeviceType() {
        this.showDeviceTypeCard = true;
    }

    selectSimulatedDevice(event) {
        this.selectedSimulatedDevice = event;
    }

    connectToDevice(deviceIndex: number) {
        if (this.devices[deviceIndex].ipAddress === 'local') {
            this.deviceManagerService.addDeviceFromDescriptor('local', { device: [this.devices[deviceIndex].deviceDescriptor] });
            this.navCtrl.setRoot(TestChartCtrlsPage);
            return;
        }
        let loading = this.displayLoading();
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
                        data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                        statusCode = data.agent[0].statusCode;
                    }
                    catch (e) {
                        console.log('Error Parsing Set Active Device Response');
                        console.log(e);
                    }
                    console.log(data);
                    if (data.agent[0].statusCode === 0) { this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress, loading); }
                    else {
                        this.toastService.createToast('agentConnectError', true);
                        loading.dismiss();
                    }
                },
                (err) => {
                    console.log(err);
                    this.toastService.createToast('timeout', true);
                    loading.dismiss();
                },
                () => { }
            );
            return;
        }
        this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress, loading);
    }

    sendEnumerationCommandAndLoadInstrumentPanel(ipAddress: string, loadingInstance) {
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                loadingInstance.dismiss();
                this.deviceManagerService.addDeviceFromDescriptor(ipAddress, success);
                /*Navigate to the parents of the tab controller so they have the nav type.
                Without navigating to the parents, the navCtrl is a 'Tab' and thus the 
                new root page will have the tab bar.*/
                this.navCtrl.setRoot(TestChartCtrlsPage);
            },
            (err) => {
                console.log(err);
                this.toastService.createToast('timeout', true);
                loadingInstance.dismiss();
            },
            () => { }
        );
    }
}