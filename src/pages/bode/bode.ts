import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Services
import { UtilityService } from '../../services/utility/utility.service';

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

    constructor(
        _navCtrl: NavController,
        private utilityService: UtilityService
    ) {
        this.navCtrl = _navCtrl;
    }

    parseInputVal(input:  BodeInput) {
        
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
        this.bodeComponent.startSweep(this.startFreq, this.stopFreq, parseInt(this.stepsPerDec));
    }

}

export type BodeInput = 'startFreq' | 'stopFreq';