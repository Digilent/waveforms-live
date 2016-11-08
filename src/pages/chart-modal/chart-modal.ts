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

    //This is required since updating the axis changes the references
    reattachReferences() {
        this.chart.triggerPlotLine = this.chart.chart.xAxis[0].plotLinesAndBands[0];
        for (let i = 0; i < this.chart.numXCursors; i++) {
            this.chart.cursorRefs[i] = this.chart.chart.xAxis[0].plotLinesAndBands[i + 1];
        }
        for (let i = 0; i < this.chart.numYCursors; i++) {
            let lineNum = this.chart.chart.yAxis[this.chart.activeChannels[i]].plotLinesAndBands.length - 1;
            this.chart.cursorRefs[i + 2] = this.chart.chart.yAxis[this.chart.activeChannels[i]].plotLinesAndBands[lineNum * i];
        }
        if (this.chart.timelineView) {
            let length = this.chart.timelineChart.xAxis[0].plotLinesAndBands.length;
            if (this.chart.cursorType === 'time' || this.chart.cursorType === 'track') {
                for (let i = 0; i < 2; i++) {
                    this.chart.timelineCursorRefs[i] = this.chart.timelineChart.xAxis[0].plotLinesAndBands[length - 1 - ((i + 1) % 2)];
                }
            }
            else if (this.chart.cursorType === 'voltage') {
                for (let i = 0; i < 2; i++) {
                    this.chart.timelineCursorRefs[i + 2] = this.chart.timelineChart.yAxis[0].plotLinesAndBands[i];
                }
            }
        }
    }

    openColorPicker(event, type: string) {
        this.colorPickType = type;
        console.log(this.chart.numXCursors, this.chart.numYCursors, this.chart.cursorRefs);
        this.colorPickerRef.removeEventListener('input', this.colorPickCallbackRef);
        this.colorPickCallbackRef = this.colorPickerRef.addEventListener('input', (event: any) => {
            let color = event.target.value;
            if (this.colorPickType === 'chart-background') {
                console.log('chart-background');
                console.log(this.chart.cursorRefs);
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
                console.log(this.chart.cursorRefs);
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
                console.log(this.chart.cursorRefs);
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
            this.reattachReferences();
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
        this.reattachReferences();
    }

}