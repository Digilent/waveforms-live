import { NavParams, ViewController, Platform, PopoverController } from 'ionic-angular';
import { Component, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Subject';

//Components
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';

//Interfaces
import { Chart } from 'digilent-chart-angular2/modules';

@Component({
    templateUrl: 'cursor-popover.html'
})
export class CursorPopoverComponent {
    @ViewChild('typeDropPop') typeDropPop: DropdownPopoverComponent;
    @ViewChild('c1DropPop') c1DropPop: DropdownPopoverComponent;
    @ViewChild('c2DropPop') c2DropPop: DropdownPopoverComponent;
    public cursorTypeArray: CursorType[] = ['disabled', 'time', 'track', 'voltage'];
    public chart: Chart;
    public cursorSelection: Subject<CursorSelection> = new Subject<CursorSelection>();
    public availableChans: string[] = [];
    private passData: CursorPassData;
    private selectedData: CursorSelection;

    constructor(
        private platform: Platform,
        private viewCtrl: ViewController,
        private params: NavParams,
        private popoverCtrl: PopoverController
    ) {
        this.passData = this.params.get('passData');
        this.selectedData = {
            currentChannels: this.passData.currentChannels,
            currentType: this.passData.currentType
        }
        this.generateOptions();
    }

    private generateOptions() {
        this.passData.availableChannels.forEach((channelInfo: CursorChannel) => {
            this.availableChans.push(
                channelInfo.instrument + ' Ch ' + channelInfo.channel
            );
        });
    }

    ngOnInit() {
        this.setCurrentValuesInDropdown();
    }

    setCurrentValuesInDropdown() {
        this.typeDropPop.setActiveSelection(this.selectedData.currentType);
        this.c1DropPop.setActiveSelection(this.selectedData.currentChannels.c1.instrument + ' Ch ' + this.selectedData.currentChannels.c1.channel);
        this.c2DropPop.setActiveSelection(this.selectedData.currentChannels.c2.instrument + ' Ch ' + this.selectedData.currentChannels.c2.channel);
    }

    cursorTypeSelect(event) {
        console.log(event);
        this.selectedData.currentType = event;
        this.cursorSelection.next(this.selectedData);
    }

    availableChannelSelect(event, channel: number) {
        let parsedData = this.extractInstrumentAndChannel(event);
        if (channel === 1) {
            this.selectedData.currentChannels.c1 = parsedData;
        }
        else {
            this.selectedData.currentChannels.c2 = parsedData;
        }
        this.cursorSelection.next(this.selectedData);
    }

    private extractInstrumentAndChannel(selectionString: string): CursorChannel {
        let splitArray = selectionString.split(' ');
        return {
            instrument: splitArray.slice(0, splitArray.length - 2).join(' '),
            channel: parseInt(splitArray[splitArray.length - 1])
        }
    }

}

export interface CursorChannel {
    instrument: string,
    channel: number
}

export interface CursorPassData extends CursorSelection {
    availableChannels: CursorChannel[]
}

export interface CursorSelection {
    currentChannels: {
        c1: CursorChannel,
        c2: CursorChannel
    },
    currentType: CursorType
}

export type CursorType = 'disabled' | 'time' | 'track' | 'voltage';