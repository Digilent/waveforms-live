import { Injectable } from '@angular/core';

@Injectable()
export class UtilityService {

    constructor() {
        
    }

    parseBaseNumberVal(event): number {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);
        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
        return trueValue;
    }

    public transformModelToPropKey(deviceModel: string): string {
        let model: string[] = deviceModel.toLowerCase().split(" ");
        
        model[1] = model[1].charAt(0).toUpperCase() + model[1].slice(1);
        
        return model.join("");
    }

    public getShortName(deviceModel: string): string {
        let name = '';

        switch(deviceModel) {
            case 'OpenScope MZ':
                name = 'osmz';
                break;
            case 'OpenLogger MZ':
                name = 'olmz';
                break;
            default:
                name = 'osmz';
                break;
        }

        return name;
    }
}