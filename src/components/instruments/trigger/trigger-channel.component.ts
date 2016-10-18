import {Injectable} from '@angular/core';

@Injectable()
export class TriggerChannelComponent {

    constructor(triggerChannelDescriptor: any) {       
        console.log(triggerChannelDescriptor);
    }
}