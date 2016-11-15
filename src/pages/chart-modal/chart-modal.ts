import { NavParams, ViewController, Platform } from 'ionic-angular';
import { Component } from '@angular/core';

//Components
import { SilverNeedleChart } from '../../components/chart/chart.component';

@Component({
    templateUrl: "chart-modal.html"
})

export class ChartModalPage {
    public chartComponent: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public chart: SilverNeedleChart;
    public colorPickerRef: HTMLElement;
    public colorPickType: string;
    public currentColors: string[] = [];
    public colorPickCallbackRef: any;

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.chart = this.params.get('chartComponent');
        this.currentColors[0] = this.chart.chart.chartBackground.element.attributes.fill.value;
        this.currentColors[1] = this.chart.chart.options.yAxis[0].title.style.color;
        this.currentColors[2] = this.chart.chart.options.yAxis[0].gridLineColor
    }

    ngOnInit() {
        this.colorPickerRef = document.getElementById('chart-modal-color-picker');
    }


    //Export series as csv with file name 'myData'
    exportChart() {
        this.chart.exportCsv('myData');
    }

    openColorPicker(event, type: string) {
        this.colorPickType = type;
        this.colorPickerRef.removeEventListener('input', this.colorPickCallbackRef);
        this.colorPickCallbackRef = this.colorPickerRef.addEventListener('input', (event: any) => {
            let color = event.target.value;
            if (this.colorPickType === 'chart-background') {
                this.chart.chart.chartBackground.attr({
                    fill: event.target.value
                });
                this.chart.timelineChart.chartBackground.attr({
                    fill: event.target.value
                });
                this.currentColors[0] = color;
                console.log(this.currentColors[0]);
            }
            else if (this.colorPickType === 'font') {
                console.log('font');
                this.chart.chart.yAxis[0].update({
                    labels: {
                        style: {
                            color: color
                        }
                    },
                    title: {
                        style: {
                            color: color
                        }
                    }
                }, true);
                this.chart.chart.xAxis[0].update({
                    labels: {
                        style: {
                            color: color
                        }
                    },
                    title: {
                        style: {
                            color: color
                        }
                    }
                }, true);
                console.log(this.chart.chart);
                this.currentColors[1] = color;
            }
            else if (this.colorPickType === 'grid') {
                console.log('grid');
                this.chart.chart.yAxis[0].update({
                    gridLineColor: color
                }, true);
                this.chart.chart.xAxis[0].update({
                    gridLineColor: color,
                    tickColor: color,
                    minorTickColor: color,
                    lineColor: color
                }, true);
                this.currentColors[2] = color;
            }
        });
        this.colorPickerRef.click();
    }

    close() {
        this.viewCtrl.dismiss();
    }

    applyDefaultColors() {
        let chartBackgroundColor = 'black';
        let everyOtherColor = '#666666';
        this.chart.chart.chartBackground.attr({
            fill: chartBackgroundColor
        });
        this.chart.timelineChart.chartBackground.attr({
            fill: chartBackgroundColor
        });
        this.currentColors[0] = chartBackgroundColor;
        this.chart.chart.yAxis[0].update({
            labels: {
                style: {
                    color: everyOtherColor
                }
            },
            title: {
                style: {
                    color: everyOtherColor
                }
            }
        }, true);
        this.chart.chart.xAxis[0].update({
            labels: {
                style: {
                    color: everyOtherColor
                }
            },
            title: {
                style: {
                    color: everyOtherColor
                }
            }
        }, true);
        this.currentColors[1] = everyOtherColor;
        this.chart.chart.yAxis[0].update({
            gridLineColor: everyOtherColor
        }, true);
        this.chart.chart.xAxis[0].update({
            gridLineColor: everyOtherColor,
            tickColor: everyOtherColor,
            minorTickColor: everyOtherColor,
            lineColor: everyOtherColor
        }, true);
        this.currentColors[2] = everyOtherColor;
    } 

}