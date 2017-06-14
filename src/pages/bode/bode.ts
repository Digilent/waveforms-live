import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Services
import { UtilityService } from '../../services/utility/utility.service';
import { LoadingService } from '../../services/loading/loading.service';

@Component({
    templateUrl: "bode.html"
})
export class BodePage {
    @ViewChild('bodeComponent') bodeComponent: BodePlotComponent;
    public navCtrl: NavController;
    public startFreq: number = 100;
    public stopFreq: number = 10000;
    public stepsPerDec: string = '10';
    public ignoreFocusOut: boolean = false;
    public sweepType: SweepType = 'Log';
    public sweepTypeArray: SweepType[] = ['Log', 'Linear'];
    public vertScale: SweepType;

    constructor(
        _navCtrl: NavController,
        private utilityService: UtilityService,
        private loadingService: LoadingService
    ) {
        this.navCtrl = _navCtrl;
    }

    parseInputVal(input:  BodeInput) {
        
    }

    select(event, type: 'vert' | 'sweep') {
        if (type === 'vert') {
            this.sweepType = event;
        }
        else if (type === 'sweep') {
            this.vertScale = event;
        }
    }
    
    checkForEnter(event, input: BodeInput) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, input);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event, input:  BodeInput) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, input);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event, input:  BodeInput) {
        switch (input) {
            case 'startFreq':
                this.startFreq = this.utilityService.parseBaseNumberVal(event);
                break;
            case 'stopFreq':
                this.stopFreq = this.utilityService.parseBaseNumberVal(event);
                break;
            default:
        }
    }

    done() {
        this.navCtrl.pop();
    }

    start() {
        let loading = this.loadingService.displayLoading('Generating Bode Plot. Please wait...');
        this.bodeComponent.startSweep(this.startFreq, this.stopFreq, parseInt(this.stepsPerDec))
            .then((data) => {
                loading.dismiss();
                console.log(data);
            })
            .catch((e) => {
                loading.dismiss();
                console.log(e);
            });
    }

}

export type BodeInput = 'startFreq' | 'stopFreq';
export type SweepType = 'Log' | 'Linear';