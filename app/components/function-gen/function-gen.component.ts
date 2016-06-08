import {Component} from 'angular2/core';
import {IONIC_DIRECTIVES, NavController, Modal} from 'ionic-angular';

//Pages
import {ModalFgenPage} from '../../pages/fgen-modal/fgen-modal';

/* Notes for component and modal
* Eventually receive info from modal and update service with new values
* Discuss small version of waveform that is viewable from the main slide out menu
* Pass chart by reference (?) or load settings from service so each chart looks the same
*   Small highchart -> http://jsfiddle.net/zPDca/1/
* Nav Params must be objects
*/

@Component({
  templateUrl: 'build/components/function-gen/function-gen.html',
  selector: 'fgen',
  directives: [IONIC_DIRECTIVES, ModalFgenPage]
})
export class FgenComponent { 
    private nav: NavController;
    private showDutyCycle: boolean;
    private waveType: string;
    private frequency: string;
    private amplitude: string;
    private offset: string;
    private dutyCycle: string;
    private showWaves: boolean;
    private powerOn: boolean;
    
    constructor(_nav: NavController) {
        this.nav = _nav;
        this.showDutyCycle = false;
        this.waveType = 'sine';
        this.frequency = '1000';
        this.amplitude = '2.5';
        this.offset = '2.5';
        this.dutyCycle = '50';
        this.showWaves = false;
        this.powerOn = false;
    }
    
    toggleWave(waveType: string) {
        this.showWaves = !this.showWaves;
        this.waveType = waveType;
    }
    
    togglePower() {
        this.powerOn = !this.powerOn;
    }

    openFgen(num) {
        let modal = Modal.create(ModalFgenPage, {
            value: num, 
            waveType: this.waveType,
            frequency: this.frequency,
            amplitude: this.amplitude,
            offset: this.offset,
            dutyCycle: this.dutyCycle
        });
        modal.onDismiss(data=> {
           console.log(data);
           this.waveType = data.waveType;
           this.frequency = data.frequency;
           this.amplitude = data.amplitude;
           this.offset = data.offset;
           this.dutyCycle = data.dutyCycle; 
        });
        this.nav.present(modal);
    }
    
    isSquare() {
        if (this.waveType === 'square') {
            return true;
        }
        return false;
    }
    
}
