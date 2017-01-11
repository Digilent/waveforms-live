import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';
import { DeviceManagerService } from '../../services/device/device-manager.service';

@Component({
    templateUrl: 'calibrate.html',
})
export class CalibratePage {
    @ViewChild('calibrationSlider') slider: Slides;
    public storageService: StorageService;
    public settingsService: SettingsService;
    public params: NavParams;
    public viewCtrl: ViewController;
    public deviceManagerService: DeviceManagerService;
    public calibrationInstructions: string = 'There was an error loading the calibration instructions for your device.\n' +
        'Check your reference manual for correct setup before starting the calibration process.';
    public calibrationStatus: string = 'Please wait...';
    public calibrationFailed: boolean = false;
    public calibrationSuccessful: boolean = false;
    public calibrationReadAttempts: number = 0;
    public maxCalibrationReadAttempts: number = 20;
    public timeBetweenReadAttempts: number = 1000;

    /*public storageLocations: string[] = ['No Locations Found'];
    public selectedLocation: string = 'No Location Selected';*/
    //public saveCalibrationDecision: boolean = true;
    public calibrationResults: string = 'Results here';
    public calibrationResultsIndicator: string = '';

    constructor(
        _storageService: StorageService,
        _settingsService: SettingsService,
        _params: NavParams,
        _viewCtrl: ViewController,
        _deviceManagerService: DeviceManagerService
    ) {
        this.deviceManagerService = _deviceManagerService;
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        console.log('calibrate constructor');
        this.getCalibrationInstructions();
    }

    //Need to use this lifestyle hook to make sure the slider exists before trying to get a reference to it
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
        this.viewCtrl.dismiss();
    }

    /*selectStorage(event) {
        console.log(event);
    }*/

    toSlide(slideNum: number) {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(slideNum);
        swiperInstance.lockSwipes();
    }

    toCalibrationSuccessPage() {
        let swiperInstance: any = this.slider.getSlider();
        swiperInstance.unlockSwipes();
        this.slider.slideTo(2);
        swiperInstance.lockSwipes();
        this.calibrationResultsIndicator = 'Calibration was successful and was applied automatically.';
        //this.getStorageLocations();
    }

    saveCalibrationToDevice() {
        this.calibrationResultsIndicator = 'Saving calibration.';
        this.saveCalibration('flash')
            .then(() => {
            })
            .catch((err) => {
                this.calibrationResultsIndicator = 'Error saving calibration.';
            });        
    }

    onSuccessfulCalibrationApply() {
        this.viewCtrl.dismiss();
    }

    /*getStorageLocations() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].storageGetLocations().subscribe(
            (data) => {
                console.log(data);
                this.storageLocations = data.device[0].storageLocations;
            },
            (err) => {
                console.log(err);
                this.calibrationResultsIndicator = 'Could not get storage locations for device.';
            },
            () => { }
        );
    }*/

    getCalibrationInstructions() {
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
        this.startCalibration();
        this.toSlide(1);
    }

    startCalibration() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationStart().subscribe(
            (data) => {
                console.log(data);
                this.calibrationStatus = 'Running Calibration. This should take about ' + data.device[0].wait + ' seconds.';
                this.calibrationReadAttempts = 0;
                this.readCalibration();
            },
            (err) => {
                console.log(err);
                this.calibrationFailed = true;
                this.calibrationStatus = 'Error starting calibration. Please try again.';
            },
            () => { }
        );
    }

    loadCalibration(location: string, fileName: string) {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationLoad(location, fileName).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    readCalibration() {
        this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].calibrationRead().subscribe(
            (data) => {
                console.log(data);
                this.calibrationStatus = 'Calibration Successful!';
                this.calibrationSuccessful = true;
            },
            (err) => {
                console.log(err);
                if (this.calibrationReadAttempts < this.maxCalibrationReadAttempts) {
                    this.calibrationReadAttempts++;
                    setTimeout(() => {
                        this.readCalibration();
                    }, this.timeBetweenReadAttempts);
                }
                else {
                    this.calibrationFailed = true;
                    this.calibrationStatus = 'Timeout attempting to read calibration. Please try again.';
                }
            },
            () => { }
        );
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