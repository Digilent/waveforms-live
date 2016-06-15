import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Component({
})
export abstract class TransportComponent {

    protected rootUri: string;
    
    constructor() {
        console.log('Generic Transport Contructor');
    }

    abstract writeRead(endpoint: string, sendData: Object) : Observable<any>;
    
    //Update the URI used by the transport
    setUri(_rootUri: string)
    {
        this.rootUri = _rootUri;
    }
    
    getType() {
        return 'Parent';
    }
}