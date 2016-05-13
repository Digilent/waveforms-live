import { Component } from 'angular2/core';
import { CHART_DIRECTIVES } from 'angular2-highcharts';

@Component({
    selector: 'silverNeedleChart',
    directives: [CHART_DIRECTIVES],
    templateUrl: 'build/components/chart/chart.html',
})
export class SilverNeedleChart {
    public chart: Object;
    private options: Object;

    constructor() {
        this.options = {
           chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false,
           },
            series: [{
                data: [29.9, 71.5, 106.4, 129.2],
            }]
        };
    }


    //Called once on component load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;
        
        //Redraw chart to scale chart to container size
        this.redrawChart()
    }
    
    /*
    ngAfterViewChecked()
    {
        console.log('AfterViewChecked');
        if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('reflew!');
        }
    }
    */
    
    redrawChart()
    {
      if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('redrawChart()');
        }  
    }
    
}