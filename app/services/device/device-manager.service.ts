import {Injectable} from 'angular2/core';

//Components
import {DeviceComponent} from '../../components/device/device.component';

@Injectable()
export class DeviceManagerService {
    
    public devices: DeviceComponent[] = [];
    public vals = ['a', '2', 'traingle'];
    constructor()
    {
        console.log('Device Manager Service Constructor');
        
        this.devices.push(new DeviceComponent('Device A'));
        this.devices.push(new DeviceComponent('Device B'));       
        console.log(this.devices);
        
        
    }
}