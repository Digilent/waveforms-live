import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

//Pages
import { BodeModalPage } from '../../pages/bode-modal/bode-modal';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { LoadingService } from '../../services/loading/loading.service';
import { StorageService } from '../../services/storage/storage.service';

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
    public initialAmplitude: number = 1;
    private currentDataFormat: 'log' | 'linear' = 'log';
    private logLabel = 'Amplitude (dB)';
    private linLabel = 'Amplitude (V)';
    private startFreq: number;
    private stopFreq: number;
    private calibrationData: number[][];

    constructor(
        private deviceManagerService: DeviceManagerService,
        public tooltipService: TooltipService,
        private modalCtrl: ModalController,
        private loadingService: LoadingService,
        private storageService: StorageService
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
            })
            .catch((e) => {
                console.log(e);
            });
    }

    ngOnDestroy() {
        this.destroyed = true;
    }

    setAwgAndSingle(newFreq: number, doNotPlotPoint?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setAwg(newFreq)
                .flatMap((data) => {
                    console.log(data);
                    return this.setOsc(Math.min(10 * data / 1000, this.activeDevice.instruments.osc.chans[this.oscchan - 1].sampleFreqMax / 1000))
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
                    actualSignalFreq = data.awg[this.awgChan.toString()][0].actualSignalFreq;
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
                })
                .catch((e) => {
                    console.log(e);
                });
            this.saveCalibrationToLocalStorage()
                .then((data) => {
                    console.log(data);
                })
                .catch((e) => {
                    console.log(e);
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
            this.storageService.saveData('bodeCalibration', JSON.stringify({
                bodeCalibrationData: this.calibrationData
            }));
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
                    if (data != undefined) {
                        console.log(data);
                        resolve(data);
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

    private displayBodeModal(): Promise<any> {
        return new Promise((resolve, reject) => {
            let modal = this.modalCtrl.create(BodeModalPage, {
                bodePlotComponent: this
            });
            modal.onWillDismiss((data) => {
                console.log(data);
                resolve(data);
            });
            modal.present();
        });
    }

    private setOsc(sampleFreq: number): Observable<any> {
        return Observable.create((observer) => {

            let bufferSize = (Math.floor(sampleFreq) % 2 === 0 ? Math.floor(sampleFreq) : Math.floor(sampleFreq) + 1);
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

    private calculateFft() {
        console.log(this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex]);
        let amp = mathFunctions.getAmplitude(this.bodePlot.digilentChart, 0, 0, 32000, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        let freq = mathFunctions.getFrequency(this.bodePlot.digilentChart, 0, 0, 32000, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        /*db: 20 * Math.log10(amp / 1),
        freq: freq*/
        console.log('CURRENT DATA FORMAT');
        console.log(this.currentDataFormat);
        //Stop at 10mV floor
        if (amp < 0.01) {
            return;
        }
        this.bodeDataContainer[0].data.push([freq, this.currentDataFormat === 'log' ? 20 * Math.log10(amp / this.initialAmplitude) : amp]);
        console.log('AMP AND FREQ');
        console.log(amp, freq);
        console.log(this.bodePlotOptions);
        this.bodePlot.setData(this.bodeDataContainer, false);
    }

    setBaselineAmp(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setAwgAndSingle(this.startFreq, true)
                .then((data) => {
                    console.log(data);
                    this.initialAmplitude = mathFunctions.getAmplitude(this.bodePlot.digilentChart, 0, 0, 32000, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
                    resolve(this.initialAmplitude);
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });

        });
    }

    transformToLog(axis: 'y' | 'x') {
        if (axis === 'y' && this.currentDataFormat === 'log') { return; }
        let getAxes = this.bodePlot.digilentChart.getAxes();
        getAxes.yaxis.options.axisLabel = this.logLabel;
        for (let i = 0; i < this.bodeDataContainer[0].data.length; i++) {
            this.bodeDataContainer[0].data[i][axis === 'y' ? 1 : 0] = (axis === 'y' ? 20 * Math.log10(this.bodeDataContainer[0].data[i][1] / this.initialAmplitude) : Math.log10(this.bodeDataContainer[0].data[i][0]));
        }
        this.currentDataFormat = 'log';
        this.bodePlot.setData(this.bodeDataContainer);
    }

    transformToLinear(axis: 'y' | 'x') {
        if (axis === 'y' && this.currentDataFormat === 'linear') { return; }
        let getAxes = this.bodePlot.digilentChart.getAxes();
        getAxes.yaxis.options.axisLabel = this.linLabel;
        for (let i = 0; i < this.bodeDataContainer[0].data.length; i++) {
            this.bodeDataContainer[0].data[i][axis === 'y' ? 1 : 0] = (axis === 'y' ? this.initialAmplitude * Math.pow(10, this.bodeDataContainer[0].data[i][1] / 20) : Math.pow(10, this.bodeDataContainer[0].data[i][0]));
        }
        this.currentDataFormat = 'linear';
        this.bodePlot.setData(this.bodeDataContainer);
    }

    plotLoaded() {
        
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
            zoomPan: {
                enabled: true
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
        let startPow = parseInt(parseFloat(min).toExponential().split('e')[1]);
        let finishPow = parseInt(parseFloat(max).toExponential().split('e')[1]);
        let ticks = [];
        for (let i = startPow; i < finishPow; i++) {
            for (let j = 1; j < 11; j++) {
                ticks.push(j * Math.pow(10, i));
            }
        }
        return ticks;
    }
}

export type SweepType = 'Log' | 'Linear';