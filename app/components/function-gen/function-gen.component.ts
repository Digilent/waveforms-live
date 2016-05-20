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
    
    constructor(_nav: NavController) {
        this.nav = _nav;
    }
    
    openFgen(num) {
        let modal = Modal.create(ModalFgenPage, {num: 20});
        modal.onDismiss(data=> {
           console.log(data); 
        });
        this.nav.present(modal);
    }
}
