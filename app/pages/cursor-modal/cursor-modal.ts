import {NavParams, ViewController, Platform, NavController, Popover} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

@Component({
    templateUrl: "build/pages/cursor-modal/cursor-modal.html"
})
export class ModalCursorPage {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    private nav: NavController;
    private cursorType: string;
    private cursor1Chan: string;
    private cursor2Chan: string;

    private value: number;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _nav: NavController
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.nav = _nav;
        this.cursorType = this.params.get('cursorType');
        this.cursor1Chan = this.params.get('cursor1Chan');
        this.cursor2Chan = this.params.get('cursor2Chan');
    }

    closeModal(save: boolean) {
        if (save) {
            this.viewCtrl.dismiss({
                save: save,
                cursorType: this.cursorType,
                cursor1Chan: this.cursor1Chan,
                cursor2Chan: this.cursor2Chan
            });
        }
        else {
            this.viewCtrl.dismiss({
                save: save
            });
        }
    }

    showPopover(event) {
        let popover = Popover.create(MyPopover)
        this.nav.present(popover, {
            ev: event
        });
    } 
    
}

@Component({
  template: `
    <ion-input></ion-input>
  `
})

export class MyPopover{}