import { Component } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';

import * as math from 'mathjs';
import { ToastService } from "../../services/toast/toast.service";

/**
 * LogScalePopover accepts a math expression string to convert the voltage into a more domain
 * specific unit, (ie Fahrenheit for an application measuring temperature).
 * 
 * If the user specifies a unit to convert to, the chart y-axis ticks are updated
 * to use the new unit, and data received from the device is transformed
 * (this bit could really be a service, yeah?) from voltage
 * to the new unit.
 */
@Component({
  selector: 'log-scale-popover',
  templateUrl: 'log-scale-popover.html'
})
export class LogScalePopover {
  private channel: number;
  private name: string;
  private expressionString: string = 'v';
  private unitDescriptor: string = 'V';

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private events: Events,
    private toastCtrl: ToastService
  ) {
    this.channel = this.navParams.data.channel;

    // TODO: get values from storage when existing option is selected
  }
  
  public signalUpdate() {
    return new Promise((resolve, reject) => {
      this.validateExpression();

      if (this.verifyExpression()) {
        try {
          let expression = math.eval(`f(v)=${this.expressionString}`);

          expression(2); // note(andrew): test that we can actually use the expression here

          let scaleObj = {
            channel: this.channel,
            name: this.name,
            expression: expression,
            unit: this.unitDescriptor
          };
          resolve(scaleObj);
        }
        catch (err) {
          console.log(err);
          reject();
        }
      } else {
        reject();
      }
    });
  }

  close() {
    this.viewCtrl.dismiss();
  }

  save() {
    if (!this.name) {
      this.toastCtrl.createToast("scaleInvalidName", true);
      return;
    }

    this.signalUpdate()
      .then((scaleObj) => {
        // TODO: add name to dropdown list and save to local storage

        this.events.publish('scale:update', scaleObj);
        this.close();
      })
      .catch(() => {
        this.toastCtrl.createToast("scaleInvalidExpression", true);
      });
  }

  delete() {
    // TODO: remove name from dropdown list and remove from local storage

    this.close();
  }

  public validateExpression() {
    if (this.expressionString === "") this.expressionString = "v";
    if (this.unitDescriptor === "") this.unitDescriptor = "V";
  }

  public verifyExpression(): boolean {
    return this.expressionString.includes("v") && this.unitDescriptor.length === 1;
  }
}