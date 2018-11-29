import { Pipe } from "@angular/core";

@Pipe({
    name: 'averageFormat'
})
export class FormatAverageDirective {
    transform(value: number, unit: string): string {
        if (value === undefined) return '';

        if (value > 1) unit += 's';

        return `${value} ${unit}`;
    }
}