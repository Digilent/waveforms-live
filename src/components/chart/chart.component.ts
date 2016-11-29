import { Component, Output, EventEmitter } from '@angular/core';
import { ModalController } from 'ionic-angular';

//Components
import { DeviceComponent } from '../device/device.component';
import { WaveformComponent } from '../data-types/waveform';

//Pages
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { ChartModalPage } from '../../pages/chart-modal/chart-modal';

//Interfaces
import { Chart, CursorPositions } from './chart.interface';

declare var $: any;
declare var mathFunctions: any;
declare var decimateModule: any;

@Component({
    selector: 'silverNeedleChart',
    templateUrl: 'chart.html'
})

export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    public chart: Chart;
    public timelineChart: Chart = null;
    public numXCursors: number = 0;
    public activeSeries: number = 1;
    public numYCursors: number = 0;
    public cursorType: string = 'disabled';
    public cursor1Chan: string = 'Osc 1';
    public cursor2Chan: string = 'Osc 1';
    public cursorsEnabled: boolean = false;
    public activeChannels = [1, 1];
    public mathEnabled: boolean = false;
    public generalVoltsPerDivOpts: string[] = ['1 mV', '2 mV', '5 mv', '10 mV', '20 mV', '50 mV', '100 mV', '200 mV', '500 mV', '1 V', '2 V', '5 V'];
    public activeVPDIndex: number[] = [9, 9];
    public generalVoltsPerDivVals: number[] = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
    public voltsPerDivOpts: string[] = this.generalVoltsPerDivOpts;
    public voltsPerDivVals: number[] = this.generalVoltsPerDivVals;
    public secsPerDivOpts: string[] = ['1 ns', '2 ns', '5 ns', '10 ns', '20 ns', '50 ns', '100 ns', '200 ns', '500 ns', '1 us',
        '2 us', '5 us', '10 us', '20 us', '50 us', '100 us', '200 us', '500 us', '1 ms', '2 ms', '5 ms', '10 ms', '20 ms',
        '50 ms', '100 ms', '200 ms', '500 ms', '1 s', '2 s', '5 s', '10 s'];
    public activeTPDIndex: number = 27;
    public secsPerDivVals: number[] = [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
        0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
        0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
    public timelineView: boolean = false;
    public timeDivision: number = 1;
    public base: number = 0;
    public numSeries: number[];
    public voltDivision: number[] = [1, 1];
    public voltBase: number[] = [0, 0];
    public cursorPositions: Array<CursorPositions> = [{ x: null, y: null }, { x: null, y: null }];
    public modalCtrl: ModalController;
    public currentBufferArray: WaveformComponent[] = [];
    public oscopeChansActive: boolean[] = [];
    public colorArray: string[] = ['orange', '#4487BA', 'ff3b99', '00c864'];
    public deviceDescriptor: DeviceComponent;
    public selectedMathInfo: any = [];
    public seriesDataContainer: any = [];
    public yAxisOptionsContainer: any = [];

    public overSeriesAnchor: any = {
        over: false,
        seriesNum: null
    }
    public seriesAnchorContainer: any[];
    public seriesAnchorVertPanRef: any;
    public seriesAnchorTouchVertPanRef: any;
    public unbindCustomEventsRef: any;
    public seriesAnchorTouchStartRef: any;
    public previousYPos: number;

    constructor(_modalCtrl: ModalController) {
        this.modalCtrl = _modalCtrl;
    }

    ngAfterViewInit() {
        this.seriesAnchorVertPanRef = this.seriesAnchorVertPan.bind(this);
        this.unbindCustomEventsRef = this.unbindCustomEvents.bind(this);
        this.seriesAnchorTouchStartRef = this.seriesAnchorTouchStart.bind(this);
        this.seriesAnchorTouchVertPanRef = this.seriesAnchorTouchVertPan.bind(this);
        let plotArea = $('#flotContainer');
        plotArea.css({
            width: '100%',
            height: '100%'
        });
        this.createChart();
    }

    createTimelineChart(dataObjectArray: any) {
        if (this.timelineChart !== null) { return; }

        let chartRef = this.chart;
        this.timelineChart = $.plot("#timelineContainer", dataObjectArray, {
            series: {
                lines: {
                    show: true
                }
            },
            timelineChart: {
                enabled: true,
                secsPerDivisionValues: [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
                    0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
                    0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
                startingXIndex: 0,

                updateExistingChart: true,
                existingChartRef: chartRef
            },
            cursors: [],
            legend: {
                show: false
            },
            grid: {
                hoverable: true,
                clickable: true,
                autoHighlight: false,
                borderWidth: 0,
                backgroundColor: 'black',
                margin: {
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }
            },
            colors: this.colorArray,
            yaxis: {
                ticks: []
            },
            xaxis: {
                ticks: []
            }
        });

        this.chart.setTimelineRef(this.timelineChart);
        this.chart.setTimelineUpdate(true);

    }

    createChart() {
        let yAxesOptions = this.generateChartOptions();
        this.chart = $.plot("#flotContainer", this.seriesDataContainer, {
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
                    right: 25,
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
                    let xLabel = flotItem.series.xaxis.options.tickFormatter(xval, flotItem.series.xaxis);
                    let yLabel = flotItem.series.yaxis.options.tickFormatter(yval, flotItem.series.yaxis);
                    return xLabel + ' (' + yLabel + ')'; 
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
                enabled: true,
                startingIndex: 21
            },
            cursorMoveOnPan: true,
            yaxes: yAxesOptions,
            xaxis: {
                min: -1,
                max: 1,
                ticks: this.tickGenerator,
                tickFormatter: this.xTickFormatter,
                tickColor: '#666666',
                font: {
                    color: '#666666'
                }
            }
        });

        this.chart.setVoltsPerDivArray(this.voltsPerDivVals);

        this.chart.hooks.drawOverlay.push(this.seriesAnchorsHandler.bind(this));

        $("#flotContainer").bind("panEvent", (event, panData) => {
            if (panData.axis === 'xaxis') {
                this.base = panData.mid;
            }
            else {
                this.voltBase[panData.axisNum - 1] = panData.mid;
            }
        });
        $("#flotContainer").bind("cursorupdates", (event, cursorData) => {
            if (cursorData[0] === undefined || this.cursorType === 'disabled') { return; }
            for (let i = 0; i < cursorData.length; i++) {
                if (cursorData[i].cursor !== 'triggerLine') {
                    let cursorNum = parseInt(cursorData[i].cursor.slice(-1)) - 1;
                    this.cursorPositions[cursorNum].x = cursorData[i].x;
                    this.cursorPositions[cursorNum].y = cursorData[i].y;
                }
            }
        });
        $("#flotContainer").bind("mouseWheelRedraw", (event, wheelData) => {
            if (wheelData.axis === 'xaxis') {
                this.activeTPDIndex = wheelData.perDivArrayIndex;
                this.timeDivision = this.secsPerDivVals[this.activeTPDIndex];
                this.base = wheelData.mid;
            }
            else {
                this.activeVPDIndex[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
                this.voltDivision[wheelData.axisNum - 1] = this.voltsPerDivVals[this.activeVPDIndex[wheelData.axisNum - 1]];
            }
        });

        $("#flotContainer").bind("mousemove", (event) => {
            if (this.numSeries == undefined) { return; }
            let offsets = this.chart.offset();
            let plotRelXPos = event.clientX - offsets.left;
            let plotRelYPos = event.clientY - offsets.top;
            let getAxes = this.chart.getAxes();
            for (let i = 0; i < this.numSeries.length; i++) {
                let yIndexer = 'y' + (this.numSeries[i] === 0 ? '' : (this.numSeries[i] + 1).toString()) + 'axis';
                let seriesAnchorPixPos = getAxes[yIndexer].p2c(this.currentBufferArray[this.numSeries[i]].seriesOffset);
                if (plotRelXPos > -20 && plotRelXPos < 5 && plotRelYPos < seriesAnchorPixPos + 10 && plotRelYPos > seriesAnchorPixPos - 10) {
                    this.overSeriesAnchor = {
                        over: true,
                        seriesNum: this.numSeries[i]
                    }
                    this.chart.getPlaceholder().css('cursor', 'ns-resize');
                    return;
                }
            }
            this.overSeriesAnchor = {
                over: false,
                seriesNum: null
            }
            this.chart.getPlaceholder().css('cursor', 'default');
        });

        $("#flotContainer").bind("mousedown", (event) => {
            if (this.overSeriesAnchor.over) {
                this.chart.unbindMoveEvents();
                this.setActiveSeries(this.overSeriesAnchor.seriesNum + 1);
                $("#flotContainer").bind("mousemove", this.seriesAnchorVertPanRef);
                $("#flotContainer").bind("mouseup", this.unbindCustomEventsRef);
                $("#flotContainer").bind("mouseout", this.unbindCustomEventsRef);
                this.previousYPos = event.clientY;
            }
        });

        $("#flotContainer").bind("touchstart", this.seriesAnchorTouchStartRef);

        //updateChart();
        this.onLoad(this.chart);
    }

    seriesAnchorTouchStart(event) {
        if (this.numSeries == undefined) { return; }
        let offsets = this.chart.offset();
        let plotRelXPos = event.originalEvent.touches[0].clientX - offsets.left;
        let plotRelYPos = event.originalEvent.touches[0].clientY - offsets.top;
        let getAxes = this.chart.getAxes();
        for (let i = 0; i < this.numSeries.length; i++) {
            let yIndexer = 'y' + (this.numSeries[i] === 0 ? '' : (this.numSeries[i] + 1).toString()) + 'axis';
            let seriesAnchorPixPos = getAxes[yIndexer].p2c(this.currentBufferArray[this.numSeries[i]].seriesOffset);
            if (plotRelXPos > -20 && plotRelXPos < 5 && plotRelYPos < seriesAnchorPixPos + 10 && plotRelYPos > seriesAnchorPixPos - 10) {
                this.overSeriesAnchor = {
                    over: true,
                    seriesNum: this.numSeries[i]
                }
                this.chart.unbindMoveEvents();
                this.setActiveSeries(this.overSeriesAnchor.seriesNum + 1);
                $("#flotContainer").bind("touchmove", this.seriesAnchorTouchVertPanRef);
                $("#flotContainer").bind("touchend", this.unbindCustomEventsRef);
                $("#flotContainer").bind("touchleave", this.unbindCustomEventsRef);
                this.previousYPos = event.originalEvent.touches[0].clientY;
                return;
            }
        }
        this.overSeriesAnchor = {
            over: false,
            seriesNum: null
        }
    }

    seriesAnchorsHandler(plot: any, ctx: any) {
        if (this.seriesAnchorContainer == undefined || this.seriesAnchorContainer.length < 1) { return; }
        let offsets = this.chart.offset();
        let getAxes = this.chart.getAxes();
        for (let i = 0; i < this.seriesAnchorContainer.length; i++) {
            let seriesNum = this.seriesAnchorContainer[i].seriesNum;
            let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
            let offsetVal = this.currentBufferArray[seriesNum].seriesOffset;
            let offsetPix = getAxes[yIndexer].p2c(offsetVal);
            ctx.save();
            ctx.translate(offsets.left - 11, offsetPix + 10);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = this.seriesAnchorContainer[i].color;
            ctx.fill();
            ctx.restore();
        }
    }

    seriesAnchorVertPan(e) {
        let yIndexer = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        let getAxes = this.chart.getAxes();
        let newVal = getAxes[yIndexer].c2p(e.clientY);
        let oldValinNewWindow = getAxes[yIndexer].c2p(this.previousYPos);
        let difference = newVal - oldValinNewWindow;
        let base = (getAxes[yIndexer].max + getAxes[yIndexer].min) / 2;
        let voltsPerDivision = (getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
        let newPos = base - difference;
        let min = newPos - voltsPerDivision * 5;
        let max = newPos + voltsPerDivision * 5;
        getAxes[yIndexer].options.min = min;
        getAxes[yIndexer].options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        this.previousYPos = e.clientY;
    }

    seriesAnchorTouchVertPan(e) {
        let yIndexer = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        let getAxes = this.chart.getAxes();
        let newVal = getAxes[yIndexer].c2p(e.originalEvent.touches[0].clientY);
        let oldValinNewWindow = getAxes[yIndexer].c2p(this.previousYPos);
        let difference = newVal - oldValinNewWindow;
        let base = (getAxes[yIndexer].max + getAxes[yIndexer].min) / 2;
        let voltsPerDivision = (getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
        let newPos = base - difference;
        let min = newPos - voltsPerDivision * 5;
        let max = newPos + voltsPerDivision * 5;
        getAxes[yIndexer].options.min = min;
        getAxes[yIndexer].options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        this.previousYPos = e.originalEvent.touches[0].clientY;
    }

    unbindCustomEvents(e) {
        $("#flotContainer").unbind("mousemove", this.seriesAnchorVertPanRef);
        $("#flotContainer").unbind("touchmove", this.seriesAnchorTouchVertPanRef);
        $("#flotContainer").unbind("mouseup", this.unbindCustomEventsRef);
        $("#flotContainer").unbind("mouseout", this.unbindCustomEventsRef);
        this.chart.getPlaceholder().css('cursor', 'default');
    }

    drawSeriesAnchors() {
        this.seriesAnchorContainer = [];
        let series = this.chart.getData();
        for (let i = 0; i < this.numSeries.length; i++) {
            this.seriesAnchorContainer.push({
                color: series[this.numSeries[i]].color,
                seriesNum: this.numSeries[i]
            });
        }
    }

    generateChartOptions() {
        for (let i = 0; i < this.deviceDescriptor.instruments.la.numChans + this.deviceDescriptor.instruments.osc.numChans; i++) {
            let axisOptions = {
                position: 'left',
                axisLabel: 'Ch ' + (i + 1),
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: i === 0,
                min: -1,
                max: 1,
                ticks: this.tickGenerator,
                tickFormatter: this.yTickFormatter,
                tickColor: '#666666',
                font: {
                    color: '#666666'
                }
            }
            let dataObject = {
                data: [],
                yaxis: i + 1,
                lines: {
                    show: (i === 0)
                }/*,
                points: {
                    show: true
                }*/
            };
            this.seriesDataContainer.push(dataObject);
            this.yAxisOptionsContainer.push(axisOptions);
        }
        return this.yAxisOptionsContainer;
    }

    tickGenerator(axis) {
        let min = axis.min;
        let max = axis.max;
        let interval = (max - min) / 10;
        let ticks = [];
        for (let i = 0; i < 11; i++) {
            ticks.push(i * interval + min);
        }
        return ticks;
    }

    yTickFormatter(val, axis) {
        let vPerDiv = Math.abs(axis.max - axis.min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        val = (parseFloat(val) * Math.pow(1000, i)).toFixed(0);
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
        return (val + unit);
    }

    xTickFormatter(val, axis) {
        let timePerDiv = Math.abs(axis.max - axis.min) / 10;
        if (parseFloat(val) == 0) {
            return 0 + ' s';
        }
        let i = 0;
        let unit = '';
        while (timePerDiv < 1) {
            i++;
            timePerDiv = timePerDiv * 1000;
        }
        val = (parseFloat(val) * Math.pow(1000, i));
        let numDigits = val.toFixed(0).length;
        let fixedDigits = numDigits < 4 ? 4 - numDigits : 0;
        val = val.toFixed(fixedDigits);
        if (i == 0) {
            unit = ' s';
        }
        else if (i == 1) {
            unit = ' ms';
        }
        else if (i == 2) {
            unit = ' us';
        }
        else if (i == 3) {
            unit = ' ns';
        }
        else if (i == 4) {
            unit = ' ps';
        }
        return val + unit;
    }

    pinchEvent(event) {
        console.log(event);
        alert('hey');
    }

    loadDeviceSpecificValues(deviceComponent: DeviceComponent) {
        this.deviceDescriptor = deviceComponent;
        let resolution = (deviceComponent.instruments.osc.chans[0].adcVpp / 1000) / Math.pow(2, deviceComponent.instruments.osc.chans[0].effectiveBits);
        let i = 0;
        while (resolution > this.generalVoltsPerDivVals[i] && i < this.generalVoltsPerDivVals.length - 1) {
            i++;
        }
        this.voltsPerDivVals = this.generalVoltsPerDivVals.slice(i);
        this.voltsPerDivOpts = this.generalVoltsPerDivOpts.slice(i);

        for (let i = 0; i < deviceComponent.instruments.osc.numChans; i++) {
            //Set the first oscope to on
            this.oscopeChansActive.push(i === 0);
        }

    }

    //Called once on chart load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;

        //Redraw chart to scale chart to container size
        this.chartLoad.emit(this.chart);

        if (this.deviceDescriptor !== undefined) {

            //Init axes settings
            for (let i = 0; i < this.deviceDescriptor.instruments.osc.numChans; i++) {
                this.activeVPDIndex[i] = this.voltsPerDivVals.indexOf(0.5);
                this.setSeriesSettings({
                    voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[i]],
                    voltBase: this.voltBase[i],
                    seriesNum: i
                });
            }

            this.chart.setActiveYIndices(this.activeVPDIndex);

            this.activeTPDIndex = this.secsPerDivVals.indexOf(0.01);
            this.chart.setActiveXIndex(this.activeTPDIndex);
            this.setTimeSettings({
                timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
                base: this.base
            }, false);
        }

    }

    //Displays the y axis label for the active series and hide the others
    updateYAxisLabels(newActiveSeries: number) {
        //If LA is set as active series don't do anything
        if (newActiveSeries > this.oscopeChansActive.length || newActiveSeries === this.activeSeries) { return; }
        let axes = this.chart.getAxes();
        let yIndexer1 = 'y' + ((newActiveSeries - 1 === 0) ? '' : newActiveSeries.toString()) + 'axis';
        let yIndexer0 = 'y' + ((this.activeSeries - 1 === 0) ? '' : this.activeSeries.toString()) + 'axis';
        axes[yIndexer0].options.show = false;
        axes[yIndexer1].options.show = true;
        this.chart.setupGrid();
        this.chart.draw();
    }

    decimateData(seriesNum: number, waveform: any, bounds: any) {

        let numPointsInView = Math.round((bounds.max - bounds.min) / waveform.dt);
        if (numPointsInView <= 2000) {
            return this.currentBufferArray[seriesNum];
        }
        let iterator = Math.floor(numPointsInView / 2000);
        let newPoints = [];
        for (let i = 0; i < waveform.y.length; i = iterator + i) {
            newPoints.push(waveform.y[i]);
        }
        let newWaveform = {
            y: [],
            dt: 0,
            t0: 0
        };
        newWaveform.y = newPoints;
        newWaveform.dt = waveform.dt * iterator;
        newWaveform.t0 = waveform.t0;
        return newWaveform;
    }

    flotDecimateData(seriesNum: number, bounds: any) {
        let waveform = this.currentBufferArray[seriesNum];
        let numPointsInView = Math.round((bounds.max - bounds.min) / waveform.dt);
        if (numPointsInView <= 2000) {
            return this.currentBufferArray[seriesNum];
        }
        let iterator = Math.floor(numPointsInView / 2000);
        let newPoints = [];
        let newData = [];
        for (let i = 0; i < waveform.y.length; i = iterator + i) {
            newPoints.push(waveform.y[i]);
            newData.push([waveform.data[i][0], waveform.data[i][1]]);
        }
        let newWaveform: WaveformComponent = {
            y: newPoints,
            dt: waveform.dt * iterator,
            t0: waveform.t0,
            data: newData,
            pointOfInterest: waveform.pointOfInterest,
            triggerPosition: waveform.triggerPosition,
            seriesOffset: waveform.seriesOffset
        };
        return newWaveform;
        /*console.log(mathFunctions);
        console.log(decimateModule);
        decimateModule.initData(['time', 'Series ' + seriesNum]);

        decimateModule.appendData(this.currentBufferArray[seriesNum].data);

        let data = decimateModule.getData(0, 10, this.chart.width());
        console.log(data);
        return data[0]*/
    }

    decimateTimeline(seriesNum: number, waveform: any) {
        let numPoints = waveform.y.length;
        let iterator = Math.floor(numPoints / 2000);
        if (iterator < 2) {
            return waveform;
        }
        let newPoints = [];
        for (let i = 0; i < waveform.y.length; i = iterator + i) {
            newPoints.push(waveform.y[i]);
        }
        let newWaveform = {
            y: [],
            dt: 0,
            t0: 0
        };
        newWaveform.y = newPoints;
        newWaveform.dt = waveform.dt * iterator;
        newWaveform.t0 = waveform.t0;
        return newWaveform;
    }

    setCurrentBuffer(bufferArray: WaveformComponent[]) {
        this.currentBufferArray = bufferArray;
        if (this.deviceDescriptor !== undefined) {
            this.updateTriggerLine();
            this.applyPointOfInterest(this.numSeries[0]);
        }
    }

    flotDrawWaveform(initialDraw: boolean, ignoreAutoscale?: boolean) {
        let dataObjects: any[] = [];
        let currentSeries = this.chart.getData();
        for (let i = 0; i < this.numSeries.length; i++) {
            let axesInfo = this.chart.getAxes();
            let bounds = {
                min: axesInfo.xaxis.min,
                max: axesInfo.xaxis.max
            };
            if (bounds.min < this.currentBufferArray[this.numSeries[i]].t0 || isNaN(bounds.min) || ignoreAutoscale) {
                bounds.min = this.currentBufferArray[this.numSeries[i]].t0;
            }
            if (bounds.max > this.currentBufferArray[this.numSeries[i]].dt * this.currentBufferArray[this.numSeries[i]].y.length || isNaN(bounds.max) || ignoreAutoscale) {
                bounds.max = this.currentBufferArray[this.numSeries[i]].dt * this.currentBufferArray[this.numSeries[i]].y.length;
            }
            let decimatedData = this.flotDecimateData(this.numSeries[i], bounds).data;
            dataObjects.push(
                {
                    data: decimatedData,
                    yaxis: 1,
                    label: 'Series' + this.numSeries[i].toString(),
                    color: currentSeries[this.numSeries[i]].color
                }
            );
            this.seriesDataContainer[this.numSeries[i]].data = decimatedData;
        }
        this.chart.setData(this.seriesDataContainer);
        this.chart.draw();

        if (this.timelineView && initialDraw) {
            this.timelineChart.setData(dataObjects);
            //Use setupgrid to autoscale the buffer
            this.timelineChart.setupGrid();
            this.timelineChart.draw();

            let newChartAxes = this.chart.getAxes();
            let infoContainer = {
                min: newChartAxes.xaxis.min,
                max: newChartAxes.xaxis.max
            };

            this.timelineChart.updateTimelineCurtains(infoContainer);
        }

        this.drawSeriesAnchors();
    }

    //Remove extra series and axes from the chart
    clearExtraSeries(usedSeries: number[]) {
        this.numSeries = usedSeries;
        for (let i = 0; i < this.seriesDataContainer.length; i++) {
            this.seriesDataContainer[i].data = [];
        }
    }

    //Remove cursors from the chart including their labels
    removeCursors() {
        let cursors = this.chart.getCursors();
        let length = cursors.length;
        for (let i = 0, j = 0; i < length; i++) {
            if (cursors[j].name !== 'triggerLine') {
                //cursor array shifts itself so always remove first entry in array
                this.chart.removeCursor(cursors[j]);
            }
            else {
                j++;
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.cursorPositions = [{ x: null, y: null }, { x: null, y: null }];
    }

    //Get cursor position differences and return an array of data
    getCursorInfo(cursorInfo: string) {
        if (cursorInfo === 'xDelta') {
            let getAxes = this.chart.getAxes();
            let timePerDiv = Math.abs(getAxes.xaxis.max - getAxes.xaxis.min) / 10;
            let i = 0;
            let unit = '';
            while (timePerDiv < 1) {
                i++;
                timePerDiv = timePerDiv * 1000;
            }
            if (i == 0) {
                unit = ' s';
            }
            else if (i == 1) {
                unit = ' ms';
            }
            else if (i == 2) {
                unit = ' us';
            }
            else if (i == 3) {
                unit = ' ns';
            }
            else if (i == 4) {
                unit = ' ps';
            }

            let xDelta = (Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x) * Math.pow(1000, i)).toFixed(0) + unit;
            return xDelta;
        }
        else if (cursorInfo === 'yDelta') {
            let getAxes = this.chart.getAxes();
            let yIndexer1 = 'y' + (this.activeChannels[1] - 1 === 0 ? '' : this.activeChannels[1].toString()) + 'axis';
            let yIndexer0 = 'y' + (this.activeChannels[0] - 1 === 0 ? '' : this.activeChannels[0].toString()) + 'axis';
            let vPerDiv = Math.abs(getAxes[yIndexer1].max - getAxes[yIndexer0].min) / 10;
            let i = 0;
            let unit = '';
            while (vPerDiv < 1) {
                i++;
                vPerDiv = vPerDiv * 1000;
            }
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

            let yDelta = (Math.abs(this.cursorPositions[1].y - this.cursorPositions[0].y) * Math.pow(1000, i)).toFixed(0) + unit;
            return yDelta;
        }
        else if (cursorInfo === 'xFreq') {
            if (this.cursorPositions[1].x === this.cursorPositions[0].x) { return 'Inf' };
            let freqRange = 1 / Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x);
            let i = 0;
            let unit = '';
            while (freqRange > 1) {
                i++;
                freqRange = freqRange / 1000;
            }
            i--;
            if (i == 0) {
                unit = ' Hz';
            }
            else if (i == 1) {
                unit = ' kHz';
            }
            else if (i == 2) {
                unit = ' Mhz';
            }
            else if (i == 3) {
                unit = ' GHz';
            }

            let xFreq = ((1 / Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x)) / Math.pow(1000, i)).toFixed(0) + unit;
            return xFreq;
        }
        else if (cursorInfo === 'cursorPosition0' || cursorInfo === 'cursorPosition1') {
            let index = cursorInfo.slice(-1);
            if (this.cursorPositions[index].x !== undefined) {
                let getAxes = this.chart.getAxes();
                let timePerDiv = Math.abs(getAxes.xaxis.max - getAxes.xaxis.min) / 10;
                let i = 0;
                let unit = '';
                while (timePerDiv < 1) {
                    i++;
                    timePerDiv = timePerDiv * 1000;
                }
                if (i == 0) {
                    unit = ' s';
                }
                else if (i == 1) {
                    unit = ' ms';
                }
                else if (i == 2) {
                    unit = ' us';
                }
                else if (i == 3) {
                    unit = ' ns';
                }
                else if (i == 4) {
                    unit = ' ps';
                }

                let cursorPosition = (this.cursorPositions[index].x * Math.pow(1000, i)).toFixed(0) + unit;

                let yIndexer = 'y' + ((this.activeChannels[index] - 1) === 0 ? '' : this.activeChannels[index].toString()) + 'axis';

                let vPerDiv = Math.abs(getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
                i = 0;
                while (vPerDiv < 1) {
                    i++;
                    vPerDiv = vPerDiv * 1000;
                }
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
                cursorPosition += ' (' + (this.cursorPositions[index].y * Math.pow(1000, i)).toFixed(0) + unit + ')';
                return cursorPosition;
            }
            else {
                let i = 0;
                let unit = '';
                let getAxes = this.chart.getAxes();
                let yIndexer = 'y' + (this.activeChannels[index] - 1 === 0 ? '' : this.activeChannels[index].toString()) + 'axis';
                let vPerDiv = Math.abs(getAxes[yIndexer].max - getAxes[yIndexer].min) / 10;
                i = 0;
                while (vPerDiv < 1) {
                    i++;
                    vPerDiv = vPerDiv * 1000;
                }
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
                let cursorPosition = (this.cursorPositions[index].y * Math.pow(1000, i)).toFixed(0) + unit;
                return cursorPosition;
            }

        }

    }

    //Exports series data from chart to a csv on client side
    exportCsv(fileName: string) {
        if (this.chart.series.length == 0) { return; }
        fileName = fileName + '.csv';
        let csvContent = 'data:text/csv;charset=utf-8,';
        let maxLength = 0;
        for (let i = 0; i < this.chart.series.length; i++) {
            if (this.chart.series[i].yData.length > maxLength) {
                maxLength = this.chart.series[i].yData.length;
            }
        }
        for (let i = 0; i < maxLength; i++) {
            let rowData = [];
            rowData.push(i * this.chart.series[0].options.pointInterval);
            for (let j = 0; j < this.chart.series.length; j++) {
                if (this.chart.series[j].yData[i] !== undefined) {
                    rowData.push(this.chart.series[j].yData[i]);
                }
                else {
                    rowData.push('');
                }
            }
            csvContent += rowData.join(',') + '\n';
        }
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    }

    //Opens cursor modal menu and sets data on modal dismiss
    openCursorModal() {
        let modal = this.modalCtrl.create(ModalCursorPage, {
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan,
            chartComponent: this
        });
        modal.onDidDismiss(data => {
            if (data.save) {
                this.cursorType = data.cursorType;
                this.cursor1Chan = data.cursor1Chan;
                this.cursor2Chan = data.cursor2Chan;
                this.handleCursors();
            }
            /*setTimeout(() => {
                this.chart.reflow();
            }, 50);*/
        });
        modal.present();
    }

    openMathModal() {
        if (this.currentBufferArray.length === 0) { return; }
        let modal = this.modalCtrl.create(MathModalPage, {
            chartComponent: this
        });
        modal.onDidDismiss(data => {
            console.log('rip math modal');
        });
        modal.present();
    }

    //Adds correct cursors from selection
    handleCursors() {
        this.activeChannels[0] = parseInt(this.cursor1Chan.slice(-1));
        this.activeChannels[1] = parseInt(this.cursor2Chan.slice(-1));
        this.removeCursors();
        if (this.cursorType === 'time') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'x',
                    color: color,
                    snapToPlot: (this.activeChannels[i] - 1),
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    position: {
                        relativeX: 0.25 + i * 0.5,
                        relativeY: 0.25 + i * 0.5
                    },
                    dashes: 10 + 10 * i
                }
                this.chart.addCursor(options);
            }
        }
        else if (this.cursorType === 'track') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'xy',
                    color: color,
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    snapToPlot: (this.activeChannels[i] - 1),
                    position: {
                        relativeX: 0.25 + i * 0.5,
                        relativeY: 0.25 + i * 0.5
                    },
                    dashes: 10 + 10 * i
                }
                this.chart.addCursor(options);
            }
        }
        else if (this.cursorType === 'voltage') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'y',
                    color: color,
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    position: {
                        relativeX: 0.25 + i * 0.5,
                        relativeY: 0.25 + i * 0.5
                    },
                    dashes: 10 + 10 * i
                }
                this.chart.addCursor(options);
            }
        }
    }

    //Enable cursors on the chart component. Called after chart initialization
    enableCursors() {
        this.cursorsEnabled = true;
    }

    //Set time settings (base and time/div) from an object containing the base and timeDivision
    setTimeSettings(timeObj: any, autoscale: boolean) {
        this.timeDivision = parseFloat(timeObj.timePerDiv);
        this.base = parseFloat(timeObj.base);
        let getAxes = this.chart.getAxes();
        getAxes.xaxis.options.min = this.base - 5 * this.timeDivision;
        getAxes.xaxis.options.max = this.base + 5 * this.timeDivision;
        this.chart.setupGrid();
        this.chart.draw();

        if (this.timelineView) {
            this.timelineChart.updateTimelineCurtains({
                min: this.base - 5 * this.timeDivision,
                max: this.base + 5 * this.timeDivision
            });
        }
    }

    //Set series settings based on an object containing the series number, volts per division, and base
    setSeriesSettings(seriesSettings: any) {
        this.voltDivision[seriesSettings.seriesNum] = seriesSettings.voltsPerDiv;
        this.voltBase[seriesSettings.seriesNum] = seriesSettings.voltBase;
        let getAxes = this.chart.getAxes();
        let yIndexer = 'y' + (seriesSettings.seriesNum === 0 ? '' : (seriesSettings.seriesNum + 1).toString()) + 'axis';
        getAxes[yIndexer].options.min = this.voltBase[seriesSettings.seriesNum] - 5 * this.voltDivision[seriesSettings.seriesNum];
        getAxes[yIndexer].options.max = this.voltBase[seriesSettings.seriesNum] + 5 * this.voltDivision[seriesSettings.seriesNum];
        this.chart.setupGrid();
        this.chart.draw();
    }

    //Set active series and update labels
    setActiveSeries(seriesNum: number) {
        this.updateYAxisLabels(seriesNum);
        this.chart.setActiveYAxis(seriesNum);
        this.activeSeries = seriesNum;
    }

    //Autoscale all axes on chart
    autoscaleAllAxes() {
        this.autoscaleAxis('x', 0);
        for (let i = 0; i < this.chart.yAxis.length; i++) {
            this.autoscaleAxis('y', i);
        }
    }

    //Autoscales single axis
    autoscaleAxis(axis: string, axisIndex: number) {
        /*if (axis === 'x') {
            let secsPerDiv = (this.chart.xAxis[0].dataMax - this.chart.xAxis[0].dataMin) / 10;
            let i = 0;
            while (secsPerDiv > this.secsPerDivVals[i] && i < this.secsPerDivVals.length - 1) {
                i++;
            }
            this.activeTPDIndex = i;
            this.timeDivision = this.secsPerDivVals[i];
            this.base = ((this.chart.xAxis[0].dataMax + this.chart.xAxis[0].dataMin) / 2);
            this.setTimeSettings({
                timePerDiv: this.timeDivision,
                base: this.base
            }, true);
            if (this.timelineView) {
                let extremes = this.chart.xAxis[0].getExtremes();
                this.updatePlotBands([2, 3], [[this.timelineBounds[0], extremes.dataMin], [extremes.dataMax, this.timelineBounds[1]]]);
                let left = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMin) - 5);
                let right = this.chart.xAxis[0].toValue(this.chart.xAxis[0].toPixels(extremes.dataMax) + 5);
                this.updatePlotLines([0, 1], [left, right]);
            }
        }
        else if (axis === 'y') {
            if (this.chart.yAxis[axisIndex].dataMin === null && this.chart.yAxis[axisIndex].dataMax === null) {
                return;
            }
            if (this.oscopeChansActive[axisIndex] === false) {
                return;
            }
            if (this.currentBufferArray[axisIndex].y === undefined) {
                return;
            }
            let voltsPerDiv = (this.chart.yAxis[axisIndex].dataMax - this.chart.yAxis[axisIndex].dataMin) / 10;
            let i = 0;
            while (voltsPerDiv > this.voltsPerDivVals[i] && i < this.voltsPerDivVals.length - 1) {
                i++;
            }
            this.activeVPDIndex[axisIndex] = i;
            this.voltBase[axisIndex] = (this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2;
            this.voltBase[axisIndex] = this.voltBase[axisIndex] - ((this.chart.yAxis[axisIndex].dataMax + this.chart.yAxis[axisIndex].dataMin) / 2) % this.voltsPerDivVals[this.activeVPDIndex[axisIndex]];
            this.voltDivision[axisIndex] = this.voltsPerDivVals[i];
            this.setSeriesSettings({
                seriesNum: axisIndex,
                voltsPerDiv: this.voltDivision[axisIndex],
                voltBase: this.voltBase[axisIndex]
            });
            this.updateSeriesAnchor(axisIndex);
        }
        else {
            console.log('invalid axis');
        }
        this.updateCursorLabels();
        this.updateTriggerAnchor(axisIndex);*/
    }

    //Enables timeline view. Called when chart is initialized
    enableTimelineView() {
        this.timelineView = true;
        this.createTimelineChart([{ data: [[]] }]);
    }

    enableMath() {
        this.mathEnabled = true;
    }

    //Determines if cursors and timeline view is enabled on chart component
    isCursorTimeline() {
        if (this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if only cursors are enabled on chart component
    isCursorOnly() {
        if (this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if only timeline view is enabled on chart component
    isTimelineOnly() {
        if (!this.cursorsEnabled && this.timelineView) {
            return true;
        }
        return false;
    }

    //Determines if timeline view and cursors are disabled on chart component
    isVanilla() {
        if (!this.cursorsEnabled && !this.timelineView) {
            return true;
        }
        return false;
    }

    decrementVPD(seriesNum) {
        if (this.activeVPDIndex[seriesNum] < 1) {
            return;
        }
        this.activeVPDIndex[seriesNum]--;
        this.chart.setActiveYIndices(this.activeVPDIndex);
        this.setSeriesSettings({
            voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[seriesNum]],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    incrementVPD(seriesNum) {
        if (this.activeVPDIndex[seriesNum] > this.voltsPerDivOpts.length - 2) {
            return;
        }
        this.activeVPDIndex[seriesNum]++;
        this.chart.setActiveYIndices(this.activeVPDIndex);
        this.setSeriesSettings({
            voltsPerDiv: this.voltsPerDivVals[this.activeVPDIndex[seriesNum]],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    incrementOffset(seriesNum) {
        this.voltBase[seriesNum] = this.voltBase[seriesNum] + this.voltDivision[seriesNum];
        this.setSeriesSettings({
            voltsPerDiv: this.voltDivision[seriesNum],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    decrementOffset(seriesNum) {
        this.voltBase[seriesNum] = this.voltBase[seriesNum] - this.voltDivision[seriesNum];
        this.setSeriesSettings({
            voltsPerDiv: this.voltDivision[seriesNum],
            voltBase: this.voltBase[seriesNum],
            seriesNum: seriesNum
        });
    }

    decrementTPD(seriesNum) {
        if (this.activeTPDIndex < 1) {
            return;
        }
        this.activeTPDIndex--;
        this.chart.setActiveXIndex(this.activeTPDIndex);
        this.setTimeSettings({
            timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
            base: this.base
        }, false);
    }

    incrementTPD(seriesNum) {
        if (this.activeTPDIndex > this.secsPerDivOpts.length - 2) {
            return;
        }
        this.activeTPDIndex++;
        this.chart.setActiveXIndex(this.activeTPDIndex);
        this.setTimeSettings({
            timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
            base: this.base
        }, false);
    }

    incrementBase() {
        this.base = this.base + this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        }, false);
    }

    decrementBase() {
        this.base = this.base - this.timeDivision;
        this.setTimeSettings({
            timePerDiv: this.timeDivision,
            base: this.base
        }, false);
    }

    toggleVisibility(seriesNum: number) {
        this.oscopeChansActive[seriesNum] = !this.oscopeChansActive[seriesNum];
        this.seriesDataContainer[seriesNum].lines.show = !this.seriesDataContainer[seriesNum].lines.show;
        this.chart.setData(this.seriesDataContainer);
        this.chart.draw();
    }

    getSeriesVisibility(seriesNum: number) {
        if (this.chart.series[seriesNum] === undefined) { return this.oscopeChansActive[seriesNum]; }
        return this.chart.series[seriesNum].visible;
    }

    getSeriesColor(seriesNum: number) {
        if (this.chart.series[seriesNum] === undefined) { return this.colorArray[seriesNum] }
        return this.chart.series[seriesNum].color;
    }

    //---------------------------------- MATH INFO ------------------------------

    addMathInfo(mathInfo: string, seriesNum: number, maxIndex: number, minIndex: number) {
        console.log(mathInfo, seriesNum);

        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.selectedMathInfo[i].measurement === mathInfo && this.selectedMathInfo[i].channel === seriesNum) {
                this.selectedMathInfo.splice(i, 1);
                return;
            }
        }
        if (this.selectedMathInfo.length === 4) {
            this.selectedMathInfo.shift();
        }
        this.selectedMathInfo.push({
            measurement: mathInfo,
            channel: seriesNum,
            value: 'err'
        });
        this.updateMath();
    }

    exportCanvasAsPng() {
        let canvas = this.chart.getCanvas();
        let data = canvas.toDataURL();
        let link = document.createElement("a");
        link.setAttribute("href", data);
        link.setAttribute("download", 'WaveFormsLiveChart.png');
        document.body.appendChild(link);
        link.click();
    }

    updateMath() {
        this.exportCanvasAsPng();
        let extremes = this.chart.getAxes().xaxis;
        let chartMin = extremes.min;
        let chartMax = extremes.max;
        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.currentBufferArray[this.selectedMathInfo[i].channel] === undefined || this.currentBufferArray[this.selectedMathInfo[i].channel].y === undefined) {
                this.selectedMathInfo[i].value = '----';
                continue;
            }
            let seriesNum = this.selectedMathInfo[i].channel;
            let series = this.chart.getData();
            let minIndex = Math.round((chartMin - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
            let maxIndex = Math.round((chartMax - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
            if (minIndex < 0) {
                minIndex = 0;
            }
            if (minIndex > series[seriesNum].data.length) {
                minIndex = series[seriesNum].data.length - 1;
            }
            if (maxIndex < 0) {
                maxIndex = 0;
            }
            if (maxIndex > series[seriesNum].data.length) {
                maxIndex = series[seriesNum].data.length - 1;
            }
            this.selectedMathInfo[i].value = this.updateMathByName(this.selectedMathInfo[i], maxIndex, minIndex);
        }

    }

    updateMathByName(selectedMathInfoObj: any, maxIndex: number, minIndex: number) {
        switch (selectedMathInfoObj.measurement) {
            case 'Frequency':
                return mathFunctions.getFrequency(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Pos Pulse Width':
                return 'Pos Pulse Width'

            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'

            case 'Period':
                return mathFunctions.getPeriod(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'

            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'

            case 'Rise Rate':
                return 'Rise Rate'

            case 'Rise Time':
                return 'Rise Time'

            case 'Amplitude':
                return mathFunctions.getAmplitude(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'High':
                return 'High'

            case 'Low':
                return 'Low'

            case 'Peak to Peak':
                return mathFunctions.getPeakToPeak(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Maximum':
                return mathFunctions.getMax(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Minimum':
                return mathFunctions.getMin(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Mean':
                return mathFunctions.getMean(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'RMS':
                return mathFunctions.getRMS(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex);

            case 'Overshoot':
                return 'Overshoot'

            case 'Cycle Mean':
                return 'Cycle Mean'

            case 'Cycle RMS':
                return 'Cycle RMS'

            case 'Undershoot':
                return 'Undershoot'

            default:
                return 'default'
        }
    }

    calculateDataFromWindow() {
        //100 points per division
        let numPoints = 1000;
        //Need to sample at 100 times in 1 time division
        let sampleFreq = 100 * (1 / this.secsPerDivVals[this.activeTPDIndex]);

        return {
            bufferSize: numPoints,
            sampleFreq: sampleFreq //Hz since it's converted in the instrument
        };
    }

    updateTriggerLine() {
        let cursors = this.chart.getCursors();
        if (cursors.length === 0) {
            this.addTriggerLine(this.numSeries[0]);
            return;
        }
    }

    addTriggerLine(seriesNum) {
        let trigPosition = this.currentBufferArray[seriesNum].triggerPosition;
        if (trigPosition < 0 || trigPosition === undefined) { return; }
        let initialValue = trigPosition * this.currentBufferArray[seriesNum].dt;
        //Add trigger line
        let options = {
            name: 'triggerLine',
            mode: 'x',
            color: 'green',
            showIntersections: false,
            showLabel: false,
            movable: false,
            symbol: 'none',
            position: {
                x: initialValue,
                relativeY: 0.5
            }
        }
        this.chart.addCursor(options);
        if (this.timelineView) {
            let timelineOptions = options;
            timelineOptions['fullHeight'] = true;
            this.timelineChart.addCursor(timelineOptions);
            //add to timeline as well
        }
    }

    applyPointOfInterest(seriesNum: number) {
        let poiIndex = this.currentBufferArray[seriesNum].pointOfInterest;
        if (poiIndex < 0 || poiIndex === undefined) {
            return;
        }
        let getAxes = this.chart.getAxes();
        let poi = poiIndex * this.currentBufferArray[seriesNum].dt + 0;
        this.base = poi;
        let min = poi - 5 * this.timeDivision;
        let max = poi + 5 * this.timeDivision;
        getAxes.xaxis.options.min = min;
        getAxes.xaxis.options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        if (this.timelineView) {
        }
    }
}
