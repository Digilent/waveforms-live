import { Injectable } from '@angular/core';

@Injectable()
export class DeviceDataTransferService {

    public triggerLevel: number = 0.5;
    public triggerSource: string = 'Osc Ch 1';
    public awgPower: boolean = false;
    public laChanActive: boolean = false;

    constructor() {
        
    }

}