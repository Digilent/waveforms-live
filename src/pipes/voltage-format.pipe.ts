import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'voltageFormat'
})
export class VoltageFormatPipe implements PipeTransform {

    transform(voltageInVolts: number): string {
        if (voltageInVolts === 0) {
            return '0.000 V';
        }
        let i = 0;
        let unit: string = ' V';

        while (Math.abs(voltageInVolts) < 1 && i < 3) {
            i++;
            voltageInVolts = voltageInVolts * 1000;
        }

        let valueCopyString = voltageInVolts.toString();
        let maxStringLength = voltageInVolts < 0 ? 5 : 4;
        let numDigitsBeforeDecimal = valueCopyString.indexOf('.');
        numDigitsBeforeDecimal = numDigitsBeforeDecimal === -1 ? valueCopyString.length : numDigitsBeforeDecimal;
        let toFixedParam = maxStringLength - numDigitsBeforeDecimal;
        toFixedParam = toFixedParam < 0 ? 0 : toFixedParam;

        valueCopyString = voltageInVolts.toFixed(toFixedParam);

        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }
        return valueCopyString + unit;
    }
}