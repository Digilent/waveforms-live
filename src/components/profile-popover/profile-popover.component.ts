import { Component } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';

//Services
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'profile-popover',
  templateUrl: 'profile-popover.html'
})
export class ProfilePopover {
  public profileName: string;
  public initialName: string;
  public saveChart: boolean = false;
  public saveDaq: boolean = true;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public events: Events,
    private toastService: ToastService
  ) {
    this.profileName = this.navParams.data.profileName;
    this.initialName = this.profileName;
    if (this.navParams.data.profileObj) {
      this.saveChart = this.navParams.data.profileObj.chart !== undefined;
      this.saveDaq = this.navParams.data.profileObj.daq !== undefined;
    }
  }

  deleteProfile() {
    this.events.publish('profile:delete', ({ profileName: this.profileName }));
    this.viewCtrl.dismiss();
  }

  saveProfile() {
    if (this.profileName.trim() == '') {
      this.toastService.createToast('loggerProfileNameRequired', true, undefined, 5000);
    } else {
      this.events.publish('profile:save', ({ profileName: this.profileName, saveChart: this.saveChart, saveDaq: this.saveDaq }));
      this.viewCtrl.dismiss();
    }
  }

}
