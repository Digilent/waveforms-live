import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { CloudLoggingService } from '../../services/cloud-logging/cloud-logging.service';
import { ToastService } from '../../services/toast/toast.service';

//Interfaces
import { CloudLoggingParams } from '../../services/cloud-logging/cloud-logging.service';

@Component({
  selector: 'cloud-logging-popover',
  templateUrl: 'cloud-logging-popover.html'
})
export class CloudLoggingPopover {

  private activeDevice: DeviceService;
  public params: CloudLoggingParams;
  public sampleFreqLimit: number = 60;

  constructor(
    public viewCtrl: ViewController,
    public deviceManagerService: DeviceManagerService,
    public cloudLoggingService: CloudLoggingService,
    public toastService: ToastService
  ) {
    this.activeDevice = this.deviceManagerService.getActiveDevice();
  }

  ngOnInit() {
    this.params = this.cloudLoggingService.getSavedParams(this.activeDevice);
  }

  close() {
    this.viewCtrl.dismiss();
  }

  formatInputAndUpdate(newVal: number, instrument: 'analog' | 'digital') {
    let chans = this.activeDevice.instruments.logger[instrument].chans;
    for (let i = 0; i < chans.length; i++) {
      let minFreq = chans[i].sampleFreqMin * chans[i].sampleFreqUnits;
      let maxFreq = chans[i].sampleFreqMax * chans[i].sampleFreqUnits;
      if (newVal < minFreq) {
        newVal = minFreq;
      } else if (newVal > maxFreq) {
        newVal = maxFreq;
      }
    }
    this.params.sampleFreq = newVal;
  }

  toggleAnalogChannel(index: number) {
    this.params.analogChans[index] = !this.params.analogChans[index];
  }

  enableLogging() {
    if (!this.params.apiKey) {
      this.toastService.createToast('cloudLoggerInvalidKey', true);
    }
    else if (!this.params.channelId) {
      this.toastService.createToast('cloudLoggerInvalidChannelId', true);
    }    
    else if (isNaN(this.params.sampleFreq)) {
      this.toastService.createToast('cloudLoggerInvalidSamples', true);
    }
    else if (this.params.sampleFreq > this.sampleFreqLimit) {
      this.toastService.createToast('cloudLoggerMaxSampleFreq', true);
    }
    else if (!this.params.analogChans.find((chan) => { return chan })) {
      this.toastService.createToast('cloudLoggerInvalidChannels', true);
    }
    else {
      this.viewCtrl.dismiss().then(() => {
        this.cloudLoggingService.saveAndEnable(this.params);
      });
    }
  }

  disableLogging() {
    this.viewCtrl.dismiss().then(() => {
      this.cloudLoggingService.disable();
    });
  }

}