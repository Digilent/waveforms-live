import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

//Components
import { LaComponent } from '../la-controls/la-controls.component';

@Component({
  templateUrl: 'la-popover.html'
})

export class LaPopover {
    public laComponent: LaComponent;
    public viewCtrl: ViewController;
    public params: NavParams;

    constructor(
        _viewCtrl: ViewController, 
        _params: NavParams
    ) {
        this.params = _params;
        this.viewCtrl = _viewCtrl;
        this.laComponent = this.params.get('laComponent');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}