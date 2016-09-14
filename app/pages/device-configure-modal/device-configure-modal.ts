import {NavParams, ViewController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';

@Component({
    templateUrl: "build/pages/device-configure-modal/device-configure-modal.html"
})
export class DeviceConfigureModal {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private cursorType: string;
    private cursor1Chan: string;
    private cursor2Chan: string;
    private cursorTypeArray: string[] = ['disabled','time','track','voltage'];
    private cursorChanArray: string[] = ['O1', 'O2'];

    private value: number;
    
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