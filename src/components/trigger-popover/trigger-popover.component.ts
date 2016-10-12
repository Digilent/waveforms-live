import {Component} from '@angular/core';
import {ViewController, NavParams, PopoverController} from 'ionic-angular';

//Components
import {TriggerComponent} from '../trigger/trigger.component';
import {GenPopover} from '../gen-popover/gen-popover.component';

@Component({
  templateUrl: 'trigger-popover.html'
})

export class TriggerPopover {
    public triggerComponent: TriggerComponent;
    public seriesNum: number;
    public viewCtrl: ViewController;
    public params: NavParams;
    public popoverCtrl: PopoverController;

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
        let customCallback;
        if (type === 'trigger') {
            customCallback = function(option: string) {
                this.triggerComponent.triggerType = option;
            }.bind(this);
            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: ['Edge']
            });
        }
        else if (type === 'source') {
            let chanArray = [];
            for (let i = 0; i < this.triggerComponent.activeDevice.instruments.osc.numChans; i++) {
                chanArray.push('Osc ' + (i + 1));
            }
            /*for (let i = 0; i < this.triggerComponent.activeDevice.instruments.la.numChans; i++) {
                chanArray.push('La ' + (i + 1));
            }*/
            chanArray.push('Ext');

            customCallback = function(option: string) {
                this.triggerComponent.triggerSource = option;
            }.bind(this);

            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: chanArray
            });
        }
        else if (type === 'edge') {
            customCallback = function(option: string) {
                if (option !== this.triggerComponent.edgeDirection) {
                    this.triggerComponent.setTrigType();
                }
            }.bind(this);
            genPopover = this.popoverCtrl.create(GenPopover, {
                dataArray: ['Rising', 'Falling']
            });
        }
        else {
            console.log('error in show popover');
        }

        genPopover.present({
            ev: event
        });

        genPopover.onDidDismiss((data) => {
            if (data === null) {return;}
            console.log(data);
            let selection = data.option.toLowerCase();
            customCallback(selection);
        });
    }
}