import { Component, EventEmitter, Input, Output, ElementRef } from '@angular/core';
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
    public noArrayMessage: string = 'None';
    public elementRef: ElementRef;
    public viewInitialized: boolean = false;
    public awaitingViewInit: {waiting: boolean, value: string} = {waiting: false, value: ''};

    constructor(
        _popoverCtrl: PopoverController,
        _elementRef: ElementRef,
        _platform: Platform
    ) {
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.elementRef = _elementRef;
        this.isMobile = this.platform.is('android') || this.platform.is('ios');
    }

    ngAfterViewInit() {
        this.viewInitialized = true;
        if (this.dataArray) {
            this.currentlySelected = this.dataArray[0];
        }
        else {
            this.currentlySelected = this.noArrayMessage;
            this.dataArray = [this.noArrayMessage];
        }
        if (this.awaitingViewInit.waiting && this.currentlySelected !== this.noArrayMessage) {
            this._applyActiveSelection(this.awaitingViewInit.value);
        }
    }

    ngOnChanges(changes: any) {
        if (changes.dataArray && changes.dataArray.currentValue && changes.dataArray.currentValue.length > 0) {
            this.currentlySelected = changes.dataArray.currentValue[0];
            if (this.awaitingViewInit.waiting) {
                setTimeout(() => {
                    //Let ngfor propagate select options
                    this._applyActiveSelection(this.awaitingViewInit.value);
                }, 20);
            }
        }
    }

    selectionChange(event) {
        this.onSelection.emit(event.target.value);
        this.currentlySelected = event.target.value;
    }

    setActiveSelection(value: string) {
        if (this.viewInitialized && this.currentlySelected !== this.noArrayMessage) {
            this._applyActiveSelection(value);
        }
        else {
            this.awaitingViewInit.value = value;
            this.awaitingViewInit.waiting = true;
        }
    }

    _applyActiveSelection(value: string) {
        this.awaitingViewInit.waiting = false;
        this.currentlySelected = value;
        if (!this.isMobile) {
            this.elementRef.nativeElement.children[0].children[0].children[0].value = value;
        }
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