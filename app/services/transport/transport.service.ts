import {Injectable} from 'angular2/core';

@Injectable()
export class TransportService {
     
    constructor()
    {
        console.log('Transport Service Parent Constructor');        
    }
    
    getType()
    {
        return 'Parent';
    }
}