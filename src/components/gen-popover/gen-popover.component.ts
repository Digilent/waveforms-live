import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

@Component({
    templateUrl: 'gen-popover.html'
})

export class GenPopover {
    public dataArray: string[];
    public viewCtrl: ViewController;
    public params: NavParams;

    constructor(
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.dataArray = this.params.get('dataArray');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        console.log('dismissing gen popover');
        console.log(option);
        this.viewCtrl.dismiss({
            option: option
        });
    }
}