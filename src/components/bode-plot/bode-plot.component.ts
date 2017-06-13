import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

//Components
import { DigilentChart } from 'digilent-chart-angular2/modules';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

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

    constructor(
        private deviceManagerService: DeviceManagerService
    ) {
        this.bodePlotOptions = this.generateBodeOptions();
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        if (this.activeDevice == undefined) {
            throw 'No Active Device';
        }
    }

    ngOnDestroy() {
        this.destroyed = true;
    }

    setAwgAndSingle(newFreq: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setAwg(newFreq)
                .flatMap((data) => {
                    console.log(data);
                    return this.setOsc(Math.min(500 * data / 1000, this.activeDevice.instruments.osc.chans[this.oscchan - 1].sampleFreqMax / 1000))
                })
                .flatMap((data) => {
                    console.log(data);
                    return this.single();
                })
                .subscribe(
                    (data) => {
                        this.readOsc()
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

    startSweep(startFreq: number, stopFreq: number, stepsPerDec: number): Promise<any> {
        this.bodeDataContainer[0].data = [];
        return new Promise((resolve, reject) => {
            let frequencyArray = this.buildFrequencyArray(startFreq, stopFreq, stepsPerDec);
            frequencyArray.reduce((previous, current, index, arr) => {
                return previous.then((data) => {
                    console.log(data);
                    console.log(previous, index);
                    console.log(arr.length);
                    console.log('continuing!!!');
                    return this.setAwgAndSingle(arr[index]);
                }).catch((e) => {
                    console.log(e);
                    alert(e);
                });
            }, Promise.resolve())
                .then((data) => {
                    console.log('DONE');
                    console.log(data);
                    console.log(this.bodeDataContainer);
                    this.bodePlot.setData(this.bodeDataContainer, true);
                })
                .catch((e) => {
                    console.log('promise chain catch');
                });
        });
    }

    private buildFrequencyArray(startFreq: number, stopFreq: number, stepsPerDec: number): number[] {
        let frequencyArray = [];
        let frequency = startFreq;
        let step = (frequency * 10) / stepsPerDec;
        frequencyArray.push(frequency);
        while (frequency + step <= stopFreq) {
            console.log('STEP');
            console.log(step);
            for (let i = 0; i < stepsPerDec - 1 && frequency + step <= stopFreq; i++) {
                frequency = frequency + step;
                frequencyArray.push(frequency);
                console.log(frequency);
            }
            step = (frequency * 10) / stepsPerDec;
        }
        if (frequencyArray.indexOf(stopFreq) === -1) {
            frequencyArray.push(stopFreq);
        }
        return frequencyArray;
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

    private setOsc(sampleFreq: number): Observable<any> {
        return Observable.create((observer) => {
            this.activeDevice.instruments.osc.setParameters([this.oscchan], [this.vOffset], [0.25], [sampleFreq], [1000], [0])
                .flatMap((data) => {
                    console.log(data);
                    let sourceObject = {
                        instrument: 'osc',
                        channel: this.oscchan,
                        type: 'risingEdge',
                        lowerThreshold: this.vOffset * 1000 - 30,
                        upperThreshold: this.vOffset * 1000
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

    private readOsc(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.instruments.osc.read([this.oscchan]).subscribe(
                (data) => {
                    console.log(data);
                    this.calculateFft();
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    if (this.destroyed) { 
                        reject('page destroyed');
                        return; 
                    }
                    setTimeout(() => {
                        this.readOsc()
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
        let amp = mathFunctions.getAmplitude(this.bodePlot.digilentChart, 0, 0, 1000, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        let freq = mathFunctions.getFrequency(this.bodePlot.digilentChart, 0, 0, 1000, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex][this.oscchan - 1].data);
        /*db: 20 * Math.log10(amp / 1),
        freq: freq*/
        this.bodeDataContainer[0].data.push([freq, 20 * Math.log10(amp / 1)])
        console.log(amp, freq);
    }

    setBaselineAmp() {

    }

    plotLoaded() {
        this.bodePlot.setData([{
            data: [
                [100, 20 * Math.log10(.9904 / .9995)],
                [200, 20 * Math.log10(.9585 / .9995)],
                [300, 20 * Math.log10(.887 / .9995)],
                [400, 20 * Math.log10(.807 / .9995)],
                [500, 20 * Math.log10(.895 / .9995)],
                [600, 20 * Math.log10(.860 / .9995)],
                [700, 20 * Math.log10(.823 / .9995)],
                [800, 20 * Math.log10(.787 / .9995)],
                [900, 20 * Math.log10(.756 / .9995)],
                [1000, 20 * Math.log10(.724 / .9995)],
                [1050, 20 * Math.log10(.660 / .9995)],
                [2000, 20 * Math.log10(.473 / .9995)],
                [3000, 20 * Math.log10(.330 / .9995)],
                [4000, 20 * Math.log10(.253 / .9995)],
                [5000, 20 * Math.log10(.206 / .9995)],
                [6000, 20 * Math.log10(.173 / .9995)],
                [7000, 20 * Math.log10(.150 / .9995)],
                [8000, 20 * Math.log10(.130 / .9995)],
                [9000, 20 * Math.log10(.117 / .9995)],
                [10000, 20 * Math.log10(.105 / .9995)]
            ],
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
                axisLabel: 'Amplitude (dB)',
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
                transform: ((xVal) => { return xVal === 0 ? 0.0001 : Math.log10(xVal) }),
                inverseTransform: ((xVal) => { return xVal === 0.0001 ? 0 : Math.pow(10, xVal) }),
                tickFormatter: ((val, axis) => { return this.unitFormatPipeInstance.transform(val, 'Hz') }),
                font: {
                    color: '#666666'
                }
            }
        }
        return fftChartOptions;
    }
}
