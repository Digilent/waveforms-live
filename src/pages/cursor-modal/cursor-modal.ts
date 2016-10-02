import {NavParams, ViewController, Platform, PopoverController} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {GenPopover} from '../../components/gen-popover/gen-popover.component';

@Component({
    templateUrl: "cursor-modal.html"
})
export class ModalCursorPage {
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public cursorType: string;
    public cursor1Chan: string;
    public cursor2Chan: string;
    public cursorTypeArray: string[] = ['disabled','time','track','voltage'];
    public cursorChanArray: string[] = ['O1', 'O2'];

    public value: number;
    public popoverCtrl: PopoverController;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams,
        _popoverCtrl: PopoverController
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.cursorType = this.params.get('cursorType');
        this.cursor1Chan = this.params.get('cursor1Chan');
        this.cursor2Chan = this.params.get('cursor2Chan');
    }

    //Close modal and save settings if they are changed
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

    //Show cursor settings popover and return data as a navparam on dismiss
    showPopover(event, type: string) {
        let popover;
        if (type === 'cursorType') {
            popover = this.popoverCtrl.create(GenPopover, {
                dataArray: this.cursorTypeArray
            });
        }
        else if (type === 'cursor1Chan' || 'cursor2Chan') {
            popover = this.popoverCtrl.create(GenPopover, {
                dataArray: this.cursorChanArray
            });
        }
        else {
            console.log('error in show popover');
        }

        popover.present({
            ev: event
        });
        popover.onDidDismiss(data=> {
            if (type === 'cursorType') {
                this.cursorType = data.option
            }
            else if (type === 'cursor1Chan') {
                this.cursor1Chan = data.option;
            }
            else if (type === 'cursor2Chan') {
                this.cursor2Chan = data.option;
            }
            else {
                console.log('error in show popover handler');
            }
        });
    } 
    
}