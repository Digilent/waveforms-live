import { Component, Output, ViewChild, EventEmitter } from '@angular/core';

//Components
import { DigilentChart } from '../digilent-chart/digilent-chart.component';

//Interfaces
/*import { Chart, DataContainer } from '../chart/chart.interface';*/

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var $: any;

@Component({
    selector: 'bode-plot',
    templateUrl: 'bode-plot.html'
})

export class BodePlotComponent {
    @ViewChild('bodePlot') bodePlot: DigilentChart;
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    public unitFormatPipeInstance = new UnitFormatPipe();
    public bodePlotOptions: any;
    public colorArray: string[] = ['#FFA500', '#4487BA', '#ff3b99', '#00c864'];

    constructor() {
        this.bodePlotOptions = this.generateBodeOptions();
     }

    plotLoaded() {
        this.bodePlot.setData([{
            data: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]],
            yaxis: 1,
            lines: {
                show: true
            },
            points: {
                show: true
            }
        }], true);
    }
    
    generateBodeOptions() {
        let fftChartOptions = {
            series: {
                lines: {
                    show: true
                }
            },
            legend: {
                show: false
            },
            canvas: true,
            grid: {
                hoverable: true,
                clickable: true,
                autoHighlight: false,
                borderWidth: 0,
                backgroundColor: 'black',
                labelMargin: 15,
                margin: {
                    top: 15,
                    left: 10,
                    right: 27,
                    bottom: 10
                }
            },
            colors: this.colorArray,
            axisLabels: {
                show: true
            },
            tooltip: {
                show: true,
                cssClass: 'flotTip',
                content: (label, xval, yval, flotItem) => {
                    return (this.unitFormatPipeInstance.transform(xval, 'Hz') + ' (' + this.unitFormatPipeInstance.transform(yval, 'V') + ')');
                },
                onHover: (flotItem, tooltipel) => {
                    let color = flotItem.series.color;
                    tooltipel[0].style.borderBottomColor = color;
                    tooltipel[0].style.borderTopColor = color;
                    tooltipel[0].style.borderLeftColor = color;
                    tooltipel[0].style.borderRightColor = color;
                }
            },
            zoomPan: {
                enabled: true
            },
            cursorMoveOnPan: true,
            yaxis: {
                position: 'left',
                axisLabel: '',
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: true,
                tickColor: '#666666',
                font: {
                    color: '#666666'
                }
            },
            xaxis: {
                tickColor: '#666666',
                transform: ((xVal) => {return xVal === 0 ? 0.0001 : Math.log10(xVal)}),
                inverseTransform: ((xVal) => {return xVal === 0.0001 ? 0 : Math.pow(10, xVal)}),
                tickFormatter: ((val, axis) => {return this.unitFormatPipeInstance.transform(val, 'Hz')}),
                font: {
                    color: '#666666'
                }
            }
        }
        return fftChartOptions;
    }
}
