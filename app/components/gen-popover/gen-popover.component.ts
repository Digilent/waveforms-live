import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

@Component({
  template: `
    <ion-item *ngFor="let data of dataArray">
        <button clear (click)="close(data)">{{data}}</button>
    </ion-item>
  `
})

export class GenPopover{
    private dataArray: string[];

    constructor(
        private viewCtrl: ViewController, 
        private params: NavParams
    ) {
        console.log('genpopover constructor');
          this.dataArray = this.params.get('dataArray');  
          console.log(this.dataArray);
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}