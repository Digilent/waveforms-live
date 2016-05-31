import {Component} from 'angular2/core';

//Services
import {TransportService} from '../../services/transport/transport.service';

@Component({  
})
export class DeviceComponent {
    
    public name: string;
    constructor(_name:string)
    {
        console.log('Device Contructor');
        
        this.name = _name;                
    }
}