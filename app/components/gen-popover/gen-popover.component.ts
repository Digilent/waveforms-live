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
          this.dataArray = this.params.get('dataArray');  
    }

    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }
}