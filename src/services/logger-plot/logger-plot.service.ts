import { Injectable } from '@angular/core';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';

//Interfaces
import { DataContainer } from '../../components/chart/chart.interface';

@Injectable()
export class LoggerPlotService {
    private digilentChart: DigilentChart;

    constructor() {

    }

    init(chartRef: DigilentChart) {
        this.digilentChart = chartRef;
    }

    setData(data: DataContainer[], autoscale?: boolean) {
        this.digilentChart.setData(data, autoscale);
    }
}