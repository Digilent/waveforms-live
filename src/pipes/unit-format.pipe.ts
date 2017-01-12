import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'unitFormat'
})
export class UnitFormatPipe implements PipeTransform {

    transform(value: number, baseUnit: string): string {
        if (typeof(value) === 'string') {
            value = parseFloat(value);
        }
        if (value == 0 || Math.abs(value) < 1e-15) {
            return '0.000 ' + baseUnit;
        }
        let i = 0;
        let unit: string = ' ';

        if (Math.abs(value) < 1) {
            while (Math.abs(value) < 1 && i < 3) {
                i++;
                value = value * 1000;
            }

            if (i == 0) {
                unit = ' ';
            }
            else if (i == 1) {
                unit = ' m';
            }
            else if (i == 2) {
                unit = ' u';
            }
            else if (i == 3) {
                unit = ' n';
            }
        }
        else if (Math.abs(value) >= 1000) {
            while (Math.abs(value) >= 1000 && i < 3) {
                i++;
                value = value / 1000;
            }

            if (i == 0) {
                unit = ' ';
            }
            else if (i == 1) {
                unit = ' k';
            }
            else if (i == 2) {
                unit = ' M';
            }
            else if (i == 3) {
                unit = ' G';
            }
        }
        let valueCopyString = value.toString();
        let maxStringLength = value < 0 ? 5 : 4;
        let numDigitsBeforeDecimal = valueCopyString.indexOf('.');
        numDigitsBeforeDecimal = numDigitsBeforeDecimal === -1 ? valueCopyString.length : numDigitsBeforeDecimal;
        let toFixedParam = maxStringLength - numDigitsBeforeDecimal;
        toFixedParam = toFixedParam < 0 ? 0 : toFixedParam;

        valueCopyString = value.toFixed(toFixedParam);

        return valueCopyString + unit + baseUnit;
    }
}