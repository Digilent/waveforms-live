import { Component, trigger, state, animate, transition, style } from '@angular/core';
import { PopoverController, App, NavController, ModalController, Platform, AlertController, LoadingController } from 'ionic-angular';

//Pages
import { InstrumentPanelPage } from '../../pages/instrument-panel/instrument-panel';
import { DeviceConfigurePage } from '../../pages/device-configure/device-configure';
import { LoadFirmwarePage } from '../../pages/load-firmware/load-firmware';
import { UpdateFirmwarePage } from '../../pages/update-firmware/update-firmware';
import { CalibratePage } from '../../pages/calibrate/calibrate';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Interfaces
import { DeviceCardInfo, DeviceConfigureParams } from './device-manager-page.interface';

//Services
import { DeviceManagerService } from 'dip-angular2/services';
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

interface tooltipInterface {
    addADevice: string,
    networkButton: string,
    simulatedButton: string,
    agentButton: string,
    backToAddDevice: string,
    addCurrentDevice: string,
    deviceCardMore: string,
    deviceCard: string
}

@Component({
    templateUrl: 'device-manager-page.html',
    animations: [
        trigger('rotate', [
            state('true', style({ transform: 'rotate(-180deg)' })),
            state('false', style({ transform: 'rotate(0deg)' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ])
    ]
})
export class DeviceManagerPage {
    public app: App;
    public loadingCtrl: LoadingController;
    public toastService: ToastService;
    public tooltipService: TooltipService;
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
    public selectedSimulatedDevice: string = 'OpenScope MZ';
    public deviceBridgeAddress = 'http://localhost:42135';
    public minFirmwareVersion: string = '1.4.0';

    public devices: DeviceCardInfo[] = [];

    public simulatedDevices: string[] = ['OpenScope MZ'];
    public deviceConnectionType: string = 'network';
    public showDeviceTypeCard: boolean = true;

    public tutorialMode: boolean = false;
    public tutorialStage: number = 0;

    public tooltipMessages: tooltipInterface;
    public listUrl: string = 'https://s3-us-west-2.amazonaws.com/digilent?prefix=Software/OpenScope+MZ/release/firmware/without-bootloader';

    constructor(_popoverCtrl: PopoverController,
        _deviceManagerService: DeviceManagerService,
        _storage: StorageService,
        _navCtrl: NavController,
        _tooltipSrv: TooltipService,
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
        this.tooltipService = _tooltipSrv;
        this.alertCtrl = _alertCtrl;
        this.settingsService = _settingsService;
        this.platform = _platform;
        this.popoverCtrl = _popoverCtrl;
        this.navCtrl = _navCtrl;
        this.modalCtrl = _modalCtrl;
        this.loadDefaultTooltipMessages();
        this.addDeviceIp = "http://"
        this.deviceManagerService = _deviceManagerService;
        this.storage = _storage;
        this.storage.getData('routeToStore').then((data) => {
            if ((data == null || data === true) && this.platform.is('mobileweb') && (this.platform.is('android') || this.platform.is('ios'))) {
                this.routeToStore();
            }
        });
        this.storage.getData('useDevBuilds').then((data) => {
            if (data == undefined) { return; }
            console.log(data);
            if (JSON.parse(data)) {
                this.listUrl = 'https://s3-us-west-2.amazonaws.com/digilent?prefix=Software/OpenScope+MZ/development/firmware/without-bootloader';
            }
        });
        this.storage.getData('savedDevices').then((data) => {
            if (data !== null) {
                this.devices = JSON.parse(data);
                this.getFirmwareVersionsForDevices();
            }
        });
    }

    getFirmwareVersionsForDevices() {
        for (let i = 0; i < this.devices.length; i++) {
            if (this.devices[i].ipAddress !== 'local') {
                //TODO: read device enum for ip address and then call device man service getFirmwareVersionsFromUrl
                this.deviceManagerService.getLatestFirmwareVersionFromUrl(this.listUrl).then((latestFirmwareVersion) => {
                    this.determineIfOutdatedFirmware(latestFirmwareVersion, i);
                }).catch((e) => {
                    console.log(e);
                });
            }
        }
    }

    determineIfOutdatedFirmware(latestFirmwareVersion: string, deviceIndex: number) {
        let firmwareVersionObject = this.devices[deviceIndex].deviceDescriptor.firmwareVersion;
        let deviceFirmwareVersion = [firmwareVersionObject.major, firmwareVersionObject.minor, firmwareVersionObject.patch].join('.');
        this.devices[deviceIndex].outdatedFirmware = latestFirmwareVersion !== deviceFirmwareVersion;
    }

    loadTutorialTooltipMessages() {
        this.tooltipMessages = {
            addADevice: this.tooltipService.getTooltip('tutorialAddADevice').message,
            networkButton: this.tooltipService.getTooltip('tutorialNetworkButton').message,
            simulatedButton: this.tooltipService.getTooltip('tutorialSimulatedButton').message,
            agentButton: this.tooltipService.getTooltip('tutorialAgentButton').message,
            backToAddDevice: this.tooltipService.getTooltip('tutorialBackToAddDevice').message,
            addCurrentDevice: this.tooltipService.getTooltip('tutorialAddCurrentDevice').message,
            deviceCardMore: this.tooltipService.getTooltip('tutorialDeviceCardMore').message,
            deviceCard: this.tooltipService.getTooltip('tutorialDeviceCard').message
        };
    }

    loadDefaultTooltipMessages() {
        this.tooltipMessages = {
            addADevice: this.tooltipService.getTooltip('addADevice').message,
            networkButton: this.tooltipService.getTooltip('networkButton').message,
            simulatedButton: this.tooltipService.getTooltip('simulatedButton').message,
            agentButton: this.tooltipService.getTooltip('agentButton').message,
            backToAddDevice: this.tooltipService.getTooltip('backToAddDevice').message,
            addCurrentDevice: this.tooltipService.getTooltip('addCurrentDevice').message,
            deviceCardMore: this.tooltipService.getTooltip('deviceCardMore').message,
            deviceCard: this.tooltipService.getTooltip('deviceCard').message
        };
    }

    dropdownPopoverSelection(event) {
        console.log(event);
    }

    displayLoading(message?: string) {
        message = message == undefined ? 'Connecting To Device...' : message;
        let loading = this.loadingCtrl.create({
            content: 'Connecting To Device...',
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });

        loading.present();

        return loading;
    }

    executeHelp() {
        this.tutorialStage = 0;
        this.tutorialMode = !this.tutorialMode;
        this.showDevMenu = false;
        this.showDeviceTypeCard = true;
        if (this.tutorialMode) {
            this.loadTutorialTooltipMessages();
        }
        else {
            this.loadDefaultTooltipMessages();
        }
    }

    routeToStore() {
        let alert = this.alertCtrl.create();
        alert.setTitle('We Have An App! Would You Like to Download It?');

        alert.addButton('No');
        alert.addButton({
            text: 'Yes',
            handler: data => {
                if (this.platform.is('android')) {
                    window.location.href = this.settingsService.androidAppLink;
                }
                else if (this.platform.is('ios')) {
                    window.location.href = this.settingsService.iosAppLink;
                }
            }
        });
        alert.present();
        this.settingsService.setRouteToStore(false);
    }

    ionViewDidEnter() {
        this.app.setTitle('Device Manager');
    }

    ngOnDestroy() {
        this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
            console.warn(e);
        });
    }

    openPopover(event, arrayIndex: number) {
        let genPopover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Instrument Panel', 'Configure', 'Documentation', 'Remove']
        });
        genPopover.present({
            ev: event
        });
        genPopover.onWillDismiss((data) => {
            if (data === null) { return; }
            if (data.option === 'Remove') {
                console.log(this.devices);
                console.log(arrayIndex);
                
                this.agentReleaseActiveDevice(this.devices[arrayIndex]);
                this.devices.splice(arrayIndex, 1);
                this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
                    console.warn(e);
                });
            }
            else if (data.option === 'Instrument Panel') {
                this.connectToDevice(arrayIndex);
            }
            else if (data.option === 'Configure') {
                this.openConfigureModal(arrayIndex);
            }
            else if (data.option === 'Documentation') {
                this.openDeviceReference(arrayIndex);
            }
        });
    }

    agentReleaseActiveDevice(device: DeviceCardInfo): Promise<any> {
        if (!device.bridge) { return Promise.resolve(); }

        let command = {
            "agent": [
                {
                    "command": "releaseActiveDevice"
                }
            ]
        };

        this.deviceManagerService.transport.setHttpTransport(device.deviceBridgeAddress);

        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    resolve();
                },
                (err) => {
                    resolve();
                },
                () => { }
            );
        });
    }

    openDeviceReference(deviceArrayIndex: number) {
        let deviceModel = this.devices[deviceArrayIndex].deviceDescriptor.deviceModel;
        switch (deviceModel) {
            case 'OpenScope MZ':
                let openTab = window.open('https://reference.digilentinc.com/reference/instrumentation/openscope-mz/start', '_blank');
                openTab.location;
                return;
            default:
                this.toastService.createToast('deviceUnknown', true);
                return;
        }
    }

    openConfigureModal(deviceArrayIndex: number) {
        let deviceConfigureParams: DeviceConfigureParams = {
            potentialDevices: null,
            deviceBridgeAddress: this.devices[deviceArrayIndex].deviceBridgeAddress,
            bridge: this.devices[deviceArrayIndex].bridge,
            deviceManagerPageRef: this,
            deviceObject: this.devices[deviceArrayIndex],
            deviceArrayIndex: deviceArrayIndex
        };
        /*let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
        modal.present();*/
        console.log('opening configure modal');
        this.navCtrl.push(DeviceConfigurePage, deviceConfigureParams);
    }

    toggleAddDevMenu() {
        this.showDevMenu = !this.showDevMenu;
        this.tutorialStage = 1;
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

    checkIfMatchingLocal(device: string, deleteIfFound?: boolean) {
        deleteIfFound = deleteIfFound || false;
        for (let i = 0; i < this.devices.length; i++) {
            if (this.devices[i].deviceDescriptor.deviceModel === device && this.devices[i].ipAddress === 'local') {
                if (deleteIfFound) {
                    this.devices.splice(i, 1);
                }
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
                /*let modal = this.modalCtrl.create(DeviceConfigureModal, deviceConfigureParams);
                modal.onWillDismiss((data) => {
                });
                modal.present();*/
                this.navCtrl.push(DeviceConfigurePage, deviceConfigureParams);
            },
            (err) => {
                console.log(err);
                loading.dismiss();
                this.toastService.createToast('agentNoResponse', true);
            },
            () => {

            }
        );
    }

    bridgeDeviceSelect(data, deviceBridgeAddress: string): boolean {

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
                connectedDeviceAddress: data.selectedDevice,
                outdatedFirmware: false // TODO
            }
        );
        this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
            console.warn(e);
        });
        this.showDevMenu = false;
        this.toastService.createToast('deviceAdded');
        this.tutorialStage = 3;
        return true;
    }

    agentSetActiveDeviceAndEnterJson(device: DeviceCardInfo): Promise<any> {
        //Used to have agent set the device in JSON mode for serial communication.
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": device.connectedDeviceAddress
                }
            ]
        };

        this.deviceManagerService.transport.setHttpTransport(device.deviceBridgeAddress);

        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    console.log('active device set');
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        console.log('Error Parsing Set Active Device Response');
                        console.log(e);
                        reject();
                        return;
                    }
                    if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                        reject();
                        return;
                    }
                    console.log(data);
                    this.enterJsonMode().then(() => {
                        resolve();
                    }).catch((e) => {
                        resolve({ error: 'jsonMode' });
                    });
                },
                (err) => {
                    this.toastService.createToast('timeout', true);
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
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
                        connectedDeviceAddress: null,
                        outdatedFirmware: false //TODO
                    }
                );
                this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
                    console.warn(e);
                });
                this.showDevMenu = false;
                this.toastService.createToast('deviceAdded');
                this.tutorialStage = 3;
                this.deviceManagerService.addDeviceFromDescriptor(ipAddress, success);
                this.getFirmwareVersionsForDevices();
                this.verifyFirmware(0)
                    .then((data) => {
                        this.verifyCalibrationSource(0, this.devices[0].deviceDescriptor.calibrationSource);
                    })
                    .catch((e) => {
                        this.verifyCalibrationSource(0, this.devices[0].deviceDescriptor.calibrationSource);
                    });
            },
            (err) => {
                loading.dismiss();
                console.log(err);
                this.toastService.createToast('timeout', true);
            },
            () => { }
        );
    }

    verifyCalibrationSource(deviceIndex: number, calibrationSource: string): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log(deviceIndex, this.devices[deviceIndex]);
            /*this.verifyFirmware(deviceIndex)
                .then((data) => {*/
            //Firmware updated
            if (this.devices[deviceIndex].deviceDescriptor.calibrationSource == undefined || this.devices[deviceIndex].deviceDescriptor.calibrationSource == 'UNCALIBRATED') {
                let title = 'Uncalibrated Device';
                let subtitle = 'Your device is uncalibrated. You will now be taken to the calibration wizard.';
                this.alertWrapper(title, subtitle)
                    .then((data) => {
                        return this.toCalibrationPage();
                    })
                    .then((data) => {
                        resolve();
                    })
                    .catch((e) => {
                        reject(e);
                    });
            }
            else {
                resolve();
            }
            /*})*/
            /*.catch((e) => {
                //can't update firmware
                if (this.devices[deviceIndex].deviceDescriptor.calibrationSource == undefined || this.devices[deviceIndex].deviceDescriptor.calibrationSource == 'UNCALIBRATED') {
                    let title = 'Uncalibrated Device';
                    let subtitle = 'Your device is uncalibrated. You will now be taken to the calibration wizard.';
                    this.alertWrapper(title, subtitle)
                        .then((data) => {
                            return this.toCalibrationPage();
                        })
                        .then((data) => {
                            resolve();
                        })
                        .catch((e) => {
                            reject(e);
                        });
                }

            });*/
        });
    }

    openGettingStartedPopover(event) {
        /*let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['OpenScope MZ']
        });
        popover.onWillDismiss((data) => {
            if (data == undefined) { return; }
            switch (data.option) {
                case 'OpenScope MZ':
                    let openTab = window.open('https://reference.digilentinc.com/reference/instrumentation/openscope-mz/getting-started', '_blank');
                    openTab.location;
                    break;
                default:
                    break;
            }
        });
        popover.present({
            ev: event
        });*/
        let openTab = window.open('https://reference.digilentinc.com/reference/instrumentation/openscope-mz/start', '_blank');
        openTab.location;
    }

    verifyFirmware(deviceIndex): Promise<any> {
        return new Promise((resolve, reject) => {
            let firmwareObject = this.devices[deviceIndex].deviceDescriptor.firmwareVersion;
            let weightedFirmware = firmwareObject.patch + 1000 * firmwareObject.minor + 1000000 * firmwareObject.major;
            let minFirmwareArray = this.minFirmwareVersion.split('.');
            let weightedMinFirmware = parseInt(minFirmwareArray[2]) + 1000 * parseInt(minFirmwareArray[1]) + 1000000 * parseInt(minFirmwareArray[0]);
            let oldFirmware = weightedFirmware < weightedMinFirmware;
            console.log('OLD FIRMWARE?');
            console.log(oldFirmware);
            if (this.devices[deviceIndex].bridge && oldFirmware) {
                //Agent
                let title = 'Firmware Update Required';
                let subtitle = 'You will now be taken to the update firmware wizard.';
                this.alertWrapper(title, subtitle)
                    .then((data) => {
                        this.openUpdateFirmware(deviceIndex)
                            .then((data) => {
                                console.log(data);
                                resolve(data);
                            })
                            .catch((e) => {
                                console.log(e);
                                reject(e);
                            });
                    })
                    .catch((e) => {
                        reject(e);
                    });
            }
            else if (!this.devices[deviceIndex].bridge && oldFirmware) {
                //WIFI
                let title = 'Firmware Update Required';
                let subtitle = 'Your firmware is outdated. Please connect to your device over USB using the Digilent Agent and use the device configure page to update the firmware.';
                this.alertWrapper(title, subtitle, [{
                    text: 'To Agent',
                    handler: (data) => {
                        let openTab = window.open('https://reference.digilentinc.com/learn/instrumentation/tutorials/openscope-mz/update-firmware', '_blank');
                        openTab.location;
                    }
                }, {
                    text: 'OK',
                    handler: (data) => { }
                }])
                    .then((data) => {
                        resolve();
                    })
                    .catch((e) => {
                        reject(e);
                    });
            }
            else {
                resolve('firmware up to date');
            }
        });
    }

    toCalibrationPage(): Promise<any> {
        return new Promise((resolve, reject) => {
            //Calibrate
            let modal = this.modalCtrl.create(CalibratePage, undefined, {
                enableBackdropDismiss: false
            });
            modal.onWillDismiss((data) => {
                /*this.deviceManagerService.transport.writeRead('/', ) getCurrentCalibration().catch((e) => {
                    console.log(e);
                });*/
                resolve(data);
            });
            modal.present();
        });
    }

    private alertWrapper(title: string, subTitle: string, buttons?: { text: string, handler: (data) => void }[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let alert = this.alertCtrl.create({
                title: title,
                subTitle: subTitle,
                buttons: buttons == undefined ? ['OK'] : <any>buttons
            });
            alert.onWillDismiss((data) => {
                resolve(data);
            });
            alert.present();
        });
    }

    openSimDevice() {
        if (this.selectedSimulatedDevice === 'OpenScope MZ') {
            if (this.checkIfMatchingLocal(this.selectedSimulatedDevice, this.tutorialMode)) {
                if (!this.tutorialMode) {
                    this.toastService.createToast('deviceExists', true);
                    return;
                }
            }
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
                            connectedDeviceAddress: null,
                            outdatedFirmware: false
                        }
                    );
                    this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
                        console.warn(e);
                    });
                    this.showDevMenu = false;
                    this.toastService.createToast('deviceAdded');
                    this.tutorialStage = 3;
                },
                (err) => {
                    console.log(err);
                    loading.dismiss();
                    this.toastService.createToast('timeout', true);
                },
                () => { }
            );

        }
    }

    openUpdateFirmware(deviceIndex: number): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.devices[deviceIndex].bridge) {
                this.toastService.createToast('deviceOutdatedFirmware', true);
                reject('Not an agent device');
                return;
            }
            let loading = this.displayLoading();
            this.agentSetActiveDeviceAndEnterJson(this.devices[deviceIndex])
                .then((possibleError) => {
                    loading.dismiss();
                    if (possibleError && possibleError.error && possibleError.error === 'jsonMode') {
                        this.toastService.createToast('agentEnterJsonError', true);
                        return;
                    }
                    let modal = this.modalCtrl.create(UpdateFirmwarePage, {
                        agentAddress: this.devices[deviceIndex].deviceBridgeAddress,
                        deviceObject: this.devices[deviceIndex]
                    }, {
                            enableBackdropDismiss: false
                        });
                    modal.onWillDismiss((data) => {
                        this.deviceManagerService.connect(this.devices[deviceIndex].deviceBridgeAddress).subscribe(
                            (data) => {
                                if (data.device && data.device[0].statusCode === 0) {
                                    this.devices[deviceIndex].deviceDescriptor = data.device[0];
                                    this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
                                        console.warn(e);
                                    });
                                    this.getFirmwareVersionsForDevices();
                                }
                                resolve();
                            },
                            (err) => {
                                reject(err);
                            },
                            () => { }
                        );
                    });
                    modal.present();
                })
                .catch((e) => {
                    loading.dismiss();
                    this.toastService.createToast('agentConnectError', true);
                    console.log(e);
                    reject(e);
                });
        });
    }

    openLoadFirmware() {
        let modal = this.modalCtrl.create(LoadFirmwarePage, undefined, {
            enableBackdropDismiss: false
        });
        modal.present();
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
        this.tutorialStage = 2;
        this.showDeviceTypeCard = false;
    }

    backToChooseDeviceType() {
        this.showDeviceTypeCard = true;
        this.tutorialStage = 1;
    }

    selectSimulatedDevice(event) {
        this.selectedSimulatedDevice = event;
    }

    enterJsonMode(): Promise<any> {
        let command = {
            "agent": [
                {
                    "command": "enterJsonMode"
                }
            ]
        };
        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    console.log('enter json mode');
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        console.log('Error Parsing JSON mode Device Response');
                        console.log(e);
                        reject(e);
                    }
                    if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                        reject();
                        return;
                    }
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );

        });
    }

    routeToDigilent() {
        let openTab = window.open('https://store.digilentinc.com/', '_blank');
        openTab.location;
    }

    connectToDevice(deviceIndex: number) {
        if (this.devices[deviceIndex].ipAddress === 'local') {
            this.deviceManagerService.addDeviceFromDescriptor('local', { device: [this.devices[deviceIndex].deviceDescriptor] });
            console.log(this.deviceManagerService);
            this.navCtrl.setRoot(InstrumentPanelPage, {
                tutorialMode: this.tutorialMode
            });
            return;
        }
        let loading = this.displayLoading();
        let ipAddress = this.devices[deviceIndex].ipAddress;
        if (this.devices[deviceIndex].bridge) {
            ipAddress = this.devices[deviceIndex].deviceBridgeAddress;
            this.deviceManagerService.transport.setHttpTransport(ipAddress);
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
                    if (!data.agent[0] || data.agent[0].statusCode > 0) {
                        this.toastService.createToast('agentConnectError', true);
                        loading.dismiss();
                        return;
                    }
                    this.enterJsonMode()
                        .then(() => {
                            this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress, loading, deviceIndex);
                        })
                        .catch((e) => {
                            this.toastService.createToast('agentConnectError', true);
                            loading.dismiss();
                        });
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
        this.sendEnumerationCommandAndLoadInstrumentPanel(ipAddress, loading, deviceIndex);
    }

    sendEnumerationCommandAndLoadInstrumentPanel(ipAddress: string, loadingInstance, deviceIndex) {
        this.deviceManagerService.connect(ipAddress).subscribe(
            (success) => {
                console.log(success);
                loadingInstance.dismiss();
                this.deviceManagerService.addDeviceFromDescriptor(ipAddress, success);
                this.devices[deviceIndex].deviceDescriptor = success.device[0];
                this.verifyFirmware(deviceIndex)
                    .then((data) => {
                        return this.verifyCalibrationSource(deviceIndex, success.device[0].calibrationSource);
                    })
                    .then((data) => {
                        this.storage.saveData('savedDevices', JSON.stringify(this.devices)).catch((e) => {
                            console.warn(e);
                        });
                        this.navCtrl.setRoot(InstrumentPanelPage, {
                            tutorialMode: this.tutorialMode
                        });
                    })
                    .catch((e) => {
                        console.log(e);
                    });
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