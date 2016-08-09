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
    abstract writeReadBinary(endpoint: string, sendData: Object) : Observable<any>;
    abstract streamFrom(endpoint: string, sendData: Object, delay?: number) : Observable<any>;
    abstract stopStream(): void;
        
    //Update the URI used by the transport
    setUri(_rootUri: string)
    {
        this.rootUri = _rootUri;
    }
    
    getType() {
        return 'Parent';
    }
}