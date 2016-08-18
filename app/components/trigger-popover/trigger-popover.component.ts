import {Component} from '@angular/core';
import {ViewController, NavParams, PopoverController} from 'ionic-angular';

//Components
import {TriggerComponent} from '../trigger/trigger.component';
import {GenPopover} from '../gen-popover/gen-popover.component';

@Component({
  templateUrl: 'build/components/trigger-popover/trigger-popover.html'
})

export class TriggerPopover {
    private triggerComponent: TriggerComponent;
    private seriesNum: number;
    private viewCtrl: ViewController;
    private params: NavParams;
    private popoverCtrl: PopoverController;

    constructor(
        _viewCtrl: ViewController, 
        _params: NavParams,
        _popoverCtrl: PopoverController
    ) {
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.popoverCtrl = _popoverCtrl;
        this.triggerComponent = this.params.get('triggerComponent');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }

    showGenPopover(event, type: string) {
        let genPopover;
        if (type === 'trigger') {
            console.log('hey');
            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: ['edge', 'dink']
            });
        }
        else if (type === 'source') {
            console.log('hey');
            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: ['OSC 1', 'OSC 2', 'LA 1']
            });
        }
        else if (type === 'edge') {
            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: ['Rising', 'Falling']
            });
        }
        else {
            console.log('error in show popover');
        }
        console.log(genPopover);
        genPopover.present({
            ev: event
        });
        genPopover.onDidDismiss(data=> {
            console.log(data);
        });
    }
}