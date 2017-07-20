import { Component, Output, EventEmitter, ViewChild, trigger, state, style, transition, animate, ViewContainerRef, ComponentFactoryResolver, ComponentRef } from '@angular/core';
import { ModalController, Platform, PopoverController, NavController } from 'ionic-angular';

//Components
import { DeviceService, WaveformService } from 'dip-angular2/services';
import { GenPopover } from '../gen-popover/gen-popover.component';
import { PinoutPopover } from '../pinout-popover/pinout-popover.component';
import { DigilentChart } from 'digilent-chart-angular2/modules';

import { ChartAnnotationComponent } from '../chart-annotation/chart-annotation.component';

//Pages
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { BodePage } from '../../pages/bode/bode';

//Interfaces
import { Chart, CursorPositions, DataContainer } from './chart.interface';

//Services
import { SettingsService } from '../../services/settings/settings.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { ToastService } from '../../services/toast/toast.service';
import { DeviceDataTransferService } from '../../services/device/device-data-transfer.service';
import { ExportService } from '../../services/export/export.service';
import { DeviceManagerService } from 'dip-angular2/services';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

declare var $: any;
declare var mathFunctions: any;
declare var fftLibrary: any;
declare var decimateModule: any;
declare var cordova: any;

@Component({
    selector: 'silverNeedleChart',
    templateUrl: 'chart.html',
    animations: [
        trigger('expand', [
            state('true', style({ height: '100%' })),
            state('false', style({ height: '0%' })),
            transition('void => *', animate('0s')),
            transition('* <=> *', animate('250ms ease-in-out'))
        ])
    ]
})

export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    @Output() resetDevice: EventEmitter<any> = new EventEmitter();
    @ViewChild('fftChart') fftChart: DigilentChart;
    public settingsService: SettingsService;
    public tooltipService: TooltipService;
    public unitFormatPipeInstance = new UnitFormatPipe();
    public platform: Platform;
    public popoverCtrl: PopoverController;
    public chart: Chart;
    public timelineChart: Chart = null;
    public numXCursors: number = 0;
    public activeSeries: number = 1;
    public numYCursors: number = 0;
    public cursorType: string = 'Disabled';
    public cursor1Chan: string = 'Osc 1';
    public cursor2Chan: string = 'Osc 1';
    public cursorsEnabled: boolean = true;
    public activeChannels = [1, 1];
    public mathEnabled: boolean = true;
    public activeVPDIndex: number[] = [9, 9];
    public generalVoltsPerDivVals: number[];
    public voltsPerDivVals: number[] = this.generalVoltsPerDivVals;
    public activeTPDIndex: number = 27;
    public secsPerDivVals: number[];
    public timelineView: boolean = false;
    public timeDivision: number = 1;
    public base: number = 0;
    public numSeries: number[];
    public voltDivision: number[] = [1, 1];
    public voltBase: number[] = [0, 0];
    public cursorPositions: Array<CursorPositions> = [{ x: null, y: null }, { x: null, y: null }];
    public modalCtrl: ModalController;
    public currentBufferArray: WaveformService[] = [];
    public oscopeChansActive: boolean[] = [];
    public colorArray: string[] = ['#FFA500', '#4487BA', '#ff3b99', '#00c864'];
    public deviceDescriptor: DeviceService;
    public selectedMathInfo: any = [];
    public seriesDataContainer: DataContainer[] = [];
    public yAxisOptionsContainer: any = [];
    public activeOscChannel: number = 1;

    public overSeriesAnchor: any = {
        over: false,
        seriesNum: null
    }
    public seriesAnchorContainer: any[];
    public seriesAnchorVertPanRef: any;
    public seriesAnchorTouchVertPanRef: any;
    public triggerLevelVertPanRef: any;
    public triggerLevelTouchVertPanRef: any;
    public triggerLevelTouchStartRef: any;
    public unbindCustomEventsRef: any;
    public seriesAnchorTouchStartRef: any;
    public previousYPos: number;
    public flotOverlayRef;
    public showFft: boolean = false;
    public fftChartOptions: any;

    public TODOKILLME: number = 0;
    public overTriggerLevel: boolean = false;

    private annotationRefs: { ref: ComponentRef<ChartAnnotationComponent>, id: number, view: 'chart' | 'fft' }[] = [];

    private minBodeFirmwareVersion: string = '1.37.0';

    constructor(
        _modalCtrl: ModalController,
        _platform: Platform,
        _popoverCtrl: PopoverController,
        _settingsService: SettingsService,
        _tooltipService: TooltipService,
        public deviceDataTransferService: DeviceDataTransferService,
        private containerRef: ViewContainerRef,
        private compFactoryResolver: ComponentFactoryResolver,
        private navCtrl: NavController,
        private exportService: ExportService,
        private deviceManagerService: DeviceManagerService,
        private toastService: ToastService
    ) {
        this.modalCtrl = _modalCtrl;
        this.settingsService = _settingsService;
        this.tooltipService = _tooltipService;
        this.popoverCtrl = _popoverCtrl;
        this.platform = _platform;
        this.secsPerDivVals = this.generateNiceNumArray(0.000000001, 10);
        this.generalVoltsPerDivVals = this.generateNiceNumArray(0.001, 5);
    }

    ngAfterViewInit() {
        console.log('View Init');
        this.seriesAnchorVertPanRef = this.seriesAnchorVertPan.bind(this);
        this.unbindCustomEventsRef = this.unbindCustomEvents.bind(this);
        this.seriesAnchorTouchStartRef = this.seriesAnchorTouchStart.bind(this);
        this.triggerLevelTouchStartRef = this.triggerLevelAnchorTouchStart.bind(this);
        this.triggerLevelTouchVertPanRef = this.triggerLevelTouchVertPan.bind(this);
        this.triggerLevelVertPanRef = this.triggerLevelVertPan.bind(this);
        this.seriesAnchorTouchVertPanRef = this.seriesAnchorTouchVertPan.bind(this);
        let plotArea = $('#flotContainer');
        plotArea.css({
            width: '100%',
            height: '100%'
        });
        if (this.chart == undefined) {
            this.createChart();
            this.fftChartOptions = this.getFftChartOptions();
        }
    }

    initializeValues() {
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

            this.activeTPDIndex = this.secsPerDivVals.indexOf(0.0005);
            this.chart.setActiveXIndex(this.activeTPDIndex);
            this.setTimeSettings({
                timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
                base: this.base
            }, false);
        }
    }

    initializeFromGetStatus(getStatusObject: any) {
        for (let channel in getStatusObject.osc) {
            getStatusObject.osc[channel].forEach((val, index, array) => {
                if (val.acqCount === 0) { return; }
                this.base = val.triggerDelay / Math.pow(10, 12);
                //TODO find closest match instead of inclusive closest match
                this.gainToVpd(parseInt(channel), val.actualGain);
                this.sampleFreqToWindow(val.actualSampleFreq / 1000);
                this.setTimeSettings({
                    timePerDiv: this.secsPerDivVals[this.activeTPDIndex],
                    base: this.base
                }, false);
            });
        }
    }

    sampleFreqToWindow(sampleFreq: number) {
        if (this.chart == undefined) { return; }
        let numPoints = this.chart.width();
        let timeDivision = (numPoints / 10) * (1 / sampleFreq);
        console.log(timeDivision);
        this.setNearestPresetSecPerDivVal(timeDivision, true);
    }

    gainToVpd(channel: number, gain: number) {
        let j = this.voltsPerDivVals.length - 1;
        while ((this.voltsPerDivVals[j] * 10 * gain) > (this.deviceDescriptor.instruments.osc.chans[channel - 1].adcVpp / 1000) && j > 0) {
            j--;
        }
        this.voltDivision[channel - 1] = this.voltsPerDivVals[j];
        this.activeVPDIndex[channel - 1] = j;
        this.chart.setActiveYIndices(this.activeVPDIndex);
        this.setSeriesSettings({
            voltsPerDiv: this.voltDivision[channel - 1],
            voltBase: this.voltBase[channel - 1],
            seriesNum: channel - 1
        });
    }

    setNearestPresetSecPerDivVal(newSecPerDivVal: number, nonInclusive?: boolean) {
        nonInclusive = nonInclusive == undefined ? false : nonInclusive;
        let count = 0;
        while (this.secsPerDivVals[count] < newSecPerDivVal && count < this.secsPerDivVals.length) {
            count++;
        }
        if (nonInclusive && count !== 0) {
            let average = (this.secsPerDivVals[count] + this.secsPerDivVals[count - 1]) / 2;
            if (newSecPerDivVal <= average) {
                count--;
            }
        }
        this.activeTPDIndex = count;
        this.chart.setActiveXIndex(count);
    }

    setNearestPresetVoltsPerDivVal(newVoltsPerDivVal: number, seriesNum: number) {
        if (seriesNum > this.oscopeChansActive.length - 1) { return; }
        let count = 0;
        while (this.voltsPerDivVals[count] < newVoltsPerDivVal && count < this.voltsPerDivVals.length) {
            count++;
        }
        this.activeVPDIndex[seriesNum] = count;
        this.chart.setActiveYIndices(this.activeVPDIndex);
    }

    generateNiceNumArray(min: number, max: number) {
        let niceNumArray = [];
        let currentPow = Math.ceil(Math.log10(min));
        let current = min * Math.pow(10, -1 * currentPow);
        let i = 0;
        while (current * Math.pow(10, currentPow) <= max) {
            niceNumArray[i] = this.decimalAdjust('round', current * Math.pow(10, currentPow), currentPow);
            if (current === 1) {
                current = 2;
            }
            else if (current === 2) {
                current = 5;
            }
            else {
                current = 1;
                currentPow++;
            }
            i++;
        }
        return niceNumArray;
    }

    //Used to fix floating point errors when computing nicenumarray
    decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    createTimelineChart(dataObjectArray: any) {
        console.log('creating timeline chart');
        if (this.timelineChart != undefined) { return; }

        let chartRef = this.chart;
        this.timelineChart = $.plot("#timelineContainer", dataObjectArray, {
            series: {
                lines: {
                    show: true
                }
            },
            timelineChart: {
                enabled: true,
                secsPerDivisionValues: this.secsPerDivVals,
                startingXIndex: 21,

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
        $("#timelineContainer").bind("timelineWheelRedraw", (event, wheelData) => {
            this.activeTPDIndex = wheelData.perDivArrayIndex;
            this.timeDivision = this.secsPerDivVals[this.activeTPDIndex];
            this.base = wheelData.mid;
            setTimeout(() => { this.shouldShowIndividualPoints(); }, 20);
        });
        $("#timelineContainer").bind("timelinePanEvent", (event, data) => {
            this.base = data.mid;
        });
    }

    getFftChartOptions() {
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
                enabled: true,
                secsPerDivisionValues: this.generateNiceNumArray(1, 500000)
            },
            cursorMoveOnPan: true,
            yaxes: this.generateFftYaxisOptions(),
            xaxis: {
                tickColor: '#666666',
                tickFormatter: ((val, axis) => { return this.unitFormatPipeInstance.transform(val, 'Hz') }),
                font: {
                    color: '#666666'
                }
            }
        }
        return fftChartOptions;
    }

    toBode() {
        let currentFirmwareContainer = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].firmwareVersion;
        let minFirmwareSplit = this.minBodeFirmwareVersion.split('.');
        let weightedMinFirmwareVersion = 1000000 * parseInt(minFirmwareSplit[0]) + 1000 * parseInt(minFirmwareSplit[1]) + parseInt(minFirmwareSplit[2]);
        let weightedCurrFirmwareVersion = 1000000 * currentFirmwareContainer.major + 1000 * currentFirmwareContainer.minor + currentFirmwareContainer.patch;
        if (weightedCurrFirmwareVersion < weightedMinFirmwareVersion) {
            this.toastService.createToast('upgradeFirmware', true, '. Please Upload At Least Version ' + this.minBodeFirmwareVersion + '.', 8000);
            return;
        }
        this.navCtrl.push(BodePage, {
            onBodeDismiss: (() => {
                console.log('bode dismiss');
                this.resetDevice.emit();
            })
        });
    }

    generateFftYaxisOptions() {
        let fftYAxes: any = [];
        for (let i = 0; i < this.deviceDescriptor.instruments.osc.numChans; i++) {
            let axisOptions = {
                position: 'left',
                axisLabel: 'Ch ' + (i + 1),
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: i === 0,
                tickColor: '#666666',
                tickFormatter: this.yTickFormatter,
                font: {
                    color: '#666666'
                }
            }
            fftYAxes.push(axisOptions);
        }
        return fftYAxes;
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
                    let xLabel;
                    let yLabel;
                    xLabel = flotItem.series.xaxis.options.tickFormatter(xval, flotItem.series.xaxis);
                    yLabel = flotItem.series.yaxis.options.tickFormatter(yval, flotItem.series.yaxis);
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
                startingXIndex: 21
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
        this.chart.setSecsPerDivArray(this.secsPerDivVals);

        this.chart.hooks.drawOverlay.push(this.seriesAnchorsHandler.bind(this));
        this.chart.hooks.drawOverlay.push(this.triggerLevelAnchorHandler.bind(this));

        $("#flotContainer").bind("panEvent", (event, panData) => {
            if (panData.axis === 'xaxis') {
                this.base = panData.mid;
                this.refreshCursors();
            }
            else {
                this.voltBase[panData.axisNum - 1] = panData.mid;
            }
        });
        $("#flotContainer").bind("cursorupdates", (event, cursorData) => {
            if (cursorData[0] === undefined || this.cursorType.toLowerCase() === 'disabled') { return; }
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
                setTimeout(() => {
                    this.shouldShowIndividualPoints();
                    this.refreshCursors();
                }, 20);
            }
            else {
                this.activeVPDIndex[wheelData.axisNum - 1] = wheelData.perDivArrayIndex;
                this.voltDivision[wheelData.axisNum - 1] = this.voltsPerDivVals[this.activeVPDIndex[wheelData.axisNum - 1]];
            }
        });

        $("#flotContainer").bind("mousemove", (event) => {
            let offsets = this.chart.offset();
            let plotRelXPos = event.clientX - offsets.left;
            let plotRelYPos = event.clientY - offsets.top;
            let getAxes = this.chart.getAxes();
            //Check if over trigger level
            if (this.deviceDataTransferService.triggerSource !== 'LA') {
                let seriesNum = parseInt(this.deviceDataTransferService.triggerSource.split(' ')[2]) - 1;
                let yIndexerTrigSrc = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
                let valPix = getAxes[yIndexerTrigSrc].p2c(this.deviceDataTransferService.triggerLevel);
                if (plotRelXPos > this.chart.width() - 20 && plotRelXPos < this.chart.width() + 5 && plotRelYPos < valPix + 10 && plotRelYPos > valPix - 10 && this.deviceDataTransferService.triggerSource !== 'LA') {
                    this.overTriggerLevel = true;
                    this.chart.getPlaceholder().css('cursor', 'ns-resize');
                    return;
                }
            }
            if (this.overTriggerLevel) {
                this.overTriggerLevel = false;
                this.chart.getPlaceholder().css('cursor', 'default');
            }

            if (this.numSeries == undefined) { return; }

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
            if (this.overSeriesAnchor.over) {
                this.overSeriesAnchor = {
                    over: false,
                    seriesNum: null
                }
                this.chart.getPlaceholder().css('cursor', 'default');
            }
        });

        $("#flotContainer").bind("mousedown", (event) => {
            if (this.overSeriesAnchor.over) {
                this.chart.unbindMoveEvents();
                this.setActiveSeries(this.overSeriesAnchor.seriesNum + 1);
                this.chart.triggerRedrawOverlay();
                $("#flotContainer").bind("mousemove", this.seriesAnchorVertPanRef);
                $("#flotContainer").bind("mouseup", this.unbindCustomEventsRef);
                $("#flotContainer").bind("mouseout", this.unbindCustomEventsRef);
                this.previousYPos = event.clientY;
                return;
            }
            if (this.overTriggerLevel) {
                this.chart.unbindMoveEvents();
                $("#flotContainer").bind("mousemove", this.triggerLevelVertPanRef);
                $("#flotContainer").bind("mouseup", this.unbindCustomEventsRef);
                $("#flotContainer").bind("mouseout", this.unbindCustomEventsRef);
            }
        });

        $("#flotContainer").bind("touchstart", this.seriesAnchorTouchStartRef);
        $("#flotContainer").bind("touchstart", this.triggerLevelTouchStartRef);

        $("#flotContainer").bind("contextmenu", (event) => {
            this.addAnnotation(event);
            return false;
        });

        //updateChart();
        this.onLoad(this.chart);
    }

    fftChartContext(event) {
        this.addAnnotation(event);
        return false;
    }

    addAnnotation(event) {
        let offsetX = event.clientX - event.offsetX;
        let offsetY = event.clientY - event.offsetY;
        let flotTipEl = document.getElementsByClassName('flotTip')[0];
        if (flotTipEl == undefined) { return; }
        let innerHTML = flotTipEl.innerHTML;
        if (innerHTML == undefined || innerHTML === '') { return; }
        let attributes: any = flotTipEl.attributes[1].value.split('; ');
        attributes[attributes.length - 1] = attributes[attributes.length - 1].slice(0, -1);
        let attrObj: any = {};
        for (let i = 0; i < attributes.length; i++) {
            let kvArray = attributes[i].split(': ');
            attrObj[kvArray[0]] = kvArray[1] || '';
        }
        if (attrObj.left == undefined || attrObj.top == undefined || attrObj.border == undefined) { return; }
        attrObj.border = attrObj.border.match(/rgb\([0-9]+, [0-9]+, [0-9]+\)/)[0];
        attrObj.top = (parseInt(attrObj.top) - offsetY) + 'px';
        attrObj.left = (parseInt(attrObj.left) - offsetX) + 'px';
        let factory = this.compFactoryResolver.resolveComponentFactory(ChartAnnotationComponent);
        let annotationRef: ComponentRef<ChartAnnotationComponent> = this.containerRef.createComponent(factory);
        let timeStamp = performance.now();
        annotationRef.instance.show = true;
        annotationRef.instance.contents = document.getElementsByClassName('flotTip')[0].innerHTML;
        annotationRef.instance.setStyles(attrObj.left, attrObj.top, attrObj.border);
        annotationRef.instance.closeAnnotation.subscribe((data) => {
            annotationRef.instance.closeAnnotation.unsubscribe();
            for (let i = 0; i < this.annotationRefs.length; i++) {
                if (this.annotationRefs[i].id === timeStamp) {
                    this.annotationRefs[i].ref.destroy();
                    this.annotationRefs.splice(i, 1);
                }
            }
        });
        this.annotationRefs.push({
            ref: annotationRef,
            id: timeStamp,
            view: this.showFft ? 'fft' : 'chart'
        });
    }

    getFftArray(seriesNum: number, minIndex: number, maxIndex: number) {
        return mathFunctions.getFftArray(this.chart, seriesNum, minIndex, maxIndex);
    }

    toggleFft() {
        this.showFft = !this.showFft;
        if (this.showFft) {
            this.drawFft(true);
        }
        if (this.annotationRefs.length > 0) {
            for (let i = 0; i < this.annotationRefs.length; i++) {
                this.annotationRefs[i].ref.instance.show = this.annotationRefs[i].view === (this.showFft ? 'fft' : 'chart');
            }
        }
    }

    drawFft(autoscale?: boolean) {
        if (this.showFft) {
            autoscale = autoscale == undefined ? false : autoscale;
            let dataToSet: DataContainer[] = [];
            for (let i = 0; i < this.deviceDescriptor.instruments.osc.numChans; i++) {
                dataToSet.push({
                    data: this.numSeries.indexOf(i) !== -1 ? this.getFftArray(i, 0, this.currentBufferArray[i].y.length) : [],
                    yaxis: i + 1,
                    lines: {
                        show: this.numSeries.indexOf(i) !== -1
                    },
                    points: {
                        show: false
                    }
                });

            }
            this.fftChart.setData(dataToSet, autoscale);
        }
    }

    shouldShowIndividualPoints() {
        if (this.numSeries == undefined || this.numSeries[0] == undefined || this.currentBufferArray[this.numSeries[0]] == undefined) { return; }
        let series = this.chart.getData();
        let axesInfo = this.chart.getAxes();
        for (let i = 0; i < this.currentBufferArray.length; i++) {
            if (this.currentBufferArray[i] != undefined && this.currentBufferArray[i].y != undefined) {
                let numPointsInView = (axesInfo.xaxis.max - axesInfo.xaxis.min) / this.currentBufferArray[i].dt;
                series[i].points.show = numPointsInView < 50;
            }
        }
        this.chart.draw();
    }

    refreshCursors() {
        let cursors = this.chart.getCursors();
        let cursorsToUpdate = [];
        let newOptions = [];
        if (this.cursorType === 'Voltage') {
            return;
        }
        for (let i = 0; i < cursors.length; i++) {
            if (cursors[i].name !== 'triggerLine') {
                cursorsToUpdate.push(cursors[i]);
                let cursorNum = parseInt(cursors[i].name.slice(-1)) - 1;
                newOptions.push({
                    position: {
                        x: this.cursorPositions[cursorNum].x || 0,
                        y: this.cursorPositions[cursorNum].y || 0
                    }
                });
            }
        }

        this.chart.setMultipleCursors(cursorsToUpdate, newOptions);
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
                this.chart.triggerRedrawOverlay();
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

    triggerLevelAnchorTouchStart(event) {
        let offsets = this.chart.offset();
        let plotRelXPos = event.clientX - offsets.left;
        let plotRelYPos = event.clientY - offsets.top;
        let getAxes = this.chart.getAxes();
        //Check if over trigger level
        let seriesNum = parseInt(this.deviceDataTransferService.triggerSource.split(' ')[2]) - 1;
        let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
        let valPix = getAxes[yIndexer].p2c(this.deviceDataTransferService.triggerLevel);
        if (plotRelXPos > this.chart.width() - 20 && plotRelXPos < this.chart.width() + 5 && plotRelYPos < valPix + 10 && plotRelYPos > valPix - 10) {
            this.overTriggerLevel = true;
            this.chart.getPlaceholder().css('cursor', 'ns-resize');
            this.chart.unbindMoveEvents();
            $("#flotContainer").bind("touchmove", this.triggerLevelTouchVertPanRef);
            $("#flotContainer").bind("touchend", this.unbindCustomEventsRef);
            $("#flotContainer").bind("touchleave", this.unbindCustomEventsRef);
            return;
        }
        this.overTriggerLevel = false;
    }

    seriesAnchorsHandler(plot: any, ctx: any) {
        this.flotOverlayRef = ctx;
        let offsets = this.chart.offset();
        if (this.seriesAnchorContainer == undefined || this.seriesAnchorContainer.length < 1) { return; }
        let getAxes = this.chart.getAxes();
        for (let i = 0; i < this.seriesAnchorContainer.length; i++) {
            let strokeColor = 'black';
            let lineWidth = 1;
            if (this.activeSeries - 1 === this.seriesAnchorContainer[i].seriesNum) {
                strokeColor = 'white';
                lineWidth = 2;
            }
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
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.fillStyle = this.seriesAnchorContainer[i].color;
            ctx.fill();
            if (this.seriesAnchorContainer[i].seriesNum > this.oscopeChansActive.length - 1) {
                ctx.font = '10pt Calibri';
                ctx.fillStyle = 'white';
                ctx.fillText('A' + (this.seriesAnchorContainer[i].seriesNum + 1 - this.oscopeChansActive.length).toString(), 14, 9);
            }
            ctx.restore();
        }
    }

    triggerLevelAnchorHandler(plot: any, ctx: any) {
        if (this.deviceDataTransferService.triggerSource === 'LA') { return; }
        this.flotOverlayRef = ctx;
        let offsets = this.chart.offset();
        let getAxes = this.chart.getAxes();
        let strokeColor = 'green';
        let lineWidth = 2;
        let val = this.deviceDataTransferService.triggerLevel;
        let seriesNum = parseInt(this.deviceDataTransferService.triggerSource.split(' ')[2]) - 1;
        let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
        let pix = getAxes[yIndexer].p2c(val);
        ctx.save();
        ctx.translate(offsets.left + this.chart.width(), pix + 10);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.restore();
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
        this.voltBase[this.activeSeries - 1] = base;
        this.previousYPos = e.clientY;
    }

    triggerLevelVertPan(e) {
        let getAxes = this.chart.getAxes();
        let offsets = this.chart.offset();
        let seriesNum = parseInt(this.deviceDataTransferService.triggerSource.split(' ')[2]) - 1;
        let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
        let val = getAxes[yIndexer].c2p(e.clientY - offsets.top);
        val = Math.max(Math.min(val, this.deviceDescriptor.instruments.osc.chans[seriesNum].inputVoltageMax / 1000), this.deviceDescriptor.instruments.osc.chans[seriesNum].inputVoltageMin / 1000);
        this.deviceDataTransferService.triggerLevel = val;
        this.chart.triggerRedrawOverlay();
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
        this.voltBase[this.activeSeries - 1] = base;
        this.previousYPos = e.originalEvent.touches[0].clientY;
    }

    triggerLevelTouchVertPan(e) {
        let getAxes = this.chart.getAxes();
        let offsets = this.chart.offset();
        let seriesNum = parseInt(this.deviceDataTransferService.triggerSource.split(' ')[2]) - 1;
        let yIndexer = 'y' + ((seriesNum === 0) ? '' : (seriesNum + 1).toString()) + 'axis';
        let val = getAxes[yIndexer].c2p(e.originalEvent.touches[0].clientY - offsets.top);
        val = Math.max(Math.min(val, this.deviceDescriptor.instruments.osc.chans[seriesNum].inputVoltageMax / 1000), this.deviceDescriptor.instruments.osc.chans[seriesNum].inputVoltageMin / 1000);
        this.deviceDataTransferService.triggerLevel = val;
        this.chart.triggerRedrawOverlay();
    }

    unbindCustomEvents(e) {
        $("#flotContainer").unbind("mousemove", this.seriesAnchorVertPanRef);
        $("#flotContainer").unbind("mousemove", this.triggerLevelVertPanRef);
        $("#flotContainer").unbind("touchmove", this.seriesAnchorTouchVertPanRef);
        $("#flotContainer").unbind("touchmove", this.triggerLevelTouchVertPanRef);
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

    hexToRgb(hexVal: string): { r: number, g: number, b: number } {
        let toInt = parseInt(hexVal, 16);
        return {
            r: (toInt >> 16) & 255,
            g: (toInt >> 8) & 255,
            b: (toInt) & 255
        }
    }

    generateChartOptions() {
        for (let i = 0; i < this.deviceDescriptor.instruments.la.chans[0].numDataBits + this.deviceDescriptor.instruments.osc.numChans; i++) {
            let color;
            let min;
            let max;
            if (i > this.deviceDescriptor.instruments.osc.numChans - 1) {
                color = 'rgb(0,128,0)';
                //40V range looks good. First should range from 9 to 10 and the second from 8 to 9
                let offset = (i - this.deviceDescriptor.instruments.osc.numChans);
                offset *= 1.25;
                max = 1.25 + offset;
                min = -38.75 + offset;
            }
            else {
                color = this.colorArray[i];
                min = -1;
                max = 1;
            }
            let axisOptions = {
                position: 'left',
                axisLabel: 'Ch ' + (i + 1),
                axisLabelColour: '#666666',
                axisLabelUseCanvas: true,
                show: i === 0,
                min: min,
                max: max,
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
                },
                points: {
                    show: false
                },
                color: color
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
        let fixedDigits;
        if (val < 0) {
            fixedDigits = numDigits < 5 ? 5 - numDigits : 0;
        }
        else {
            fixedDigits = numDigits < 4 ? 4 - numDigits : 0;
        }
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

    loadDeviceSpecificValues(deviceComponent: DeviceService) {
        this.deviceDescriptor = deviceComponent;
        let resolution = (deviceComponent.instruments.osc.chans[0].adcVpp / 1000) / Math.pow(2, deviceComponent.instruments.osc.chans[0].effectiveBits);
        let i = 0;
        while (resolution > this.generalVoltsPerDivVals[i] && i < this.generalVoltsPerDivVals.length - 1) {
            i++;
        }
        this.voltsPerDivVals = this.generalVoltsPerDivVals.slice(i);

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

            this.activeTPDIndex = this.secsPerDivVals.indexOf(0.0005);
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
        let yIndexer0 = 'y' + ((this.activeOscChannel - 1 === 0) ? '' : this.activeOscChannel.toString()) + 'axis';
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
        return this.currentBufferArray[seriesNum];
        /*let waveform = this.currentBufferArray[seriesNum];
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
            seriesOffset: waveform.seriesOffset,
            triggerDelay: waveform.triggerDelay
        };
        return newWaveform;*/
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

    setCurrentBuffer(bufferArray: WaveformService[]) {
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
            if (this.numSeries[i] < this.oscopeChansActive.length || this.settingsService.drawLaOnTimeline) {
                dataObjects.push(
                    {
                        data: decimatedData,
                        yaxis: 1,
                        label: 'Series' + this.numSeries[i].toString(),
                        color: currentSeries[this.numSeries[i]].color
                    }
                );
            }
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
        this.shouldShowIndividualPoints();

        if (this.showFft) {
            this.drawFft(false);
        }

        if (this.selectedMathInfo.length > 0) {
            this.updateMath();
        }

        let newTime = performance.now();
        let fps = 1000 / (newTime - this.TODOKILLME);
        this.TODOKILLME = newTime;
        console.warn('FPS: ' + (fps))
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
            let result = this.unitFormatPipeInstance.transform(Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x), 's');
            return result;
        }
        else if (cursorInfo === 'yDelta') {
            let result = this.unitFormatPipeInstance.transform(Math.abs(this.cursorPositions[1].y - this.cursorPositions[0].y), 'V');
            return result;
        }
        else if (cursorInfo === 'xFreq') {
            if (this.cursorPositions[1].x === this.cursorPositions[0].x) { return 'Inf' };

            let result = this.unitFormatPipeInstance.transform((1 / Math.abs(this.cursorPositions[1].x - this.cursorPositions[0].x)), 'Hz');
            return result;
        }
        else if (cursorInfo === 'cursorPosition0' || cursorInfo === 'cursorPosition1') {
            let index = cursorInfo.slice(-1);
            if (this.cursorPositions[index].x !== undefined) {
                let xResult = this.unitFormatPipeInstance.transform(this.cursorPositions[index].x, 's');
                let yResult = this.unitFormatPipeInstance.transform(this.cursorPositions[index].y, 'V');
                return xResult + ' (' + yResult + ')';
            }
            else {
                let yResult = this.unitFormatPipeInstance.transform(this.cursorPositions[index].y, 'V');
                return yResult;
            }

        }

    }

    //Exports series data from chart to a csv on client side
    exportCsv(fileName: string) {
        console.log(this.seriesDataContainer);
        let oscChanArray = [];
        let laChanArray = [];
        for (let i = 0; i < this.oscopeChansActive.length; i++) {
            oscChanArray.push(i);
        }
        for (let i = oscChanArray.length; i < this.seriesDataContainer.length; i++) {
            laChanArray.push(i);
        }
        this.exportService.exportGenericCsv(fileName, this.seriesDataContainer, this.numSeries, [{
            instrument: 'Osc',
            seriesNumberOffset: 0,
            xUnit: 's',
            yUnit: 'V',
            channels: oscChanArray
        }, {
            instrument: 'LA',
            seriesNumberOffset: this.oscopeChansActive.length,
            xUnit: 's',
            yUnit: 'V',
            channels: laChanArray
        }]);
    }

    //Opens cursor modal menu and sets data on modal dismiss
    openCursorModal(event) {
        let popover = this.popoverCtrl.create(ModalCursorPage, {
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan,
            chartComponent: this
        });
        popover.present({
            ev: event
        });
    }

    openMathModal(event) {
        if (this.currentBufferArray.length === 0) { return; }
        let popover = this.popoverCtrl.create(MathModalPage, {
            chartComponent: this
        });
        popover.present({
            ev: event
        });
    }

    openChartModal(event) {
        /*let modal = this.modalCtrl.create(ChartModalPage, {
            chartComponent: this
        });
        modal.present();*/
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Export CSV', 'Export PNG', 'Export Osc Binary', 'Export LA Binary']
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            if (data.option === 'Export CSV') {
                this.exportCsv('WaveformsLiveData');
            }
            else if (data.option === 'Export PNG') {
                this.exportCanvasAsPng();
            }
            else if (data.option === 'Export Osc Binary') {
                this.exportService.exportBinary('WaveFormsLiveOscPacket', this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].instruments.osc.rawPacket);
            }
            else if (data.option === 'Export LA Binary') {
                this.exportService.exportBinary('WaveFormsLiveLAPacket', this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex].instruments.la.rawPacket);
            }
        });
        popover.present({
            ev: event
        });
    }

    private parseCursorChans(): number[] {
        let mappedVals = [];
        mappedVals[0] = this.cursor1Chan.slice(-1);
        mappedVals[0] = (this.cursor1Chan.indexOf('Osc') !== -1) ? mappedVals[0] : (parseInt(mappedVals[0]) + this.oscopeChansActive.length).toString();
        mappedVals[1] = this.cursor2Chan.slice(-1);
        mappedVals[1] = (this.cursor2Chan.indexOf('Osc') !== -1) ? mappedVals[1] : (parseInt(mappedVals[1]) + this.oscopeChansActive.length).toString();
        return mappedVals;
    }

    //Adds correct cursors from selection
    handleCursors() {
        let mappedVals = this.parseCursorChans();
        this.activeChannels[0] = mappedVals[0];
        this.activeChannels[1] = mappedVals[1];
        this.removeCursors();
        if (this.cursorType.toLowerCase() === 'time') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'x',
                    lineWidth: 2,
                    color: color,
                    snapToPlot: (this.activeChannels[i] - 1),
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    drawAnchor: true,
                    position: {
                        relativeX: 0.25 + i * 0.5,
                        relativeY: 0
                    },
                    dashes: 10 + 10 * i
                }
                this.chart.addCursor(options);
            }
        }
        else if (this.cursorType.toLowerCase() === 'track') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'xy',
                    lineWidth: 2,
                    color: color,
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    drawAnchor: true,
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
        else if (this.cursorType.toLowerCase() === 'voltage') {
            for (let i = 0; i < 2; i++) {
                let series = this.chart.getData();
                let color = series[this.activeChannels[i] - 1].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'y',
                    lineWidth: 2,
                    color: color,
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    drawAnchor: true,
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

        this.shouldShowIndividualPoints();
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
        if (seriesNum < this.oscopeChansActive.length + 1) {
            this.activeOscChannel = seriesNum;
        }
    }

    //Autoscale all axes on chart
    autoscaleAllAxes() {
        if (this.showFft) {
            this.drawFft(true);
            return;
        }
        this.autoscaleAxis('x', 0);
        for (let i = 0; i < this.oscopeChansActive.length; i++) {
            if (this.oscopeChansActive[i]) {
                this.autoscaleAxis('y', i);
            }
        }
    }

    //Autoscales single axis
    autoscaleAxis(axis: string, axisIndex: number) {
        let axes = this.chart.getAxes();
        if (axis === 'x') {
            let secsPerDiv = (axes.xaxis.datamax - axes.xaxis.datamin) / 10;
            let i = 0;
            while (secsPerDiv > this.secsPerDivVals[i] && i < this.secsPerDivVals.length - 1) {
                i++;
            }
            this.activeTPDIndex = i;
            this.chart.setActiveXIndex(this.activeTPDIndex);
            this.timeDivision = this.secsPerDivVals[i];
            this.base = ((axes.xaxis.datamax + axes.xaxis.datamin) / 2);
            this.setTimeSettings({
                timePerDiv: this.timeDivision,
                base: this.base
            }, true);
        }
        else if (axis === 'y') {
            if (this.oscopeChansActive[axisIndex] === false) {
                return;
            }
            if (this.currentBufferArray[axisIndex].y === undefined) {
                return;
            }
            let yAxisIndexer = 'y' + (axisIndex === 0 ? '' : (axisIndex + 1).toString()) + 'axis';
            let voltsPerDiv = (axes[yAxisIndexer].datamax - axes[yAxisIndexer].datamin) / 10;
            let i = 0;
            while (voltsPerDiv > this.voltsPerDivVals[i] && i < this.voltsPerDivVals.length - 1) {
                i++;
            }
            this.activeVPDIndex[axisIndex] = i;
            this.chart.setActiveYIndices(this.activeVPDIndex);
            this.voltBase[axisIndex] = (axes[yAxisIndexer].datamax + axes[yAxisIndexer].datamin) / 2;
            this.voltBase[axisIndex] = this.voltBase[axisIndex] - ((axes[yAxisIndexer].datamax + axes[yAxisIndexer].datamin) / 2) % this.voltsPerDivVals[this.activeVPDIndex[axisIndex]];
            this.voltDivision[axisIndex] = this.voltsPerDivVals[i];
            this.setSeriesSettings({
                seriesNum: axisIndex,
                voltsPerDiv: this.voltDivision[axisIndex],
                voltBase: this.voltBase[axisIndex]
            });
        }
        else {
            console.log('invalid axis');
        }
    }

    //Enables timeline view. Called when chart is initialized
    enableTimelineView() {
        this.timelineView = true;
        this.createTimelineChart([{ data: [[]] }]);
    }

    enableMath() {
        this.mathEnabled = true;
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
        if (this.activeVPDIndex[seriesNum] > this.voltsPerDivVals.length - 2) {
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
        if (this.activeTPDIndex > this.secsPerDivVals.length - 2) {
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
        if (seriesNum < this.oscopeChansActive.length) {
            this.oscopeChansActive[seriesNum] = !this.oscopeChansActive[seriesNum];
        }
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

    openDevicePinout(event) {
        let popover = this.popoverCtrl.create(PinoutPopover, undefined, {
            cssClass: 'pinoutPopover'
        });
        popover.present();
    }

    centerOnTrigger() {
        this.base = 0;
        let getAxes = this.chart.getAxes();
        let min = this.timeDivision * -5;
        let max = this.timeDivision * 5;
        getAxes.xaxis.options.min = min;
        getAxes.xaxis.options.max = max;
        this.chart.setupGrid();
        this.chart.draw();
        if (this.timelineView) {
            this.timelineChart.updateTimelineCurtains({ min: min, max: max });
        }
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
        this.exportService.exportCanvasAsPng(this.chart.getCanvas(), this.flotOverlayRef.canvas);
    }

    updateMath() {
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
                return this.unitFormatPipeInstance.transform(mathFunctions.getFrequency(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'Hz');

            case 'Pos Pulse Width':
                return 'Pos Pulse Width'

            case 'Pos Duty Cycle':
                return 'Pos Duty Cycle'

            case 'Period':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeriod(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 's');

            case 'Neg Pulse Width':
                return 'Neg Pulse Width'

            case 'Neg Duty Cycle':
                return 'Neg Duty Cycle'

            case 'Rise Rate':
                return 'Rise Rate'

            case 'Rise Time':
                return 'Rise Time'

            case 'Amplitude':
                return this.unitFormatPipeInstance.transform(mathFunctions.getAmplitude(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'V');

            case 'High':
                return 'High'

            case 'Low':
                return 'Low'

            case 'Peak to Peak':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeakToPeak(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'Vpp');

            case 'Maximum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMax(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'V');

            case 'Minimum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMin(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'V');

            case 'Mean':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMean(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'V');

            case 'RMS':
                return this.unitFormatPipeInstance.transform(mathFunctions.getRMS(this.chart, selectedMathInfoObj.channel, minIndex, maxIndex), 'V');

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

    calculateDataFromWindow(): { bufferSize: number, sampleFreq: number } {
        //100 points per division
        if (this.chart == undefined) {
            return {
                bufferSize: 0,
                sampleFreq: 0
            }
        }

        let numPoints = this.chart.width();
        //Need to sample at 100 times in 1 time division
        let sampleFreq = (numPoints / 10) * (1 / this.secsPerDivVals[this.activeTPDIndex]);

        numPoints = Math.min(numPoints * 2, this.deviceDescriptor.instruments.osc.chans[0].bufferSizeMax);

        sampleFreq = Math.min(Math.max(sampleFreq, this.deviceDescriptor.instruments.osc.chans[0].sampleFreqMin / 1000), this.deviceDescriptor.instruments.osc.chans[0].sampleFreqMax / 1000);

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
        let triggerLineRef;
        for (let i = 0; i < cursors.length; i++) {
            if (cursors[i].name === 'triggerLine') {
                triggerLineRef = cursors[i];
            }
        }
        let seriesNum = this.numSeries[0];
        let trigPosition = this.currentBufferArray[seriesNum].triggerPosition;
        if (trigPosition < 0 || trigPosition === undefined) { return; }
        let initialValue = 0;
        //Update trigger line
        let options = {
            position: {
                x: initialValue,
                relativeY: 0.5
            }
        }
        this.chart.setCursor(triggerLineRef, options);
        if (this.timelineView) {
            let timelineCursors = this.timelineChart.getCursors();
            let timelineTriggerLineRef;
            for (let i = 0; i < timelineCursors.length; i++) {
                if (timelineCursors[i].name === 'triggerLine') {
                    timelineTriggerLineRef = timelineCursors[i];
                }
            }
            let timelineOptions = options;
            timelineOptions['fullHeight'] = true;
            this.timelineChart.setCursor(timelineTriggerLineRef, timelineOptions);
            //add to timeline as well
        }
    }

    addTriggerLine(seriesNum) {
        let trigPosition = this.currentBufferArray[seriesNum].triggerPosition;
        if (trigPosition < 0 || trigPosition === undefined) { return; }
        let initialValue = 0;
        //Add trigger line
        let options = {
            name: 'triggerLine',
            mode: 'x',
            color: 'green',
            showIntersections: false,
            showLabel: false,
            movable: false,
            symbol: 'none',
            lineWidth: 2,
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
        //let triggerPosition = this.currentBufferArray[seriesNum].triggerPosition * this.currentBufferArray[seriesNum].dt;
        let triggerPosition = -1 * this.currentBufferArray[seriesNum].triggerDelay / Math.pow(10, 12) + this.currentBufferArray[seriesNum].dt * this.currentBufferArray[seriesNum].y.length / 2;
        /*if (triggerPosition < 0) {
            console.log('trigger not in buffer!');
            triggerPosition = -1 * this.currentBufferArray[seriesNum].triggerDelay / Math.pow(10, 12);
        }*/
        let getAxes = this.chart.getAxes();
        let poi = poiIndex * this.currentBufferArray[seriesNum].dt - (triggerPosition);
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
