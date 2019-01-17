import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController, PopoverController, Events } from 'ionic-angular';

//Components
import { OpenLoggerLoggerComponent } from '../../../components/logger/openlogger/openlogger-logger.component';
import { GenPopover } from '../../../components/gen-popover/gen-popover.component';
import { PinoutPopover } from '../../../components/pinout-popover/pinout-popover.component';
import { MathPopoverComponent, MathPassData, MathOutput } from '../../../components/math-popover/math-popover.component';
import { CursorPopoverComponent, CursorPassData, CursorChannel, CursorSelection } from '../../../components/cursor-popover/cursor-popover.component';
import { DigitalIoComponent } from '../../../components/digital-io/digital-io.component';
import { FgenComponent } from '../../../components/function-gen/function-gen.component';

//Pages
import { FileBrowserPage } from '../../file-browser/file-browser';

//Pipes
import { UnitFormatPipe } from '../../../pipes/unit-format.pipe';

//Services
import { LoggerPlotService } from '../../../services/logger-plot/logger-plot.service';
import { TooltipService } from '../../../services/tooltip/tooltip.service';
import { LoggerChartComponent } from '../../../components/logger-chart/logger-chart.component';
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

declare var mathFunctions: any;

@Component({
    templateUrl: "openlogger-logger.html"
})
export class OpenLoggerLoggerPage {
    @ViewChild('loggerComponent') loggerComponent: OpenLoggerLoggerComponent;
    @ViewChild('chart') loggerChart: LoggerChartComponent;
    @ViewChild('gpioComponent') gpioComponent: DigitalIoComponent;
    @ViewChild('fgenComponent') fGenComponent: FgenComponent;
    private dismissCallback: () => void;
    private unitFormatPipeInstance: UnitFormatPipe;
    private selectedMathInfo: MathOutput[] = [];
    private cursorInfo: CursorSelection;
    private isRoot: boolean = false;

    public activeDevice: DeviceService;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private loggerPlotService: LoggerPlotService,
        private modalCtrl: ModalController,
        private popoverCtrl: PopoverController,
        public tooltipService: TooltipService,
        private events: Events,
        private deviceManagerService: DeviceManagerService
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
        this.isRoot = this.navParams.get('isRoot') || this.isRoot;
        this.unitFormatPipeInstance = new UnitFormatPipe();

        this.activeDevice = this.deviceManagerService.getActiveDevice();
        // TODO: uncomment when gpio is implemented
        // this.readCurrentGpioStates()
        //     .then((data) => {
        //         console.log(data);
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });
    }
    
    ngOnInit() {
        this.cursorInfo = {
            currentType: 'disabled',
            currentChannels: {
                c1: {
                    instrument: 'daq',
                    channel: 1
                },
                c2: {
                    instrument: 'daq',
                    channel: 1
                }
            }
        };
        
        this.getAwgStatus();

        let toggle = this.fGenComponent.togglePromise.bind(this.fGenComponent);
        this.fGenComponent.togglePower = (event, index) => {
            if (this.loggerComponent.running) {                
                this.loggerComponent.messageQueue.push(() => toggle(event, index).catch(e => console.error(e)));
            } else {
                toggle(event, index).catch(e => console.error(e));
            }
        }
    }

    getAwgStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let chans = [];
            for (let i = 0; i < this.activeDevice.instruments.awg.numChans; i++) {
                chans.push(i + 1);
            }
            this.activeDevice.instruments.awg.getCurrentState(chans).subscribe(
                (data) => {
                    console.log(data);
                    this.fGenComponent.initializeFromGetStatus(data);
                    resolve(data);
                },
                (err) => {
                    console.log('error getting awg status');
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    snapViewToFront() {
        this.loggerComponent.viewMoved = false;
        this.loggerComponent.setViewToEdge();
        this.loggerPlotService.setViewToFront();
    }

    done() {
        this.navParams.get('onLoggerDismiss')();
        this.navCtrl.pop();
    }

    ngOnDestroy() {
        this.loggerPlotService.resetService();
    }

    runLogger() {
        this.loggerComponent.startLogger();
    }

    stopLogger() {
        this.loggerComponent.stopLogger();
    }

    openFileBrowser() {
        let modal = this.modalCtrl.create(FileBrowserPage);
        modal.present();
    }

    presentExportPop(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Export CSV', 'Export PNG']
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            if (data.option === 'Export CSV') {
                this.loggerComponent.exportCsv('LoggerData');
            }
            else if (data.option === 'Export PNG') {
                this.loggerComponent.exportCanvasAsPng();
            }
        });
        popover.present({
            ev: event
        });
    }

    openDevicePinout(event) {
        let popover = this.popoverCtrl.create(PinoutPopover, undefined, {
            cssClass: 'pinoutPopover'
        });
        popover.present();
    }

    openMathPopover(event) {
        let passData: MathPassData = {
            chart: this.loggerPlotService.chart,
            availableChans: [],
            selectedChan: {
                instrument: 'Analog',
                channel: 1,
                seriesOffset: 0
            },
            addedInfo: []
        };

        for (let i = 0; i < this.loggerComponent.daqChans.length; i++) {
            if (this.loggerComponent.dataContainers[i].data.length > 1) {
                passData.availableChans.push({
                    instrument: 'Analog',
                    channel: i + 1,
                    seriesOffset: i
                });
            }
        }

        let popover = this.popoverCtrl.create(MathPopoverComponent, {
            passData: passData
        });
        popover.onWillDismiss(() => {
            buttonSubjRef.unsubscribe();
        });
        popover.present({
            ev: event
        });
        let buttonSubjRef = popover.instance.buttonSubject.subscribe(
            (data: MathOutput) => {
                console.log(data);
                this.addMathInfo(data);
            },
            (err) => { },
            () => { }
        );
    }

    openCursorModal(event) {
        let availableChannels: CursorChannel[] = [];
        for (let i = 0; i < this.loggerComponent.daqChans.length; i++) {
            if (this.loggerComponent.dataContainers[i].data.length > 1) {
                availableChannels.push({
                    instrument: 'analog',
                    channel: i + 1
                });
            }
        }

        let passData: CursorPassData = {
            availableChannels: availableChannels,
            currentChannels: this.cursorInfo.currentChannels,
            currentType: this.cursorInfo.currentType
        }

        let popover = this.popoverCtrl.create(CursorPopoverComponent, {
            passData: passData
        });
        popover.onWillDismiss(() => {
            buttonSubjRef.unsubscribe();
        });
        popover.present({
            ev: event
        });
        let buttonSubjRef = popover.instance.cursorSelection.subscribe(
            (data: CursorSelection) => {
                console.log(data);
                this.handleCursors(data);
            },
            (err) => { },
            () => { }
        );
    }

    removeCursors() {
        let cursors = this.loggerPlotService.chart.getCursors();
        let length = cursors.length;
        for (let i = 0, j = 0; i < length; i++) {
            if (cursors[j].name !== 'triggerLine') {
                //cursor array shifts itself so always remove first entry in array
                this.loggerPlotService.chart.removeCursor(cursors[j]);
            }
            else {
                j++;
            }
        }
        this.loggerPlotService.cursorPositions = [{ x: null, y: null }, { x: null, y: null }];
    }

    handleCursors(newCursorData: CursorSelection) {
        this.cursorInfo = newCursorData;
        this.removeCursors();
        if (newCursorData.currentType === 'time') {
            for (let i = 0; i < 2; i++) {
                let seriesIndex;
                let cursorNum = i === 0 ? newCursorData.currentChannels.c1 : newCursorData.currentChannels.c2;
                seriesIndex = cursorNum.channel - 1;
                let series = this.loggerPlotService.chart.getData();
                let color = series[seriesIndex].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'x',
                    lineWidth: 2,
                    color: color,
                    snapToPlot: seriesIndex,
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
                this.loggerPlotService.chart.addCursor(options);
            }
        }
        else if (newCursorData.currentType === 'track') {
            for (let i = 0; i < 2; i++) {
                let seriesIndex;
                let cursorNum = i === 0 ? newCursorData.currentChannels.c1 : newCursorData.currentChannels.c2;
                seriesIndex = cursorNum.channel - 1;
                let series = this.loggerPlotService.chart.getData();
                let color = series[seriesIndex].color
                let options = {
                    name: 'cursor' + (i + 1),
                    mode: 'xy',
                    lineWidth: 2,
                    color: color,
                    showIntersections: false,
                    showLabel: false,
                    symbol: 'none',
                    drawAnchor: true,
                    snapToPlot: seriesIndex,
                    position: {
                        relativeX: 0.25 + i * 0.5,
                        relativeY: 0.25 + i * 0.5
                    },
                    dashes: 10 + 10 * i
                }
                this.loggerPlotService.chart.addCursor(options);
            }
        }
        else if (newCursorData.currentType === 'voltage') {
            for (let i = 0; i < 2; i++) {
                let seriesIndex;
                let cursorNum = i === 0 ? newCursorData.currentChannels.c1 : newCursorData.currentChannels.c2;
                seriesIndex = cursorNum.channel - 1;
                let series = this.loggerPlotService.chart.getData();
                let color = series[seriesIndex].color
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
                this.loggerPlotService.chart.addCursor(options);
            }
        }
    }

    getCursorInfo(cursorInfo: string) {
        if (cursorInfo === 'xDelta') {
            let result = this.unitFormatPipeInstance.transform(Math.abs(this.loggerPlotService.cursorPositions[1].x - this.loggerPlotService.cursorPositions[0].x), 's');
            return result;
        }
        else if (cursorInfo === 'yDelta') {
            let result = this.unitFormatPipeInstance.transform(Math.abs(this.loggerPlotService.cursorPositions[1].y - this.loggerPlotService.cursorPositions[0].y), 'V');
            return result;
        }
        else if (cursorInfo === 'xFreq') {
            if (this.loggerPlotService.cursorPositions[1].x === this.loggerPlotService.cursorPositions[0].x) { return 'Inf' };

            let result = this.unitFormatPipeInstance.transform((1 / Math.abs(this.loggerPlotService.cursorPositions[1].x - this.loggerPlotService.cursorPositions[0].x)), 'Hz');
            return result;
        }
        else if (cursorInfo === 'cursorPosition0' || cursorInfo === 'cursorPosition1') {
            let index = cursorInfo.slice(-1);
            if (this.loggerPlotService.cursorPositions[index].x !== undefined) {
                let xResult = this.unitFormatPipeInstance.transform(this.loggerPlotService.cursorPositions[index].x, 's');
                let yResult = this.unitFormatPipeInstance.transform(this.loggerPlotService.cursorPositions[index].y, 'V');
                return xResult + ' (' + yResult + ')';
            }
            else {
                let yResult = this.unitFormatPipeInstance.transform(this.loggerPlotService.cursorPositions[index].y, 'V');
                return yResult;
            }

        }

    }

    addMathInfo(mathOutput: MathOutput) {

        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.selectedMathInfo[i].mathInfo === mathOutput.mathInfo && this.selectedMathInfo[i].mathChannel.seriesOffset === mathOutput.mathChannel.seriesOffset) {
                this.selectedMathInfo.splice(i, 1);
                return;
            }
        }
        if (this.selectedMathInfo.length === 4) {
            this.selectedMathInfo.shift();
        }
        this.selectedMathInfo.push(mathOutput);
        this.updateMath();
    }

    updateMath() {
        let extremes = this.loggerPlotService.chart.getAxes().xaxis;
        let chartMin = extremes.min;
        let chartMax = extremes.max;
        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.loggerComponent.dataContainers[this.selectedMathInfo[i].mathChannel.seriesOffset].data.length < 2) {
                this.selectedMathInfo[i].value = '----';
                continue;
            }
            let seriesNum = this.selectedMathInfo[i].mathChannel.seriesOffset;
            let series = this.loggerPlotService.chart.getData();
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

    updateMathByName(selectedMathInfoObj: MathOutput, maxIndex: number, minIndex: number) {
        switch (selectedMathInfoObj.mathInfo) {
            case 'Frequency':
                return this.unitFormatPipeInstance.transform(mathFunctions.getFrequency(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'Hz');

            case 'Period':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeriod(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 's');

            case 'Amplitude':
                return this.unitFormatPipeInstance.transform(mathFunctions.getAmplitude(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Peak to Peak':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeakToPeak(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'Vpp');

            case 'Maximum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMax(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Minimum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMin(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Mean':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMean(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'RMS':
                return this.unitFormatPipeInstance.transform(mathFunctions.getRMS(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            default:
                return 'default'
        }
    }

    readCurrentGpioStates(): Promise<any> {
        return new Promise((resolve, reject) => {
            let chanArray = [];
            for (let i = 0; i < this.activeDevice.instruments.gpio.numChans; i++) {
                chanArray.push(i + 1);
            }
            this.activeDevice.instruments.gpio.read(chanArray).subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    if (err.gpio) {
                        let setToInputChanArray = [];
                        let inputStringArray = [];
                        for (let channel in err.gpio) {
                            for (let command in err.gpio[channel]) {
                                if (err.gpio[channel][command].statusCode === 1073741826 && err.gpio[channel][command].direction === 'tristate') {
                                    setToInputChanArray.push(parseInt(channel));
                                    inputStringArray.push('input');
                                }
                                else if (err.gpio[channel][command].statusCode === 1073741826 && err.gpio[channel][command].direction === 'output') {
                                    this.gpioComponent.gpioVals[parseInt(channel) - 1] = err.gpio[channel][command].value !== 0;
                                    this.gpioComponent.gpioDirections[parseInt(channel) - 1] = true;
                                }
                            }
                        }
                        if (setToInputChanArray.length > 0) {
                            this.activeDevice.instruments.gpio.setParameters(setToInputChanArray, inputStringArray).subscribe(
                                (data) => {
                                    console.log(data);
                                    resolve(data);
                                },
                                (err) => {
                                    console.log(err);
                                    reject(err);
                                },
                                () => { }
                            );
                        }
                        else {
                            resolve(err);
                        }
                    }
                    else {
                        reject(err);
                    }
                },
                () => { }
            );
        });
    }

    private fgenTutorialFinished(event) {

    }
}