import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PopoverController, Platform } from 'ionic-angular';

//Components
import { GenPopover } from '../gen-popover/gen-popover.component';

@Component({
    templateUrl: 'dropdown-popover.html',
    selector: 'dropdown-popover'
})

export class DropdownPopoverComponent {
    @Input() dataArray: string[];
    @Output() onSelection = new EventEmitter();
    public popoverCtrl: PopoverController;
    public platform: Platform;
    public isMobile: boolean;
    public currentlySelected: string;

    constructor(
        _popoverCtrl: PopoverController,
        _platform: Platform
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.isMobile = this.platform.is('android') || this.platform.is('ios');
    }

    ngOnInit() {
        this.currentlySelected = this.dataArray[0];
    }

    selectionChange(event) {
        this.onSelection.emit(event.target.value);
        this.currentlySelected = event.target.value;
    }

    openGenPopover(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: this.dataArray
        });
        popover.present({
            ev: event
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            this.currentlySelected = data.option;
            this.onSelection.emit(data.option);
        });
    }
}