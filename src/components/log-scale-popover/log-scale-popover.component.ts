import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'log-scale-popover',
  templateUrl: 'log-scale-popover.html'
})
export class LogScalePopover {

  constructor(
    private viewCtrl: ViewController
  ) {
  }

  close() {
    this.viewCtrl.dismiss();
  }

  save() {
    this.close();
  }

  delete() {
    this.close();
  }
}