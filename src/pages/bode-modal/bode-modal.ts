import { Component, ViewChild } from '@angular/core';
import { ViewController, Slides, NavParams } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Services
import { LoadingService } from '../../services/loading/loading.service';

@Component({
    templateUrl: 'bode-modal.html',
})
export class BodeModalPage {
    @ViewChild('bodeSlider') slider: Slides;
    private bodePlotComponent: BodePlotComponent;
    private unitFormatPipe: UnitFormatPipe;
    private exitAfterCalibration: boolean;

    constructor(
        private viewCtrl: ViewController,
        private navParams: NavParams,
        private loadingService: LoadingService
    ) {
        this.bodePlotComponent = this.navParams.get('bodePlotComponent');
        this.exitAfterCalibration = this.navParams.get('exit');
        this.unitFormatPipe = new UnitFormatPipe();
    }

    //Need to use this lifecycle hook to make sure the slider exists before trying to get a reference to it
    ionViewDidEnter() {
        this.getSwiperInstance();
        if (this.bodePlotComponent.calibrationData != undefined && !this.exitAfterCalibration) {
            this.toSlide(1, true);
        }
    }

    getSwiperInstance() {
        let swiperInstance: any = this.slider.getSlider();
        if (swiperInstance == undefined) {
            setTimeout(() => {
                this.getSwiperInstance();
            }, 20);
            return;
        }
        swiperInstance.lockSwipes();
    }

    runBodeInit() {
        let loading = this.loadingService.displayLoading('Running Calibration...');
        this.bodePlotComponent.calibrate()
            .then((data) => {
                console.log(data);
                loading.dismiss();
                this.toSlide(1);
            })
            .catch((e) => {
                console.log(e);
                loading.dismiss();
                //TODO display error
            });
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

    closeModal(calibrated: boolean) {
        this.viewCtrl.dismiss(calibrated);
    }

}