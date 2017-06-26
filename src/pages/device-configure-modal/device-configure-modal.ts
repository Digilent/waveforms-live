import { NavParams, Platform, NavController, ModalController, LoadingController } from 'ionic-angular';
import { Component, ViewChild } from '@angular/core';

//Components
import { DeviceManagerPage } from '../device-manager-page/device-manager-page';
import { CalibratePage } from '../calibrate/calibrate';
import { WifiSetupPage } from '../wifi-setup/wifi-setup';
import { LoadFirmwarePage } from '../load-firmware/load-firmware';
import { UpdateFirmwarePage } from '../update-firmware/update-firmware';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';

//Interfaces
import { DeviceCardInfo } from '../device-manager-page/device-manager-page.interface';
import { NicStatusContainer } from '../wifi-setup/wifi-setup.interface';

//Services
import { DeviceManagerService } from 'dip-angular2/services';
import { TooltipService } from '../../services/tooltip/tooltip.service';

@Component({
    templateUrl: "device-configure-modal.html"
})

export class DeviceConfigureModal {
    @ViewChild('dropdownPop') dropdownPopRef: DropdownPopoverComponent;
    public platform: Platform;
    public loadingCtrl: LoadingController;
    public modalCtrl: ModalController;
    public navCtrl: NavController;
    public deviceManagerService: DeviceManagerService;
    public tooltipService: TooltipService;
    public params: NavParams;

    public potentialDevices: string[];
    public selectedPotentialDeviceIndex: number = 0;
    public deviceBridgeAddress: string;
    public deviceManagerPageRef: DeviceManagerPage;
    public deviceObject: DeviceCardInfo;

    //Content controllers
    public bridgeConfigure: boolean = false;
    public deviceConfigure: boolean = false;
    public invalidEnumeration: boolean = true;

    //Leftovers from transfer. TODO wade through this
    public hostname: string = 'test';
    public nicStatusContainer: NicStatusContainer = {
        adapter: '',
        securityType: null,
        status: null,
        ssid: '',
        ipAddress: ''
    }
    public deviceArrayIndex: number;
    public currentCalibration: string = '';

    constructor(
        _platform: Platform,
        _modalCtrl: ModalController,
        _loadingCtrl: LoadingController,
        _params: NavParams,
        _deviceManagerService: DeviceManagerService,
        _tooltipService: TooltipService,
        _navCtrl: NavController
    ) {
        this.platform = _platform;
        this.modalCtrl = _modalCtrl;
        this.loadingCtrl = _loadingCtrl;
        this.navCtrl = _navCtrl;
        this.tooltipService = _tooltipService;
        this.params = _params;
        this.deviceManagerService = _deviceManagerService;
        this.potentialDevices = this.params.get('potentialDevices');
        this.deviceBridgeAddress = this.params.get('deviceBridgeAddress');
        this.deviceArrayIndex = this.params.get('deviceArrayIndex');
        this.deviceManagerPageRef = this.params.get('deviceManagerPageRef');
        this.deviceObject = this.params.get('deviceObject');
        if (this.params.get('bridge')) {
            this.bridgeConfigure = true;
        }
        if (this.deviceObject != null) {
            console.log(this.deviceObject);
            this.invalidEnumeration = false;
            let addDeviceAddress = this.deviceObject.bridge ? this.deviceObject.deviceBridgeAddress : this.deviceObject.ipAddress;
            this.deviceManagerService.addDeviceFromDescriptor(addDeviceAddress, { device: [this.deviceObject.deviceDescriptor] });
            if (this.deviceObject.bridge) {
                let loading = this.deviceManagerPageRef.displayLoading();
                this.setAgentActiveDeviceFromExisting()
                    .then((errorEnteringJsonMode: boolean) => {
                        this.deviceConfigure = true;
                        if (errorEnteringJsonMode) {
                            return;
                        }
                        return this.getNicStatus('wlan0');
                    })
                    .catch((e) => {
                        console.log(e);
                        return Promise.reject('device not connected');
                    })
                    .then(() => {
                        return this.reEnumerateAgent();
                    })
                    .catch((e) => {
                        console.log(e);
                        return this.reEnumerateAgent(false);
                    })
                    .then(() => {
                        if (this.potentialDevices && this.potentialDevices.indexOf(this.deviceObject.connectedDeviceAddress) !== -1) {
                            this.dropdownPopRef.setActiveSelection(this.deviceObject.connectedDeviceAddress);
                            this.selectedPotentialDeviceIndex = this.potentialDevices.indexOf(this.deviceObject.connectedDeviceAddress);
                        }
                        loading.dismiss();
                        this.deviceManagerPageRef.verifyFirmware(this.deviceArrayIndex == undefined ? 0 : this.deviceArrayIndex)
                            .then(() => {
                                return this.getCurrentCalibration();
                            })
                            .then(() => { })
                            .catch((e) => { });
                    })
                    .catch((e) => {
                        console.log('Error setting active from existing');
                        loading.dismiss();
                    });
            }
            else {
                if (this.deviceObject.ipAddress === 'local') {
                    this.deviceConfigure = true;
                    this.currentCalibration = 'USER';
                    return;
                }
                let loading = this.deviceManagerPageRef.displayLoading();
                this.deviceManagerService.connect(this.deviceObject.ipAddress).subscribe(
                    (data) => {
                        if (data.device && data.device[0].statusCode === 0) {
                            this.deviceConfigure = true;
                            this.getNicStatus('wlan0')
                                .then(() => {
                                    loading.dismiss();
                                    return this.deviceManagerPageRef.verifyFirmware(this.deviceArrayIndex == undefined ? 0 : this.deviceArrayIndex)
                                })
                                .then(() => {
                                    return this.getCurrentCalibration();
                                })
                                .catch((e) => {
                                    return this.getCurrentCalibration();
                                })
                                .then(() => {
                                })
                                .catch((e) => {
                                    loading.dismiss();
                                });
                        }
                    },
                    (err) => {
                        console.log(err);
                        this.deviceManagerPageRef.toastService.createToast('timeout', true);
                        loading.dismiss();
                    },
                    () => { }
                );
            }
            this.bridgeConfigure = this.deviceObject.bridge;
            this.deviceBridgeAddress = this.bridgeConfigure === true ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress;
        }
        else if (this.deviceObject == undefined && this.bridgeConfigure) {
            this.reEnumerateAgent(false);
        }
    }

    getNicStatus(adapter: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].nicGetStatus(adapter).subscribe(
                (data) => {
                    this.nicStatusContainer.ipAddress = data.device[0].ipAddress;
                    this.nicStatusContainer.ssid = data.device[0].ssid;
                    this.nicStatusContainer.status = data.device[0].status.charAt(0).toUpperCase() + data.device[0].status.slice(1);
                    resolve(data);
                },
                (err) => {
                    reject(err);
                    console.log(err);
                },
                () => { }
            );

        });
    }

    getCurrentCalibration(routeToCalibrationWizard?: boolean): Promise<any> {
        routeToCalibrationWizard = routeToCalibrationWizard == undefined ? true : routeToCalibrationWizard;
        return new Promise((resolve, reject) => {
            this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationRead().subscribe(
                (data) => {
                    let calibrationObjectString = JSON.stringify(data.device[0].calibrationData);
                    if (calibrationObjectString.indexOf('USER') !== -1 || calibrationObjectString.indexOf('SD') !== -1 || calibrationObjectString.indexOf('sd') !== -1) {
                        this.currentCalibration = 'SD';
                    }
                    else if (calibrationObjectString.indexOf('FACTORY') !== -1 || calibrationObjectString.indexOf('FLASH') !== -1 || calibrationObjectString.indexOf('flash') !== -1) {
                        this.currentCalibration = 'Flash';
                    }
                    else if (calibrationObjectString.indexOf('UNCALIBRATED') !== -1 || calibrationObjectString.indexOf('IDEAL') !== -1) {
                        this.currentCalibration = 'Uncalibrated';
                        if (routeToCalibrationWizard) {
                            this.deviceManagerPageRef.verifyCalibrationSource(this.deviceArrayIndex == undefined ? 0 : this.deviceArrayIndex, 'UNCALIBRATED')
                                .then(() => {
                                    this.getCurrentCalibration(false)
                                        .then((data) => {
                                            resolve(data);
                                        })
                                        .catch((e) => {
                                            reject(e);
                                        });
                                })
                                .catch((e) => {
                                    reject(e);
                                });
                        }
                    }
                    else {
                        this.currentCalibration = 'Calibrated';
                    }
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    reEnumerateAgent(autoConnectToFirst?: boolean): Promise<null> {
        autoConnectToFirst = autoConnectToFirst || false;
        return new Promise((resolve, reject) => {
            this.deviceManagerService.connectBridge(this.deviceBridgeAddress).subscribe(
                (success) => {
                    resolve();
                    if (success.agent == undefined || success.agent[0].statusCode > 0) {
                        this.deviceManagerPageRef.toastService.createToast('agentInvalidResponse', true);
                        return;
                    }
                    if (success.agent[0].devices.length === 0) {
                        this.deviceManagerPageRef.toastService.createToast('agentEnumerateError', true);
                        return;
                    }
                    this.potentialDevices = success.agent[0].devices;
                    if (success.agent[0].devices.length === 1 && !this.deviceObject && autoConnectToFirst) {
                        this.dropdownDeviceChange(success.agent[0].devices[0], autoConnectToFirst);
                    }
                    else if (success.agent[0].devices.length > 0 && autoConnectToFirst) {
                        this.dropdownDeviceChange(success.agent[0].devices[0], autoConnectToFirst);
                    }
                    if (success.agent[0].devices.length > 0 && this.deviceObject && success.agent[0].devices.indexOf(this.deviceObject.connectedDeviceAddress) !== -1) {
                        this.dropdownPopRef.setActiveSelection(this.deviceObject.connectedDeviceAddress);
                    }
                    else if (success.agent[0].devices.length > 0 && this.deviceObject && success.agent[0].devices.indexOf(this.deviceObject.connectedDeviceAddress) === -1) {
                        this.dropdownDeviceChange(success.agent[0].devices[0], autoConnectToFirst);
                    }
                },
                (err) => {
                    resolve();
                    console.log(err);
                    this.deviceManagerPageRef.toastService.createToast('agentInvalidResponse', true);
                },
                () => {

                }
            );

        });
    }

    setAgentActiveDeviceFromExisting(): Promise<any> {
        //Used to have agent set the device in JSON mode for serial communication.
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": this.deviceObject.connectedDeviceAddress
                }
            ]
        };

        this.deviceManagerService.transport.setHttpTransport(this.deviceObject.deviceBridgeAddress);

        return new Promise((resolve, reject) => {
            this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        console.log(e);
                    }
                    if (data == undefined || data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                        this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                        this.invalidEnumeration = true;
                        reject();
                        return;
                    }
                    this.enterJsonMode().then(() => {
                        this.enumerateDevice(this.deviceObject.deviceBridgeAddress)
                            .then((data) => {
                                resolve();
                            })
                            .catch((e) => {
                                reject();
                            });
                    }).catch((e) => {
                        resolve(true);
                    });
                },
                (err) => {
                    this.deviceManagerPageRef.toastService.createToast('timeout', true);
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    updateDeviceEnumeration(deviceEnumeration: any) {
        if (this.deviceArrayIndex == undefined || this.deviceManagerPageRef.devices[this.deviceArrayIndex] == undefined) {
            return;
        }
        this.deviceManagerPageRef.devices[this.deviceArrayIndex].deviceDescriptor = deviceEnumeration;
        this.deviceManagerPageRef.storage.saveData('savedDevices', JSON.stringify(this.deviceManagerPageRef.devices));
        this.deviceManagerPageRef.getFirmwareVersionsForDevices();
    }

    enumerateDevice(address: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.connect(address).subscribe(
                (data) => {
                    if (data.device && data.device[0].statusCode === 0) {
                        this.updateDeviceEnumeration(data.device[0]);
                        resolve(data);
                    }
                    else {
                        reject(data);
                    }
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
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
                        this.deviceManagerPageRef.toastService.createToast('agentEnterJsonError', true);
                        this.invalidEnumeration = true;
                        reject();
                        return;
                    }
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

    retryDeviceEnumeration() {
        this.selectDevice(this.selectedPotentialDeviceIndex);
    }

    selectDevice(selectedIndex: number) {
        this.deviceConfigure = false;
        this.invalidEnumeration = true;
        let command = {
            "agent": [
                {
                    "command": "setActiveDevice",
                    "device": this.potentialDevices[selectedIndex]
                }
            ]
        };

        let loading = this.deviceManagerPageRef.displayLoading();

        this.deviceManagerService.transport.writeRead('/config', JSON.stringify(command), 'json').subscribe(
            (arrayBuffer) => {
                let data;
                try {
                    let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                    console.log(stringify);
                    data = JSON.parse(stringify);
                }
                catch (e) {
                    console.log('Error Parsing Set Active Device Response');
                    console.log(e);
                    loading.dismiss();
                    this.invalidEnumeration = true;
                    this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                    return;
                }
                if (data.agent[0] == undefined || data.agent[0].statusCode > 0) {
                    console.log('Agent StatusCode Error');
                    loading.dismiss();
                    this.invalidEnumeration = true;
                    this.deviceManagerPageRef.toastService.createToast('agentConnectError', true);
                    return;
                }
                this.deviceConfigure = true;
                this.enterJsonMode().then(() => {
                    this.deviceManagerService.connect(this.deviceBridgeAddress).subscribe(
                        (data) => {
                            loading.dismiss();
                            if (data.device[0].statusCode == undefined || data.device[0].statusCode > 0) {
                                this.deviceManagerPageRef.toastService.createToast('enumerateError', true);
                                this.invalidEnumeration = true;
                                return;
                            }
                            this.invalidEnumeration = false;

                            if (this.deviceObject != undefined) {
                                this.deviceObject.deviceDescriptor = data.device[0];
                                this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                                this.deviceObject.ipAddress = this.deviceObject.deviceBridgeAddress + ' - ' + this.deviceObject.connectedDeviceAddress;
                                this.deviceManagerPageRef.storage.saveData('savedDevices', JSON.stringify(this.deviceManagerPageRef.devices));
                                this.deviceManagerService.addDeviceFromDescriptor(this.deviceObject.deviceBridgeAddress, { device: [this.deviceObject.deviceDescriptor] });
                                this.deviceConfigure = true;
                                this.deviceManagerPageRef.getFirmwareVersionsForDevices();
                                this.getNicStatus('wlan0').then(() => {
                                    return this.deviceManagerPageRef.verifyFirmware(this.deviceArrayIndex == undefined ? 0 : this.deviceArrayIndex);
                                })
                                    .then((data) => {
                                        this.getCurrentCalibration().catch((e) => { });
                                    }).catch((e) => {
                                        this.getCurrentCalibration().catch((e) => { });
                                    });
                                return;
                            }

                            let validDevice = this.deviceManagerPageRef.bridgeDeviceSelect({
                                selectedDevice: this.potentialDevices[selectedIndex],
                                deviceEnum: data
                            }, this.deviceBridgeAddress);
                            if (validDevice) {
                                this.deviceConfigure = true;
                                this.deviceObject = this.deviceManagerPageRef.devices[0];
                                this.deviceObject.connectedDeviceAddress = this.potentialDevices[selectedIndex];
                                this.deviceManagerPageRef.deviceManagerService.addDeviceFromDescriptor(this.deviceBridgeAddress, { device: [this.deviceObject.deviceDescriptor] });
                            }
                            this.getNicStatus('wlan0').then(() => {
                                return this.deviceManagerPageRef.verifyFirmware(0);
                            })
                                .then((data) => {
                                    this.getCurrentCalibration().catch((e) => { });
                                }).catch((e) => {
                                    this.getCurrentCalibration().catch((e) => { });
                                });
                        },
                        (err) => {
                            console.log(err);
                            loading.dismiss();
                            this.invalidEnumeration = true;
                            this.deviceManagerPageRef.toastService.createToast('timeout', true);
                        },
                        () => { }
                    );
                }).catch((e) => {
                    loading.dismiss();
                    /*this.deviceObject = {
                        deviceDescriptor: {},
                        ipAddress: '',
                        hostname: 'Hostname',
                        bridge: this.bridgeConfigure,
                        deviceBridgeAddress: this.deviceBridgeAddress,
                        connectedDeviceAddress: this.potentialDevices[selectedIndex],
                        outdatedFirmware: false
                    };*/
                });


            },
            (err) => {
                console.log(err);
                loading.dismiss();
            },
            () => {
            }
        );
    }

    dropdownDeviceChange(event, autoConnect?: boolean) {
        autoConnect = autoConnect == undefined ? true : autoConnect;
        this.selectedPotentialDeviceIndex = this.potentialDevices.indexOf(event);
        if (!autoConnect) { return; }
        this.selectDevice(this.selectedPotentialDeviceIndex);

    }

    done() {
        this.navCtrl.pop();
    }

    openCorrectFirmwareModal() {
        if (!this.potentialDevices) { return; }
        let page;
        let params;
        if (this.invalidEnumeration || this.deviceObject == undefined) {
            page = LoadFirmwarePage;
            params = {
                agentAddress: this.deviceObject ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress
            };
        }
        else {
            page = UpdateFirmwarePage;
            params = {
                agentAddress: this.deviceObject ? this.deviceObject.deviceBridgeAddress : this.deviceBridgeAddress,
                deviceObject: this.deviceObject
            };
        }
        let modal = this.modalCtrl.create(page, params, {
            enableBackdropDismiss: false
        });
        modal.onWillDismiss((data) => {
            if (this.deviceArrayIndex == undefined || page === LoadFirmwarePage) { return; }
            this.deviceManagerService.connect(this.deviceManagerPageRef.devices[this.deviceArrayIndex].deviceBridgeAddress).subscribe(
                (data) => {
                    if (data.device && data.device[0].statusCode === 0) {
                        this.updateDeviceEnumeration(data.device[0]);
                        console.log('MODAL DISMISS');
                        if (data.device[0].calibrationSource != undefined) {
                            console.log('CALLING VERIFY CALIBRATION SOURCE');
                            this.deviceManagerPageRef.verifyCalibrationSource(this.deviceArrayIndex, data.device[0].calibrationSource)
                                .then((data) => {
                                    console.log(data);
                                })
                                .catch((e) => {
                                    console.log(e);
                                });
                        }
                    }
                },
                (err) => {

                },
                () => { }
            );
        });
        modal.present();
    }

    openCalibrateWizard() {
        let modal = this.modalCtrl.create(CalibratePage, undefined, {
            enableBackdropDismiss: false
        });
        modal.onWillDismiss(() => {
            this.getCurrentCalibration().catch((e) => {
                console.log(e);
            });
        });
        modal.present();
    }

    openWifiWizard() {
        let modal = this.modalCtrl.create(WifiSetupPage, {
            deviceObject: this.deviceObject
        }, {
                enableBackdropDismiss: false
            });
        modal.onWillDismiss((data) => {
            if (data == undefined) { return; }
            if (data.toDeviceManagerPage) {
                this.navCtrl.pop();
                return;
            }
            this.nicStatusContainer.ipAddress = data.ipAddress || '';
            this.nicStatusContainer.ssid = data.ssid || '';
            this.nicStatusContainer.status = data.status.charAt(0).toUpperCase() + data.status.slice(1) || '';
        });
        modal.present();
    }

    getFirmwareVersion() {
        if (this.deviceObject == undefined || this.invalidEnumeration) {
            return 'N/A';
        }
        let vArray = [];
        for (let mmp in this.deviceObject.deviceDescriptor.firmwareVersion) {
            vArray.push(this.deviceObject.deviceDescriptor.firmwareVersion[mmp]);
        }
        return vArray.join('.');
    }

}