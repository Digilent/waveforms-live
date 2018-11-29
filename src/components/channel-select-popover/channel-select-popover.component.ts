import { Component } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';

@Component({
  selector: 'channel-select-popover',
  templateUrl: 'channel-select-popover.html'
})
export class ChannelSelectPopover {
  private selectedChannels: boolean[];

  constructor(
    private viewCtrl: ViewController,
    private params: NavParams,
    private events: Events
  ) {
    this.selectedChannels = this.params.get('selectedChannels');
  }

  close() {
    this.viewCtrl.dismiss();
  }

  toggleChannel(index: number) {
    this.selectedChannels[index] = !this.selectedChannels[index];
    this.events.publish('channels:selected', { analogChans: this.selectedChannels });
  }
}
