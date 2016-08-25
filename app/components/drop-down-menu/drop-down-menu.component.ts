/******************************************************************************
* Drop-Down Menu - Digilent Ionic2 Utilities
* 
* Source: https://github.com/Digilent/ionic2-components
* Copyright (c) 2016, Digilent <www.digilent.com> 
****************************************************************************/

import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
    templateUrl: 'build/components/drop-down-menu/drop-down-menu.html',
    selector: 'drop-down-menu',
    directives: []
})

export class DropDownMenu {

    private showEnabled: boolean = false;
    //private itemNames: Array<string> = ['one', 'two', 'three'];
    private selectedIndex: number = 0;
    public selectedValue: string = '';
    private bodyRef = document.body;

    private boundCloseListener = this.closeListener.bind(this);


    @Input() itemNames: Array<string> = [];
    @Output() valueChange = new EventEmitter();

    constructor() {
        //console.log('DropDownMenu Constructor');
        this.selectedValue = this.itemNames[0];
    }

    toggleShow() {
        this.showEnabled = !this.showEnabled;

        //If menu is now open, listen for mouse click
        if (this.showEnabled) {           
            this.bodyRef.addEventListener('click', this.boundCloseListener, true);
        } else {
            this.removeCloseListener();
        }
    }

    //Remove the callback that fires when the drop down is closed
    removeCloseListener(){
        this.bodyRef.removeEventListener('click', this.boundCloseListener, true);
    }

    closeListener() {
        console.log('click');
        this.showEnabled = false;
    }   

    onItemSelected(itemIndex: number) {
        this.selectedIndex = itemIndex;
        this.selectedValue = this.itemNames[itemIndex];
        this.showEnabled = false;
        this.valueChange.emit({ value: this.selectedValue });
    }



} 