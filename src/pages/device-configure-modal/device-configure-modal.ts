import {NavParams, ViewController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';

@Component({
    templateUrl: "device-configure-modal.html"
})
export class DeviceConfigureModal {
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public cursorType: string;
    public cursor1Chan: string;
    public cursor2Chan: string;
    public cursorTypeArray: string[] = ['disabled','time','track','voltage'];
    public cursorChanArray: string[] = ['O1', 'O2'];

    public value: number;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
    }

    //Close modal and save settings if they are changed
    closeModal(save: boolean) {

        this.viewCtrl.dismiss({
            save: save,
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan
        });

    }
    
}