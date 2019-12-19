import { Component } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';

// Services
import { ToastService } from "../../services/toast/toast.service";
import { ScalingService } from '../../services/scaling/scaling.service';

//Interfaces
import { ScaleParams } from '../../services/scaling/scaling.service';

/**
 * LogScalePopover accepts a math expression string to convert the voltage into a more domain
 * specific unit, (ie Fahrenheit for an application measuring temperature).
 * 
 * If the user specifies a unit to convert to, the chart y-axis ticks are updated to use the
 * new unit, and data received from the device is transformed from voltage to the new unit.
 */
@Component({
  selector: 'log-scale-popover',
  templateUrl: 'log-scale-popover.html'
})
export class LogScalePopover {
  private channel: number;
  private name: string = "";
  private savedName: string;
  private expressionString: string = "";
  private unitDescriptor: string = "";
  private allScalingOptions: ScaleParams[] = [];

  public scalingTutorialLink = 'https://reference.digilentinc.com/learn/instrumentation/tutorials/openlogger/datalogger#section9'

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private events: Events,
    private toastService: ToastService,
    private scalingService: ScalingService
  ) {
    this.channel = this.navParams.data.channel;
    let scaleName = this.navParams.data.scaleName;
    if (scaleName !== 'None') {
      this.name = scaleName;
      this.savedName = scaleName;
    }

    this.scalingService.getAllScalingOptions()
      .then((result: ScaleParams[]) => {
        if (result) {
          this.allScalingOptions = result;

          if (this.savedName) {
            let selected = this.allScalingOptions.filter((option) => {
              return option.name === this.savedName;
            })[0];
            this.expressionString = selected['expressionString'];
            this.unitDescriptor = selected['unitDescriptor'];
          }
        }
      })
      .catch(() => {
        console.log('error loading scale info');
        this.toastService.createToast('loggerScaleLoadErr', true, undefined, 5000);
      });
  }

  public evaluateParams() {
    return new Promise((resolve, reject) => {
      this.scalingService.evaluateExpression(this.expressionString, this.unitDescriptor)
        .then((expression) => {
          let params: ScaleParams = {
            name: this.name,
            expressionString: this.expressionString,
            unitDescriptor: this.unitDescriptor,
            expression: expression
          }
          resolve(params);
        })
        .catch(() => {
          reject();
        })
    });
  }

  close() {
    this.viewCtrl.dismiss();
  }

  save() {
    if (this.name == "") {
      this.toastService.createToast("scaleInvalidName", true);
      return;
    }

    this.evaluateParams()
      .then((params: ScaleParams) => {
        // save new scale function to storage
        let index = this.allScalingOptions.map(option => option.name).indexOf(this.name);
        if (index !== -1) {
          this.allScalingOptions[index] = params;
        } else {
          this.allScalingOptions.push(params);
        }
        this.scalingService.saveScalingOptions(this.allScalingOptions);

        this.events.publish('scale:update', { params: params, channel: this.channel });
        this.close();
      })
      .catch(() => {
        this.toastService.createToast("scaleInvalidExpression", true);
      });
  }

  delete() {
    // remove function from storage
    let index = this.allScalingOptions.map(option => option.name).indexOf(this.savedName);
    if (index !== -1) {
      this.allScalingOptions.splice(index, 1);
    } else {
      this.toastService.createToast("loggerScaleLoadErr", true);
      return;
    }

    this.scalingService.saveScalingOptions(this.allScalingOptions);

    let scaleObj = {
      channel: this.channel,
      name: this.savedName
    };
    this.events.publish('scale:delete', scaleObj);
    this.close();
  }

}