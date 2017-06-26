import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { ModalController, PopoverController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

//Pages
import { BodeModalPage } from '../../pages/bode-modal/bode-modal';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';
import { GenPopover } from '../gen-popover/gen-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { LoadingService } from '../../services/loading/loading.service';
import { StorageService } from '../../services/storage/storage.service';
import { ExportService } from '../../services/export/export.service';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Interfaces
import { DataContainer } from '../chart/chart.interface';

declare var $: any;
declare var mathFunctions: any;

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
    public baselineAmp: number;
    private activeDevice: DeviceService;
    private awgChan: number = 1;
    private oscchan: number = 1;
    private vpp: number = 2;
    private vOffset: number = 0;
    private destroyed: boolean = false;
    private bodeDataContainer: DataContainer[] = [{
        data: [],
        yaxis: 1,
        lines: {
            show: true
        },
        points: {
            show: true
        }
    }];
    private startTime: number;
    private timeoutTimer: number = 120000; //20 seconds
    private currentDataFormat: 'log' | 'linear' = 'log';
    private logLabel = 'Amplitude (dB)';
    private linLabel = 'Amplitude (V)';
    private startFreq: number;
    private stopFreq: number;
    public calibrationData: number[][];
    private localStorageCalibrationData: any;
    private flotOverlayRef: any;

    constructor(
        private deviceManagerService: DeviceManagerService,
        public tooltipService: TooltipService,
        private modalCtrl: ModalController,
        private loadingService: LoadingService,
        private storageService: StorageService,
        private exportService: ExportService,
        private popoverCtrl: PopoverController
    ) {
        this.bodePlotOptions = this.generateBodeOptions(true, true);
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.activeDevice.resetInstruments().subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
        if (this.activeDevice == undefined) {
            throw 'No Active Device';
        }
        this.loadPreviousCalibration()
            .then((data) => {
                console.log(data);
                this.calibrationData = data;
            })
            .catch((e) => {
                console.log(e);
            });
    }

    ngOnDestroy() {
        this.destroyed = true;
    }

    openExportPop(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Export CSV', 'Export PNG']
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            if (data.option === 'Export CSV') {
                this.exportCsv('WaveformsLiveData');
            }
            else if (data.option === 'Export PNG') {
                this.exportCanvasAsPng();
            }
        });
        popover.present({
            ev: event
        });
    }

    exportCsv(fileName: string) {
        this.exportService.exportGenericCsv(fileName, this.bodeDataContainer, [0], [{
            instrument: 'Osc',
            seriesNumberOffset: 0,
            xUnit: 'Hz',
            yUnit: this.currentDataFormat === 'log' ? 'dB' : 'V',
            channels: [0]
        }]);
    }

    exportCanvasAsPng() {
        this.bodePlot.digilentChart.triggerRedrawOverlay();
        this.exportService.exportCanvasAsPng(this.bodePlot.digilentChart.getCanvas(), this.flotOverlayRef.canvas);
    }

    setAwgAndSingle(newFreq: number, doNotPlotPoint?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setAwg(newFreq)
                .flatMap((data) => {
                    console.log(data);
                    let samplingObject = this.calcIdealSampleFreqAndBufferSize(data);
                    return this.setOsc(samplingObject.sampleFreq, samplingObject.bufferSize);
                })
                .flatMap((data) => {
                    console.log(data);
                    return this.single();
                })
                .subscribe(
                    (data) => {
                        this.startTime = performance.now();
                        this.readOsc(doNotPlotPoint)
                            .then((data) => {
                                console.log('read osc return');
                                resolve(data);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    },
                    (err) => {
                        console.log(err);
                        reject(err);
                    },
                    () => { }
                );
        });
        
    }

    startSweep(startFreq: number, stopFreq: number, stepsPerDec: number, logX: boolean, logY: boolean, sweepType: SweepType): Promise<any> {
        this.startFreq = startFreq;
        this.stopFreq = stopFreq;
        this.bodeDataContainer[0].data = [];
        this.currentDataFormat = logY ? 'log' : 'linear';

        let getAxes = this.bodePlot.digilentChart.getAxes();
        getAxes.yaxis.options.axisLabel = logY ? this.logLabel : this.linLabel;
        console.log(getAxes);
        getAxes.xaxis.options.min = startFreq;
        getAxes.xaxis.options.max = stopFreq;
        this.bodePlot.digilentChart.setupGrid();
        this.bodePlot.digilentChart.draw();
        return new Promise((resolve, reject) => {
            this.displayBodeModal()
                .then((data) => {
                    console.log(data);
                    if (!data) {
                        reject('interrupted');
                        return;
                    }
                    console.log('TODO DATA');
                    let loading = this.loadingService.displayLoading('Generating Bode Plot. Please wait...');
                    let frequencyArray;
                    if (sweepType === 'Log') {
                        frequencyArray = this.buildLogPointArray(startFreq, stopFreq, stepsPerDec);
                    }
                    else if (sweepType === 'Linear') {
                        frequencyArray = this.buildFrequencyArray(startFreq, stopFreq, stepsPerDec);
                    }
                    frequencyArray.reduce((previous, current, index, arr) => {
                        return previous.then((data) => {
                            console.log(data);
                            console.log(previous, index);
                            console.log(arr.length);
                            console.log('continuing!!!');
                            return this.setAwgAndSingle(arr[index]);
                        }).catch((e) => {
                            console.log(e);
                            return Promise.reject(e);
                        });
                    }, Promise.resolve())
                        .then((data) => {
                            console.log('DONE');
                            console.log(data);
                            console.log(this.bodeDataContainer);
                            loading.dismiss();
                            resolve('done');
                        })
                        .catch((e) => {
                            console.log('promise chain catch');
                            loading.dismiss();
                            reject(e);
                        });
                })
                .catch((e) => {
                    //TODO display error
                });
        });
    }

    private interpolateAmp(freq: number): number {
        let i = 0;
        console.log('INTERPOLATING');
        console.log(this.calibrationData);
        console.log('FREQUENCY TO INTERPOLATE');
        console.log(freq);
        
        for (; this.calibrationData[i][0] < freq; i++) { }
        console.log('FOUND INDEX');
        console.log(i);
        console.log(this.calibrationData);
        if (i === 0) {
            return this.calibrationData[i][1];
        }
        else if (i >= this.calibrationData.length) {
            return this.calibrationData[this.calibrationData.length - 1][1];
        }
        let slope = (this.calibrationData[i][1] - this.calibrationData[i - 1][1]) / (this.calibrationData[i][0] - this.calibrationData[i - 1][0]);
        let b = this.calibrationData[i][1] - this.calibrationData[i][0] * slope;
        console.log('INTERPOLATED AMP');
        console.log(slope * freq + b);
        return slope * freq + b;
    }

    private calcIdealSampleFreqAndBufferSize(waveFreq: number): { sampleFreq: number, bufferSize: number } {
        let sampleFreq;
        let bufferSize;

        if (waveFreq <= 1000) {
            //Small periods relatively high sample freq
            let prime = 3;
            sampleFreq = 1000 * waveFreq;
            bufferSize = 1000 * prime;
        }
        else if (waveFreq <= this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 10000) {
            //Larger periods relatively small sample freq
            let prime = 373;
            sampleFreq = 10 * waveFreq;
            bufferSize = 10 * prime;
        }
        else {
            //Not supported
            sampleFreq = this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 1000;
            bufferSize = 23604;
        }

        if (bufferSize % 2 === 1) {
            bufferSize++;
        }

        return { sampleFreq: sampleFreq, bufferSize: bufferSize };
    }

    private buildFrequencyArray(startFreq: number, stopFreq: number, stepsPerDec: number): number[] {
        let frequencyArray = [];
        let step = (stopFreq - startFreq) / stepsPerDec;
        for (let i = startFreq; i <= stopFreq; i = i + step) {
            frequencyArray.push(i);
        }

        return frequencyArray;
    }

    private buildLogPointArray(start: number, finish: number, stepsPerDec: number): number[] {
        console.log(start, finish);
        let testFreqArray = []; 
        let decades = 0;
        while (start * Math.pow(10, ++decades) < finish) { }
        let points = stepsPerDec * decades;
        let logStep = decades / points;
        let startPow = parseInt(start.toExponential().split('e')[1]);
        console.log(startPow);
        for (let i = 0; i <= points; i++) {
            testFreqArray.push(Math.pow(10, logStep * i) * start); 
        }
        if (testFreqArray[testFreqArray.length - 1] > finish) {
            let index = testFreqArray.length - 1;
            for (let i = testFreqArray.length - 1; testFreqArray[i] > finish; i--) {
                index = i;
            }
            console.log(index);
            testFreqArray.splice(index, testFreqArray.length - index);
        }
        if (testFreqArray.indexOf(finish) === -1) {
            testFreqArray.push(finish);
        }
        console.log(testFreqArray);
        return testFreqArray;
    }

    private setAwg(newFreq: number): Observable<any> {
        return Observable.create((observer) => {
            let actualSignalFreq = newFreq;
            this.activeDevice.instruments.awg.stop([this.awgChan])
                .flatMap((data) => {
                    console.log(data);
                    return this.activeDevice.instruments.awg.setRegularWaveform([this.awgChan], [{
                        signalType: 'sine',
                        signalFreq: newFreq,
                        vpp: this.vpp,
                        vOffset: this.vOffset
                    }]);
                })
                .flatMap((data) => {
                    console.log(data);
                    actualSignalFreq = data.awg[this.awgChan.toString()][0].actualSignalFreq / 1000;
                    return this.activeDevice.instruments.awg.run([this.awgChan]);
                })
                .subscribe(
                    (data) => {
                        console.log(data);
                        setTimeout(() => {
                            console.log('done waiting for awg start up');
                            observer.next(actualSignalFreq);
                            observer.complete();
                        }, data.awg[this.awgChan.toString()][0].wait);
                    },
                    (err) => {
                        observer.error(err);
                        observer.complete();
                    },
                    () => { }
                );
        });
    }

    private saveCalibration(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.saveCalibrationToDevice()
                .then((data) => {
                    console.log(data);
                    this.saveCalibrationToLocalStorage()
                        .then((data) => {
                            console.log(data);
                            resolve(data);
                        })
                        .catch((e) => {
                            console.log(e);
                            reject(e);
                        });
                })
                .catch((e) => {
                    console.log(e);
                    this.saveCalibrationToLocalStorage()
                        .then((data) => {
                            console.log(data);
                            resolve(data);
                        })
                        .catch((e) => {
                            console.log(e);
                            reject(e);
                        });
                });
        });
    }

    private saveCalibrationToDevice(): Promise<any> {
        return new Promise((resolve, reject) => {
            reject('not implemented');
        });
    }

    private saveCalibrationToLocalStorage(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.activeDevice.macAddress == undefined) { resolve(); return; }
            this.localStorageCalibrationData[this.activeDevice.macAddress] = this.calibrationData;
            this.storageService.saveData('bodeCalibration', JSON.stringify(this.localStorageCalibrationData));
            resolve('done');
        });
    }

    private loadPreviousCalibration(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.loadPreviousCalibrationFromDevice()
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    this.loadPreviousCalibrationFromLocalStorage()
                        .then((data) => {
                            resolve(data);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                });
        });
    }

    private loadPreviousCalibrationFromDevice(): Promise<any> {
        return new Promise((resolve, reject) => {
            reject('not implemented');
        });
    }

    private loadPreviousCalibrationFromLocalStorage(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.storageService.getData('bodeCalibration')
                .then((data) => {
                    if (data != undefined && this.activeDevice.macAddress != undefined) {
                        console.log(data);
                        let parsedData;
                        try {
                            parsedData = JSON.parse(data);
                        }
                        catch(e) {
                            reject(e);
                            return;
                        }
                        this.localStorageCalibrationData = parsedData;
                        console.log(parsedData);
                        console.log(this.activeDevice.macAddress);
                        console.log(parsedData[this.activeDevice.macAddress]);
                        if (parsedData[this.activeDevice.macAddress] != undefined) {
                            resolve(parsedData[this.activeDevice.macAddress]);
                        }
                        else {
                            reject('not found');
                        }
                    }
                    else {
                        console.log('no bode calibration data found');
                        reject('not found');
                    }
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });
        });
    }

    private displayBodeModal(exitAfterCalibrate?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let navParams = {
                bodePlotComponent: this
            };
            if (exitAfterCalibrate) {
                navParams['exit'] = true;
            }
            let modal = this.modalCtrl.create(BodeModalPage, navParams);
            modal.onWillDismiss((data) => {
                console.log(data);
                resolve(data);
            });
            modal.present();
        });
    }

    private setOsc(sampleFreq: number, bufferSize: number): Observable<any> {
        return Observable.create((observer) => {
            console.log(bufferSize);
            this.activeDevice.instruments.osc.setParameters([this.oscchan], [this.vOffset], [1], [sampleFreq], [Math.min(Math.max(10, bufferSize), 32000)], [0])
                .flatMap((data) => {
                    console.log(data);
                    let sourceObject = {
                        instrument: 'force'
                    };
                    let targetsObject = {
                        osc: [this.oscchan]
                    };
                    return this.activeDevice.instruments.trigger.setParameters([1], [sourceObject], [targetsObject])
                })
                .subscribe(
                (data) => {
                    observer.next();
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                    observer.complete();
                },
                () => { }
                );
        });
    }

    private single() {
        //TODO set an attempt count to timeout on a trigger
        return this.activeDevice.instruments.trigger.single([1]);
    }

    private readOsc(doNotPlotPoint?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.instruments.osc.read([this.oscchan]).subscribe(
                (data) => {
                    console.log(data);
                    if (doNotPlotPoint != undefined && doNotPlotPoint === true) {
                        resolve(data);
                        return;
                    }
                    this.calculateFft();
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    if (this.destroyed) { 
                        reject('page destroyed');
                        return; 
                    }
                    if (performance.now() - this.startTime > this.timeoutTimer) {
                        reject('timeout');
                        return;
                    }
                    setTimeout(() => {
                        this.readOsc(doNotPlotPoint)
                            .then((data) => {
                                resolve(data);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    }, 100);
                },
                () => { }
            );
        });
    }

    private calculateFft(onlyCalculate?: boolean) {
        console.log(this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex]);
        let amp = mathFunctions.getAmplitude(this.bodePlot.digilentChart, 0, 0, 0, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        let freq = mathFunctions.getFrequency(this.bodePlot.digilentChart, 0, 0, 0, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        /*db: 20 * Math.log10(amp / 1),
        freq: freq*/
        if (onlyCalculate) {
            return { freq: freq, amp: amp };
        }
        console.log('CURRENT DATA FORMAT');
        console.log(this.currentDataFormat);
        //Stop at 10mV floor
        if (amp < 0.01) {
            return;
        }
        let interpVal = this.interpolateAmp(freq);
        this.bodeDataContainer[0].data.push([freq, this.currentDataFormat === 'log' ? 20 * Math.log10(amp / interpVal) : amp]);
        console.log('AMP AND FREQ');
        console.log(amp, freq);
        console.log(this.bodePlotOptions);
        this.bodePlot.setData(this.bodeDataContainer, false);
        return { freq: freq, amp: amp };
    }

    //Required to handle promise catch
    openCalibrationModal() {
        this.displayBodeModal(true)
            .then((data) => {
                console.log(data);
                if (!data) {
                    //TODO calibration fail
                    return;
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }

    calibrate(): Promise<any> {
        this.calibrationData = [];
        return new Promise((resolve, reject) => {
            let frequencyArray = this.buildLogPointArray(1, 1000000, 2);
            console.log('CALIBRATION FREQ ARR');
            console.log(frequencyArray);
            frequencyArray.reduce((previous, current, index, arr) => {
                return previous.then((data) => {
                    console.log(data);
                    if (data == undefined) {
                        return this.setAwgAndSingle(arr[index], true);
                    }
                    console.log(previous, index);
                    console.log(arr.length);
                    let fftCalc = this.calculateFft(true);
                    this.calibrationData.push([fftCalc.freq, fftCalc.amp]);
                    console.log('continuing!!!');
                    return this.setAwgAndSingle(arr[index], true);
                }).catch((e) => {
                    console.log(e);
                    return Promise.reject(e);
                });
            }, Promise.resolve())
                .then((data) => {
                    let fftCalc = this.calculateFft(true);
                    this.calibrationData.push([fftCalc.freq, fftCalc.amp]);
                    console.log('DONE');
                    console.log(data);
                    console.log(this.calibrationData);
                    this.saveCalibration()
                        .then((data) => {
                            resolve(this.calibrationData);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                })
                .catch((e) => {
                    console.log('promise chain catch');
                    reject(e);
                });
        });
    }

    transformToLog(axis: 'y' | 'x') {
        if (axis === 'y' && this.currentDataFormat === 'log') { return; }
        let getAxes = this.bodePlot.digilentChart.getAxes();
        getAxes.yaxis.options.axisLabel = this.logLabel;
        for (let i = 0; i < this.bodeDataContainer[0].data.length; i++) {
            let interpVal = this.interpolateAmp(this.bodeDataContainer[0].data[i][0]);
            this.bodeDataContainer[0].data[i][axis === 'y' ? 1 : 0] = (axis === 'y' ? 20 * Math.log10(this.bodeDataContainer[0].data[i][1] / interpVal) : Math.log10(this.bodeDataContainer[0].data[i][0]));
        }
        this.currentDataFormat = 'log';
        this.bodePlot.setData(this.bodeDataContainer);
    }

    transformToLinear(axis: 'y' | 'x') {
        if (axis === 'y' && this.currentDataFormat === 'linear') { return; }
        let getAxes = this.bodePlot.digilentChart.getAxes();
        getAxes.yaxis.options.axisLabel = this.linLabel;
        for (let i = 0; i < this.bodeDataContainer[0].data.length; i++) {
            let interpVal = this.interpolateAmp(this.bodeDataContainer[0].data[i][0]);
            this.bodeDataContainer[0].data[i][axis === 'y' ? 1 : 0] = (axis === 'y' ? interpVal * Math.pow(10, this.bodeDataContainer[0].data[i][1] / 20) : Math.pow(10, this.bodeDataContainer[0].data[i][0]));
        }
        this.currentDataFormat = 'linear';
        this.bodePlot.setData(this.bodeDataContainer);
    }

    plotLoaded() {
        this.bodePlot.digilentChart.hooks.drawOverlay.push(this.getOverlayRef.bind(this));
    }

    getOverlayRef(plot: any, ctx: any) {
        this.flotOverlayRef = ctx;
    }

    generateBodeOptions(logX: boolean, logY: boolean) {
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
                    right: 28,
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
                    return (this.unitFormatPipeInstance.transform(xval, 'Hz') + ' (' + this.unitFormatPipeInstance.transform(yval, 'dB') + ')');
                },
                onHover: (flotItem, tooltipel) => {
                    let color = flotItem.series.color;
                    tooltipel[0].style.borderBottomColor = color;
                    tooltipel[0].style.borderTopColor = color;
                    tooltipel[0].style.borderLeftColor = color;
                    tooltipel[0].style.borderRightColor = color;
                }
            },
            cursorMoveOnPan: true,
            yaxis: {
                position: 'left',
                axisLabel: this.linLabel,
                axisLabelColour: '#666666',
                axisLabelPadding: 20,
                axisLabelUseCanvas: true,
                show: true,
                tickColor: '#666666',
                font: {
                    color: '#666666'
                }
            },
            xaxis: {
                tickColor: '#666666',
                ticks: this.tickGenerator,
                tickFormatter: ((val, axis) => { 
                    let intVal = parseInt(val);
                    if (intVal === 1 || intVal === 10 || intVal === 100 || intVal === 1000 || intVal === 10000 || intVal === 100000 || intVal === 1000000 || intVal === 10000000) {
                        return this.unitFormatPipeInstance.transform(val, 'Hz');
                    }
                    return '';
                }),
                font: {
                    color: '#666666'
                }
            }
        }
        if (logY) {
            console.log('changing label to DB!!!!!!');
            fftChartOptions.yaxis.axisLabel = this.logLabel;
        }
        if (logX) {
            fftChartOptions.xaxis['transform'] = ((xVal) => { return xVal === 0 ? 0.0001 : Math.log10(xVal) });
            fftChartOptions.xaxis['inverseTransform'] = ((xVal) => { return xVal === 0.0001 ? 0 : Math.pow(10, xVal) });
        }
        console.log(fftChartOptions);
        return fftChartOptions;
    }

    autoscaleAllAxes() {
        this.bodePlot.setData(this.bodeDataContainer, true);
    }

    private tickGenerator(axis): number[] {
        let min = axis.min;
        let max = axis.max;
        console.log(min, max);
        let startPow = parseInt(parseFloat(min).toExponential().split('e')[1]);
        let finishPow = parseInt(parseFloat(max).toExponential().split('e')[1]);
        console.log(startPow, finishPow);
        let ticks = [];
        for (let i = startPow; i < finishPow; i++) {
            for (let j = 1; j < 11; j++) {
                ticks.push(j * Math.pow(10, i));
            }
        }
        console.log(ticks);
        return ticks;
    }
}

export type SweepType = 'Log' | 'Linear';