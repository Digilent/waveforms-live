import { Component, ViewChild } from '@angular/core';
import { ViewController, Slides, NavParams } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

@Component({
    templateUrl: 'bode-modal.html',
})
export class BodeModalPage {
    @ViewChild('bodeSlider') slider: Slides;
    private bodePlotComponent: BodePlotComponent;
    private unitFormatPipe: UnitFormatPipe;
    public initialAmplitude: string;

    constructor(
        private viewCtrl: ViewController,
        private navParams: NavParams
    ) {
        this.bodePlotComponent = this.navParams.get('bodePlotComponent');
        this.unitFormatPipe = new UnitFormatPipe();
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

    runBodeInit() {
        this.bodePlotComponent.setBaselineAmp()
            .then((data) => {
                console.log(data);
                this.toSlide(1);
                this.initialAmplitude = this.unitFormatPipe.transform(this.bodePlotComponent.initialAmplitude, 'V');
            })
            .catch((e) => {
                console.log(e);
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