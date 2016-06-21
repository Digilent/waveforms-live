import {Component} from '@angular/core';

@Component({
})
export class LaChannelComponent {

    public name: string;

    constructor(_oscChannelDescriptor: any) {       
        this.name = _oscChannelDescriptor.name;

    }
}