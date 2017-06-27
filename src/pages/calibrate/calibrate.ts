import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController, LoadingController, AlertController } from 'ionic-angular';

//Components
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from 'dip-angular2/services';

@Component({
    templateUrl: 'calibrate.html',
})
export class CalibratePage {
    @ViewChild('calibrationSlider') slider: Slides;
    @ViewChild('digilentProgressBar') digilentProgressBar: ProgressBarComponent;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;
    public calibrationInstructions: string = 'There was an error loading the calibration instructions for your device.\n' +
    'Check your reference manual for correct setup before starting the calibration process.';
    public calibrationStatus: string = 'Ready To Calibrate';
    public calibrationFailed: boolean = false;
    public calibrationSuccessful: boolean = false;
    private calibrationSaved: boolean = false;
    public calibrationReadAttempts: number = 0;
    public maxCalibrationReadAttempts: number = 10;
    public timeBetweenReadAttempts: number = 2000;

    public storageLocations: string[] = ['No Locations Found'];
    public selectedLocation: string = 'No Location Selected';
    public calibrationResults: string = 'Results here';
    public calibrationResultsIndicator: string = '';

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _viewCtrl: ViewController,
        _deviceManagerService: DeviceManagerService,
        public loadingCtrl: LoadingController,
        private alertCtrl: AlertController
    ) {
        this.deviceManagerService = _deviceManagerService;
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        console.log('calibrate constructor');
        this.getCalibrationInstructions();
    }

    //Need to use this lifecycle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        let swiperInstance: any = this.slider.getSlider();
        if (swiperInstance == undefined) {
            setTimeout(() => {
                this.ionViewDidEnter();
            }, 20);
            return;
        }
        swiperInstance.lockSwipes();
    }

    closeModal() {
        if (this.calibrationSuccessful && !this.calibrationSaved) {
            //Good calibration but not saved.
            this.presentConfirmNoSaveAlert()
                .catch((e) => {
                    console.log(e);
                    this.viewCtrl.dismiss();
                });
        }
        else {
            this.viewCtrl.dismiss();
        }
    }

    private presentConfirmNoSaveAlert(): Promise<any> {
        return new Promise((resolve, reject) => {
            let alert = this.alertCtrl.create({
                title: 'Calibration Not Saved',
                message: 'Would you like to save your calibration?',
                buttons: [
                    {
                        text: 'No',
                        handler: () => {
                            reject();
                        }
                    },
                    {
                        text: 'Yes',
                        handler: () => {
                            resolve();
                        }
                    }
                ]
            });
            alert.present();
        });
    }

    selectStorage(event) {
        this.selectedLocation = event;
        console.log(this.selectedLocation);
    }

    toSlide(slideNum: number, noTransition?: boolean) {
        noTransition = noTransition == undefined ? false : noTransition;
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        if (noTransition) {
            this.slider.slideTo(slideNum, 0);
        }
        else {
            this.slider.slideTo(slideNum);
        }
        swiperInstance.lockSwipes();
    }

    toCalibrationSuccessPage() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(2);
        swiperInstance.lockSwipes();
        this.calibrationResultsIndicator = 'Calibration was successful and has been applied to the instruments but will be lost when powered down.\nPress save to have this calibration load at startup.';
        this.getStorageLocations();
    }

    saveCalibrationToDevice(): Promise<any> {
        this.calibrationSaved = true;
        this.calibrationResultsIndicator = 'Saving calibration.';
        if (this.selectedLocation === 'No Location Selected') {
            this.calibrationResultsIndicator = 'Error saving calibration. Choose a valid storage location.';
            return Promise.resolve();
        }
        if (this.calibrationResults.indexOf('IDEAL') !== -1 || this.calibrationResults.indexOf('UNCALIBRATED') !== -1) {
            this.calibrationResultsIndicator = 'Error saving calibration. One or more channels fell back to ideal values. Rerun calibration.';
            return Promise.resolve();
        }
        console.log(this.selectedLocation);
        this.saveCalibration(this.selectedLocation)
            .then(() => {
                this.calibrationResultsIndicator = 'Save successful';
                return Promise.resolve();
            })
            .catch((err) => {
                this.calibrationResultsIndicator = 'Error saving calibration.';
                return Promise.resolve();
            });
    }

    onSuccessfulCalibrationApply() {
        this.viewCtrl.dismiss();
    }

    getStorageLocations() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationGetStorageTypes().subscribe(
            (data) => {
                console.log(data);
                this.storageLocations = data.device[0].storageTypes;
                this.selectedLocation = this.storageLocations[0];
            },
            (err) => {
                console.log(err);
                this.calibrationResultsIndicator = 'Could not get storage locations for device.';
            },
            () => { }
        );
    }

    getCalibrationInstructions() {
        console.log(this.deviceManagerService);
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationGetInstructions().subscribe(
            (data) => {
                console.log(data);
                if (data.device[0].instructions == undefined) { return; }
                this.calibrationInstructions = data.device[0].instructions;
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    runCalibration() {
        this.calibrationFailed = false;
        this.calibrationSuccessful = false;
        let loading = this.displayLoading();
        this.resetInstruments().then(() => {
            this.startCalibration();
            loading.dismiss();
            this.toSlide(1);
        }).catch((e) => {
            this.calibrationStatus = 'Error resetting the device. Make sure it is still connected and is on the latest firmware.';
            loading.dismiss();
        });
    }

    displayLoading(message?: string) {
        message = message == undefined ? 'Resetting Device...' : message;
        let loading = this.loadingCtrl.create({
            content: message,
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });

        loading.present();

        return loading;
    }

    resetInstruments(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].resetInstruments().subscribe(
                (data) => {
                    console.log(data);
                    if (data.device[0].wait) {
                        setTimeout(() => {
                            resolve(data);
                        }, data.device[0].wait);
                    }
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    startCalibration() {
        this.calibrationFailed = false;
        this.calibrationSuccessful = false;
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationStart().subscribe(
            (data) => {
                console.log(data);
                let waitTime = data.device[0].wait < 0 ? this.timeBetweenReadAttempts : data.device[0].wait;
                this.calibrationStatus = 'This should take about ' + (data.device[0].wait / 1000) + ' seconds.';
                this.calibrationReadAttempts = 0;
                this.runProgressBar(waitTime);
            },
            (err) => {
                console.log(err);
                this.calibrationFailed = true;
                if (err.device && err.device[0].statusCode === 2684354573) {
                    this.calibrationStatus = 'Error running calibration. Please check your setup and try again.';
                    return;
                }
                this.calibrationStatus = 'Error starting calibration. Please try again.';
            },
            () => { }
        );
    }

    runProgressBar(waitTime: number) {
        this.digilentProgressBar.start(waitTime);
    }

    progressBarFinished() {
        this.readCalibrationAfterCalibrating();
    }

    loadCalibration(type: string) {
        this.calibrationResultsIndicator = 'Loading calibration.';
        if (this.selectedLocation === 'No Location Selected') {
            this.calibrationResultsIndicator = 'Error loading calibration. Choose a valid storage location.';
            return;
        }
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationLoad(type).subscribe(
            (data) => {
                console.log(data);
                setTimeout(() => {
                    this.readCalibration().catch((e) => {
                        this.calibrationResultsIndicator = 'Error reading current calibration.';
                    });
                }, 750);
                this.calibrationResultsIndicator = 'Loaded calibration successfully.';
            },
            (err) => {
                console.log(err);
                this.calibrationResultsIndicator = 'Error loading calibration.';
            },
            () => { }
        );
    }

    loadSelectedCalibration() {
        this.loadCalibration(this.selectedLocation);
    }

    readCalibration(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationRead().subscribe(
                (data) => {
                    console.log(data);
                    this.calibrationStatus = 'Loaded current calibration data.';
                    this.parseCalibrationInformation(data);
                    resolve();
                },
                (err) => {
                    console.log(err);
                    this.calibrationStatus = 'Error loading current calibration.';
                    reject();
                },
                () => { }
            );
        });
    }

    toLoadExistingPage() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(3, 0);
        swiperInstance.lockSwipes();
        this.calibrationResultsIndicator = 'Select a storage location and click load.';
        this.calibrationResults = '';
        this.readCalibration().then(() => {
            this.getStorageLocations();
        }).catch((e) => { });
    }

    readCalibrationAfterCalibrating() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationRead().subscribe(
            (data) => {
                console.log(data);
                this.calibrationStatus = 'Calibration Successful!';
                this.parseCalibrationInformation(data);
                this.calibrationSuccessful = true;
                this.toCalibrationSuccessPage();
            },
            (err) => {
                console.log(err);
                if (err.device == undefined && this.calibrationReadAttempts < this.maxCalibrationReadAttempts) {
                    this.calibrationReadAttempts++;
                    setTimeout(() => {
                        this.readCalibrationAfterCalibrating();
                    }, this.timeBetweenReadAttempts);
                    return;
                }
                if (err.device && err.device[0].statusCode === 8) {
                    if (this.calibrationReadAttempts < this.maxCalibrationReadAttempts) {
                        this.calibrationReadAttempts++;
                        setTimeout(() => {
                            this.readCalibrationAfterCalibrating();
                        }, this.timeBetweenReadAttempts);
                    }
                    else {
                        this.calibrationFailed = true;
                        this.calibrationStatus = 'Timeout attempting to read calibration. Check your calibration setup and try again.';
                    }
                }
                else if (err.device && err.device[0].statusCode === 2684354578) {
                    //Bad setup
                    this.calibrationFailed = true;
                    this.calibrationStatus = 'Calibration failed. ' + this.calibrationInstructions + ' Click retry to restart calibration.';
                    return;
                }
            },
            () => { }
        );
    }

    parseCalibrationInformation(data: any) {
        let calibrationDataContainer = data.device[0].calibrationData;
        for (let instrument in calibrationDataContainer) {
            if (calibrationDataContainer[instrument].numChans) {
                delete calibrationDataContainer[instrument].numChans;
            }
        }
        let calibrationDataAsString: string = JSON.stringify(calibrationDataContainer, undefined, 4);
        this.calibrationResults = calibrationDataAsString;
    }

    saveCalibration(location: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationSave(location).subscribe(
                (data) => {
                    console.log(data);
                    resolve();
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

}