import { Component } from '@angular/core';
import { ViewController, NavParams, Events } from 'ionic-angular';

@Component({
  selector: 'channel-select-popover',
  templateUrl: 'channel-select-popover.html'
})
export class ChannelSelectPopover {
  private selectedChannels: boolean[];
  private colorArray: string[];

  constructor(
    private viewCtrl: ViewController,
    private params: NavParams,
    private events: Events
  ) {
    this.selectedChannels = this.params.get('selectedChannels');
    this.colorArray = this.params.get('colorArray');
  }

  close() {
    this.viewCtrl.dismiss();
  }

  toggleChannel(index: number) {
    this.selectedChannels[index] = !this.selectedChannels[index];
    this.events.publish('channels:selected', { channels: this.selectedChannels });
  }
}
