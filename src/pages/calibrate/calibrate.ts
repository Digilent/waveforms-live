import { Component, ViewChild, ViewChildren, QueryList, trigger, state, animate, transition, style } from '@angular/core';
import { NavParams, Slides, ViewController, LoadingController, AlertController } from 'ionic-angular';

//Components
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from 'dip-angular2/services';

@Component({
    templateUrl: 'calibrate.html',
    animations: [
        trigger('expand', [
            state('true', style({ height: '150px', visibility: 'visible' })),
            state('false', style({ height: '0', visibility: 'hidden' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ]),
        trigger('rotate', [
            state('true', style({ transform: 'rotate(-180deg)' })),
            state('false', style({ transform: 'rotate(0deg)' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ]),
        trigger('expandMoreInfo', [
            state('true', style({ visibility: 'visible' })),
            state('false', style({ height: '0', visibility: 'hidden' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ])
    ]
})
export class CalibratePage {
    @ViewChild('calibrationSlider') slider: Slides;
    @ViewChildren('digilentProgressBar') digilentProgressBar:QueryList<ProgressBarComponent>;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;
    public isLogger: boolean = false;

    public calibrationInstructions: string[];
    public noInstructions: string = 'There was an error loading the calibration instructions for your device. Check your reference manual for correct setup before starting the calibration process.';
    public currentStep: number;
    public showInstructions: boolean = true;
    public runningCalibration: boolean = false;

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

    public showAdvanced: boolean = false;
    public showMoreInfo: boolean = false;
    public saveAsDefault: boolean = true;

    // public calibrationReason: string = "Calibration will adjust measurements that are taken, as differences in hardware on devices\
    // as well as environmental factors such as temperature leave an effect on measured voltages and signals. To calibrate, the device\
    // outputs different voltages and signals while simultaneously measuring them. It then compares the results to what was expected\
    // in order to set an offset the device uses when making future measurements."

    public calibrationReason: string = "Device calibration compensates for component variance and temperature differences. Click here for <a href=\"/\">More Info</a>"

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
        this.isLogger = this.deviceManagerService.getActiveDevice().deviceModel === 'OpenLogger MZ';
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

    toggleAdvanced() {
        this.showAdvanced = !this.showAdvanced;
    }

    toggleMoreInfo() {
        this.showMoreInfo = !this.showMoreInfo;
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
        this.toNextSlide();
        this.calibrationResultsIndicator = "Calibration completed succesfully and has been applied to the instruments. By default, this calibration will be applied each time the device boots."; // Select <strong>Save as Default</strong> and click <strong>Done</strong> to apply the calibration everytime the device boots."; // was successful and has been applied to the instruments but will be lost when powered down.\nPress save to have this calibration load at startup.";
        this.getStorageLocations();
    }

    saveCalibrationToDevice(): Promise<any> {
        this.calibrationSaved = true;
        this.calibrationResultsIndicator = 'Saving calibration.';
        if (this.selectedLocation === 'No Location Selected') {
            this.calibrationResultsIndicator = 'Error saving calibration. Choose a valid storage location.';
            return Promise.reject(this.calibrationResultsIndicator);
        }
        if (this.calibrationResults.indexOf('IDEAL') !== -1 || this.calibrationResults.indexOf('UNCALIBRATED') !== -1) {
            this.calibrationResultsIndicator = 'Error saving calibration. One or more channels fell back to ideal values. Rerun calibration.';
            return Promise.reject(this.calibrationResultsIndicator);
        }
        console.log(this.selectedLocation);
        return this.saveCalibration(this.selectedLocation)
            .then(() => {
                this.calibrationResultsIndicator = 'Save successful';
                return Promise.resolve();
            })
            .catch((err) => {
                this.calibrationResultsIndicator = 'Error saving calibration.';
                return Promise.reject(this.calibrationResultsIndicator);
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
                let instructions = data.device[0].instructions;
                if (instructions == undefined) { return; }
                this.calibrationInstructions = typeof(instructions) === 'string' ? [data.device[0].instructions] : data.device[0].instructions;
            },
            (err) => {
                console.log(err);                
            },
            () => { }
        );
    }

    connectionImage(step: number) {
        return this.isLogger ? 'assets/img/openlogger_calibration_' + (step + 1) + '.svg' : 'assets/img/openscope_calibration.svg';
    }

    toNextSlide() {
        this.calibrationStatus = 'Ready To Calibrate';
        this.showInstructions = true;
        this.runningCalibration = false;

        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(swiperInstance.activeIndex + 1, 0);
        swiperInstance.lockSwipes();
    }

    runCalibration(step: number) {
        this.currentStep = step;
        this.calibrationFailed = false;
        this.calibrationSuccessful = false;

        // only reset instruments if first step
        if (this.currentStep === 1) {
            let loading = this.displayLoading();
            this.resetInstruments().then(() => {
                this.startCalibration();
                loading.dismiss();
                this.showInstructions = false;
                this.runningCalibration = true;
            }).catch((e) => {
                this.calibrationStatus = 'Error resetting the device. Make sure it is still connected and is on the latest firmware.';
                loading.dismiss();
            });
        } else {
            this.startCalibration();
            this.showInstructions = false;
            this.runningCalibration = true;
        }
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

        // TODO: update calibrationStart command
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
        this.digilentProgressBar.toArray()[this.currentStep - 1].start(waitTime);
    }

    progressBarFinished() {
        this.readCalibrationAfterCalibrating();
    }

    exitModal() {
        /* note(andrew): saveCalibrationToDevice returns a Promise, so a conditional ternary
           is used to substitute an immediately resolved Promise in the case the
           user doesn't want to save */
        ((this.saveAsDefault) ? this.saveCalibrationToDevice() : Promise.resolve())
            .then(() => {
                this.viewCtrl.dismiss();
            })
            .catch((err) => {
                console.log('Failed to save calibration.');
            });
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
        // this.slider.slideTo(3, 0);
        this.slider.slideTo(this.calibrationInstructions.length + 1, 0);
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
                // Make sure calibration did not fail          
                if (this.isLogger && data.device[0].calibrationData.daq[this.currentStep].status === 'FailedCalibration') {
                    this.calibrationFailed = true;
                    this.calibrationStatus = 'Calibration failed. Check your calibration setup and try again.';
                    return;
                }

                this.calibrationStatus = 'Calibration Successful!';
                this.parseCalibrationInformation(data);
                this.calibrationSuccessful = true;
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
                    this.calibrationStatus = 'Calibration failed. ' + (this.calibrationInstructions ? this.calibrationInstructions : 'Check your reference manual for correct setup.') + ' Click retry to restart calibration.';
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