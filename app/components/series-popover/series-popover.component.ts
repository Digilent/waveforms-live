import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

@Component({
  templateUrl: 'build/components/series-popover/series-popover.html'
})

export class SeriesPopover {

    constructor(
        private viewCtrl: ViewController, 
        private params: NavParams
    ) {
            
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}