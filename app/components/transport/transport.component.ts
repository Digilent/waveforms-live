import {Component} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Component({  
})
export class TransportComponent {
     
    constructor()
    {
        console.log('Transport Parent Contructor');        
    }
    
    getType()
    {
        return 'Parent';
    }
}