import { App, Platform, NavParams, LoadingController } from 'ionic-angular';
import { ViewChild, Component } from '@angular/core';

//Components
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { TriggerComponent } from '../../components/trigger/trigger.component';
import { FgenComponent } from '../../components/function-gen/function-gen.component';
import { DigitalIoComponent } from '../../components/digital-io/digital-io.component';
import { DcSupplyComponent } from '../../components/dc-supply/dc-supply.component';
import { YAxisComponent } from '../../components/yaxis-controls/yaxis-controls.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { StorageService } from '../../services/storage/storage.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

//Interfaces
import { PreviousLaSettings, PreviousOscSettings, PreviousTrigSettings } from './test-chart-ctrls.interface';

@Component({
    templateUrl: 'test-chart-ctrls.html'
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    @ViewChild('triggerComponent') triggerComponent: TriggerComponent;
    @ViewChild('gpioComponent') gpioComponent: DigitalIoComponent;
    @ViewChild('fgenComponent') fgenComponent: FgenComponent;
    @ViewChild('dcComponent') dcComponent: DcSupplyComponent;
    @ViewChild('yaxisComponent') yaxisComponent: YAxisComponent;
    public app: App;
    public platform: Platform;
    public params: NavParams;
    public tooltipService: TooltipService;
    public controlsVisible = false;
    public botVisible = false;
    public sideVisible = false;
    public running: boolean = false;
    public triggerStatus: string = 'Idle';
    public tutorialMode: boolean = false;
    public tutorialStage: number = 0;

    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceService;
    public storage: StorageService;

    public chartReady: boolean = false;
    public toastService: ToastService;
    public clickBindReference;
    public readAttemptCount: number = 0;
    public previousOscSettings: PreviousOscSettings[] = [];
    public previousTrigSettings: PreviousTrigSettings = {
        instrument: null,
        channel: null,
        type: null,
        lowerThreshold: null,
        upperThreshold: null
    };
    public previousLaSettings: PreviousLaSettings[] = [];

    public theoreticalAcqTime: number;
    public readingOsc: boolean = false;
    public readingLa: boolean = false;

    public currentOscReadArray: number[];
    public currentLaReadArray: number[];
    public forceTriggerInterval: number = 100;

    constructor(
        _deviceManagerService: DeviceManagerService,
        _storage: StorageService,
        _toastService: ToastService,
        _tooltipService: TooltipService,
        _app: App,
        _params: NavParams,
        _platform: Platform,
        public loadingCtrl: LoadingController
    ) {
        this.toastService = _toastService;
        this.tooltipService = _tooltipService;
        this.app = _app;
        this.params = _params;
        this.tutorialMode = this.params.get('tutorialMode') || false;
        this.platform = _platform;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.storage = _storage;
        console.log(this.tutorialMode);
        this.getOscStatus()
            .then(() => {
                return this.getAwgStatus();
            })
            .then(() => {
                return this.getTriggerStatus();
            })
            .then(() => {
                return this.setGpioToInputs('input');
            })
            .then(() => {
                return this.getVoltages();
            })
            .catch((e) => {
                console.log(e);
            });
    }

    resetDevice() {
        console.log('reset device');
        let loading = this.displayLoading();
        this.chart1.initializeValues();
        this.previousLaSettings = [];
        this.previousOscSettings = [];
        this.previousTrigSettings = {
            instrument: null,
            channel: null,
            type: null,
            lowerThreshold: null,
            upperThreshold: null
        };
        this.fgenComponent.initializeValues();
        this.activeDevice.resetInstruments().subscribe(
            (data) => {
                setTimeout(() => {
                    this.gpioComponent.gpioDirections.forEach((val, index, array) => {
                        this.gpioComponent.gpioDirections[index] = false;
                        this.gpioComponent.gpioVals[index] = false;
                    });
                    this.setGpioToInputs('input').then(() => {
                        loading.dismiss();
                    }).catch((e) => {
                        console.log('error setting gpio to inputs');
                        console.log(e);
                    });
                }, data.device[0].wait);
            },
            (err) => {
                loading.dismiss();
                this.toastService.createToast('deviceResetError');
            },
            () => { }
        );
    }

    displayLoading(message?: string) {
        message = message == undefined ? 'Resetting Device...' : message;
        let loading = this.loadingCtrl.create({
            content: message,
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });

        loading.present();

        return loading;
    }

    getVoltages(): Promise<any> {
        let chans = [];
        for (let i = 0; i < this.activeDevice.instruments.dc.numChans; i++) {
            chans.push(i + 1);
        }
        return new Promise((resolve, reject) => {
            this.activeDevice.instruments.dc.getVoltages(chans).subscribe(
                (data) => {
                    console.log(data);
                    this.dcComponent.initializeFromGetStatus(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => {
                    //console.log('getVoltage Done');
                }
            );
        });
    }

    getOscStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            let chans = [];
            for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
                chans.push(i + 1);
            }
            this.activeDevice.instruments.osc.getCurrentState(chans).subscribe(
                (data) => {
                    console.log(data);
                    this.chart1.initializeFromGetStatus(data);
                    resolve(data);
                },
                (err) => {
                    console.log('error getting osc status');
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
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
                    this.fgenComponent.initializeFromGetStatus(data);
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

    setGpioToInputs(direction: 'input' | 'output'): Promise<any> {
        return new Promise((resolve, reject) => {
            let chanArray = [];
            let valArray = [];
            for (let i = 0; i < this.activeDevice.instruments.gpio.numChans; i++) {
                chanArray.push(i + 1);
                valArray.push(direction);
            }
            this.activeDevice.instruments.gpio.setParameters(chanArray, valArray).subscribe(
                (data) => {
                    console.log('set direction');
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => {

                }
            );
        });
    }

    getTriggerStatus() {
        return new Promise((resolve, reject) => {
            this.activeDevice.instruments.trigger.getCurrentState([1]).subscribe(
                (data) => {
                    console.log(data);
                    this.triggerComponent.initializeFromGetStatus(data);
                    resolve(data);
                },
                (err) => {
                    console.log('error getting trigger status');
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    executeHelp() {
        this.tutorialMode = false;
        this.fgenComponent.finishTutorial();
        this.triggerComponent.endTutorial();
    }

    startTutorial() {
        this.tutorialStage = 1;
    }

    startFgenTutorial() {
        this.tutorialStage = 0;
        this.fgenComponent.startTutorial();
    }

    fgenTutorialFinished(event) {
        console.log(event);
        this.startTriggerTutorial();
    }

    startTriggerTutorial() {
        this.tutorialStage = 0;
        this.triggerComponent.startTutorial();
    }

    triggerTutorialFinished(event) {
        console.log(event);
        this.tutorialStage = 3;
    }

    tutorialFinished() {
        this.tutorialMode = false;
        this.tutorialStage = 0;
    }

    proceedToNextStage() {
        this.tutorialStage++;
    }

    requestFullscreen() {
        let conf = confirm("Fullscreen mode?");
        let docelem: any = document.documentElement;

        if (conf == true) {
            if (docelem.requestFullscreen) {
                docelem.requestFullscreen();
            }
            else if (docelem.mozRequestFullScreen) {
                docelem.mozRequestFullScreen();
            }
            else if (docelem.webkitRequestFullScreen) {
                docelem.webkitRequestFullScreen();
            }
            else if (docelem.msRequestFullscreen) {
                docelem.msRequestFullscreen();
            }
        }
        document.getElementById('instrument-panel-container').removeEventListener('click', this.clickBindReference);
    }

    ngOnDestroy() {
        if (this.running) {
            this.running = false;
            this.readingLa = false;
            this.readingOsc = false;
        }
    }

    //Alert user with toast if no active device is set
    ngOnInit() {
        if (this.deviceManagerService.activeDeviceIndex === undefined) {
            console.log('in if');
            this.toastService.createToast('noActiveDevice', true);
        }
        else {
            this.chartReady = true;
            this.chart1.loadDeviceSpecificValues(this.activeDevice);
            for (let i = 0; i < this.activeDevice.instruments.osc.numChans; i++) {
                this.previousOscSettings.push({
                    offset: null,
                    gain: null,
                    sampleFreqMax: null,
                    bufferSizeMax: null,
                    delay: null,
                    active: false
                });
            }
            for (let i = 0; i < this.activeDevice.instruments.la.numChans; i++) {
                this.previousLaSettings.push({
                    sampleFreq: null,
                    bufferSize: null,
                    active: false
                });
            }
        }
    }

    ionViewDidEnter() {
        this.app.setTitle('Instrument Panel');
        if (this.platform.is('android') && this.platform.is('mobileweb')) {
            //Have to create bind reference to remove listener since .bind creates new function reference
            this.clickBindReference = this.requestFullscreen.bind(this);
            document.getElementById('instrument-panel-container').addEventListener('click', this.clickBindReference);
        }
        if (this.tutorialMode) {
            this.startTutorial();
        }
    }

    abortSingle(ignoreResponse?: boolean) {
        ignoreResponse = ignoreResponse == undefined ? false : ignoreResponse;
        this.activeDevice.instruments.trigger.stop([1]).subscribe(
            (data) => {
                console.log(data);
                if (this.running) {
                    this.running = false;
                }
                this.readingLa = false;
                this.readingOsc = false;
                this.triggerStatus = 'Idle';
            },
            (err) => {
                console.log(err);
                if (ignoreResponse) {
                    if (this.running) {
                        this.running = false;
                    }
                    this.readingLa = false;
                    this.readingOsc = false;
                    this.triggerStatus = 'Idle';
                    if (err === 'TX Error: ') {
                        this.toastService.createToast('timeout', true);
                    }
                    return;
                }
                this.toastService.createToast('triggerStopError', true);
            },
            () => { }
        );
    }

    //Toggle sidecontrols
    toggleControls() {
        this.controlsVisible = !this.controlsVisible;
    }

    //Toggle bot controls 
    toggleBotControls() {
        this.botVisible = !this.botVisible;
    }

    generateOscReadArray() {

    }

    //Run osc single
    singleClick(forceWholeCommand?: boolean) {
        if (this.tutorialMode) {
            this.proceedToNextStage();
        }
        this.readAttemptCount = 0;
        forceWholeCommand = forceWholeCommand == undefined ? false : forceWholeCommand;

        if (this.chart1.oscopeChansActive.indexOf(true) === -1 && this.gpioComponent.laActiveChans.indexOf(true) === -1) {
            this.toastService.createToast('noChannelsActive', true);
            return;
        }
        this.triggerStatus = 'Armed';
        let setTrigParams = false;
        let setOscParams = false;
        let setLaParams = false;

        let trigSourceArr = this.triggerComponent.triggerSource.split(' ');
        if (trigSourceArr[2] === undefined) {
            trigSourceArr[2] = '1';
        }
        let trigType;
        console.log(this.triggerComponent.edgeDirection);
        switch (this.triggerComponent.edgeDirection) {
            case 'rising': trigType = 'risingEdge'; break;
            case 'falling': trigType = 'fallingEdge'; break;
            default: trigType = 'risingEdge';
        }


        this.theoreticalAcqTime = 0;

        //this.theoreticalAcqTime = 1000 * (samplingParams.bufferSize / samplingParams.sampleFreq);

        let triggerDelay = Math.max(Math.min(parseFloat(this.chart1.base.toString()), this.activeDevice.instruments.osc.chans[0].delayMax / Math.pow(10, 12)), this.activeDevice.instruments.osc.chans[0].delayMin / Math.pow(10, 12));

        if (this.previousTrigSettings.instrument !== trigSourceArr[0] || this.previousTrigSettings.channel !== parseInt(trigSourceArr[2]) ||
            this.previousTrigSettings.type !== trigType || this.previousTrigSettings.lowerThreshold !== parseInt(this.triggerComponent.lowerThresh) ||
            this.previousTrigSettings.upperThreshold !== parseInt(this.triggerComponent.upperThresh)) {
            setTrigParams = true;
        }

        let oscArray = [[], [], [], [], [], []];
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            let range = this.chart1.voltDivision[i] * 10;
            let j = 0;
            while (range * this.activeDevice.instruments.osc.chans[i].gains[j] > this.activeDevice.instruments.osc.chans[i].adcVpp / 1000 &&
                j < this.activeDevice.instruments.osc.chans[i].gains.length
            ) {
                j++;
            }

            let samplingParams: { sampleFreq: number, bufferSize: number } = this.chart1.calculateDataFromWindow();
            if (!this.yaxisComponent.lockedSampleState[i].sampleFreqLocked) {
                samplingParams.sampleFreq = this.yaxisComponent.lockedSampleState[i].manualSampleFreq;
            }
            if (!this.yaxisComponent.lockedSampleState[i].sampleSizeLocked) {
                samplingParams.bufferSize = this.yaxisComponent.lockedSampleState[i].manualSampleSize;
            }

            if (this.previousOscSettings[i] == undefined || this.previousOscSettings[i].offset !== 0 || this.previousOscSettings[i].gain !== this.activeDevice.instruments.osc.chans[i].gains[j] ||
                this.previousOscSettings[i].sampleFreqMax !== samplingParams.sampleFreq ||
                this.previousOscSettings[i].bufferSizeMax !== samplingParams.bufferSize ||
                this.previousOscSettings[i].delay !== triggerDelay ||
                this.previousOscSettings[i].active !== this.chart1.oscopeChansActive[i]) {
                setOscParams = true;
                setTrigParams = true;
            }
            if (this.chart1.oscopeChansActive[i]) {
                let tempTheoreticalAcqTime = 1000 * (samplingParams.bufferSize / samplingParams.sampleFreq);
                if (tempTheoreticalAcqTime > this.theoreticalAcqTime) {
                    this.theoreticalAcqTime = tempTheoreticalAcqTime;
                }
                oscArray[0].push(i + 1);
                oscArray[1].push(0);
                oscArray[2].push(this.activeDevice.instruments.osc.chans[i].gains[j]);
                oscArray[3].push(samplingParams.sampleFreq);
                oscArray[4].push(samplingParams.bufferSize);
                oscArray[5].push(triggerDelay);
            }
            this.previousOscSettings[i] = {
                offset: 0,
                gain: this.activeDevice.instruments.osc.chans[i].gains[j],
                sampleFreqMax: samplingParams.sampleFreq,
                bufferSizeMax: samplingParams.bufferSize,
                delay: triggerDelay,
                active: this.chart1.oscopeChansActive[i]
            }
        }

        let laArray = [[], [], []];
        for (let i = 0; i < this.gpioComponent.laActiveChans.length; i++) {
            let samplingParams: { sampleFreq: number, bufferSize: number } = this.chart1.calculateDataFromWindow();
            if (this.previousLaSettings[i] == undefined || this.previousLaSettings[i].sampleFreq !== samplingParams.sampleFreq ||
                this.previousLaSettings[i].bufferSize !== samplingParams.bufferSize ||
                this.previousLaSettings[i].active !== this.gpioComponent.laActiveChans[i]) {
                setLaParams = true;
                setTrigParams = true;
            }
            if (this.gpioComponent.laActiveChans[i]) {
                laArray[0].push(i + 1);
                laArray[1].push(samplingParams.sampleFreq);
                laArray[2].push(samplingParams.bufferSize);
            }
            this.previousLaSettings[i] = {
                sampleFreq: samplingParams.sampleFreq,
                bufferSize: samplingParams.bufferSize,
                active: this.gpioComponent.laActiveChans[i]
            }
        }

        this.currentLaReadArray = laArray[0];
        this.currentOscReadArray = oscArray[0];

        let singleCommand = {}

        let targetsObject = {};
        if (oscArray[0].length > 0) {
            targetsObject['osc'] = oscArray[0];
            this.readingOsc = true;
        }
        if (laArray[0].length > 0) {
            console.log('adding la');
            targetsObject['la'] = laArray[0];
            this.readingLa = true;
        }

        if ((setOscParams || forceWholeCommand) && oscArray[0].length > 0) {
            singleCommand['osc'] = {};
            singleCommand['osc']['setParameters'] = [oscArray[0], oscArray[1], oscArray[2], oscArray[3], oscArray[4], oscArray[5]];
        }
        if ((setLaParams || forceWholeCommand) && laArray[0].length > 0) {
            singleCommand['la'] = {};
            singleCommand['la']['setParameters'] = [laArray[0], laArray[1], laArray[2]];
        }
        singleCommand['trigger'] = {};
        if (setTrigParams || forceWholeCommand) {
            console.log('setting trigger params');
            console.log(this.triggerComponent.lowerThresh, this.triggerComponent.upperThresh);
            singleCommand['trigger']['setParameters'] = [
                [1],
                [
                    {
                        instrument: trigSourceArr[0].toLowerCase(),
                        channel: parseInt(trigSourceArr[2]),
                        type: trigType,
                        lowerThreshold: parseInt(this.triggerComponent.lowerThresh),
                        upperThreshold: parseInt(this.triggerComponent.upperThresh)
                    }
                ],
                [
                    targetsObject
                ]
            ];
        }

        //TODO if trigger single error, send whole set parameter multi command.
        singleCommand['trigger']['single'] = [[1]];
        /*if (this.triggerComponent.edgeDirection === 'off') {
            singleCommand['trigger']['forceTrigger'] = [[1]];
        }*/
        console.log(singleCommand);
        this.activeDevice.multiCommand(singleCommand).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
                if (err.agent != undefined) {
                    this.toastService.createToast('agentNoActiveDevice');
                }
                //Might still acquiring from previous session
                this.abortSingle(true);
            },
            () => {
                if (this.triggerComponent.edgeDirection === 'off') {
                    this.forceTrigger()
                        .then(() => {
                            console.log('done force trigger');
                            if (this.activeDevice.transport.getType() !== 'local') {
                                setTimeout(() => {
                                    this.readOscope(oscArray[0]);
                                    this.readLa(laArray[0]);
                                }, this.theoreticalAcqTime);
                            }
                            else {
                                this.readOscope(oscArray[0]);
                                this.readLa(laArray[0]);
                            }
                        })
                        .catch((e) => {
                            console.log('fail force trigger');
                        });
                    return;
                }
                if (this.activeDevice.transport.getType() !== 'local') {
                    setTimeout(() => {
                        this.readOscope(oscArray[0]);
                        this.readLa(laArray[0]);
                    }, this.theoreticalAcqTime);
                }
                else {
                    this.readOscope(oscArray[0]);
                    this.readLa(laArray[0]);
                }
            }
        );

        this.previousTrigSettings = {
            instrument: trigSourceArr[0],
            channel: parseInt(trigSourceArr[2]),
            type: trigType,
            lowerThreshold: parseInt(this.triggerComponent.lowerThresh),
            upperThreshold: parseInt(this.triggerComponent.upperThresh)
        };


    }

    forceTrigger(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.readingLa && !this.readingOsc) {
                reject();
                return;
            }
            this.activeDevice.instruments.trigger.forceTrigger([1]).subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    if (err.trigger && err.trigger["1"][0].statusCode === 2684354590) {
                        resolve();
                        return;
                    }
                    setTimeout(() => {
                        return this.forceTrigger()
                            .then((data) => {
                                resolve(data);
                            })
                            .catch((e) => {
                                reject();
                            });
                    }, this.forceTriggerInterval);
                },
                () => { }
            );
        });
    }

    readLa(readArray: number[]) {
        /*for (let i = 0; i < this.gpioComponent.laActiveChans.length; i++) {
            if (this.gpioComponent.laActiveChans[i]) {
                readArray.push(i + 1);
            }
        }*/
        if (readArray.length < 1) {
            this.readingLa = false;
            return;
        }
        this.activeDevice.instruments.la.read(readArray).subscribe(
            (data) => {
                this.readingLa = false;
                console.log(data);
                this.readAttemptCount = 0;
                this.checkReadStatusAndDraw();
            },
            (err) => {
                if (this.readingLa) {
                    console.log('attempting read again');
                    this.readAttemptCount++;
                    let waitTime = this.readAttemptCount * 100 > 1000 ? 1000 : this.readAttemptCount * 100;
                    setTimeout(() => {
                        this.readLa(readArray);
                    }, waitTime);
                }
            },
            () => { }
        );
    }

    checkReadStatusAndDraw() {
        if (this.readingOsc || this.readingLa) {
            return;
        }

        if (this.chart1.oscopeChansActive.indexOf(true) === -1 && this.gpioComponent.laActiveChans.indexOf(true) === -1) {
            if (this.running) {
                this.running = false;
            }
            return;
        }

        let numSeries = [];
        for (let i = 0; i < this.currentOscReadArray.length; i++) {
            numSeries.push(this.currentOscReadArray[i] - 1);
        }
        for (let i = 0; i < this.currentLaReadArray.length; i++) {
            numSeries.push(this.currentLaReadArray[i] - 1 + this.chart1.oscopeChansActive.length);
        }
        this.chart1.clearExtraSeries(numSeries);

        let currentBufferArray;
        let oscBufferArray = [];
        let laBufferArray = null;
        if (this.chart1.oscopeChansActive.indexOf(true) !== -1) {
            oscBufferArray = this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferReadIndex];
        }
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (oscBufferArray[i] == undefined) {
                oscBufferArray[i] = [];
            }
        }
        currentBufferArray = oscBufferArray;
        if (this.gpioComponent.laActiveChans.indexOf(true) !== -1) {
            laBufferArray = this.activeDevice.instruments.la.dataBuffer[this.activeDevice.instruments.la.dataBufferReadIndex];
            currentBufferArray = currentBufferArray.concat(laBufferArray);
        }
        /*if (oscBufferArray == null) {
            currentBufferArray = oscFillerBuff.concat(laBufferArray);
        }
        else {
            currentBufferArray = laBufferArray ? oscBufferArray.concat(oscFillerBuff).concat(laBufferArray) : oscBufferArray.concat(oscFillerBuff);
        }*/
        this.chart1.setCurrentBuffer(currentBufferArray);
        let start = performance.now();
        this.chart1.flotDrawWaveform(true, false);
        let finish = performance.now();
        console.log('decimate and draw: ' + (finish - start));
        this.triggerStatus = 'Idle';
        if (this.running) {
            this.runClick();
        }
    }

    readOscope(readArray: number[]) {
        /*let readArray = [];*/
        /*for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (this.chart1.oscopeChansActive[i]) {
                readArray.push(i + 1);
            }
        }*/
        if (readArray.length < 1) {
            this.readingOsc = false;
            return;
        }
        this.activeDevice.instruments.osc.read(readArray).subscribe(
            (data) => {
                this.readingOsc = false;
                this.readAttemptCount = 0;
                this.checkReadStatusAndDraw();
            },
            (err) => {
                if (this.readingOsc) {
                    console.log('attempting read again');
                    this.readAttemptCount++;
                    let waitTime = this.readAttemptCount * 100 > 1000 ? 1000 : this.readAttemptCount * 100;
                    setTimeout(() => {
                        this.readOscope(readArray);
                    }, waitTime);
                }
            },
            () => {
            }
        );
    }

    //Stream osc buffers
    runClick() {
        if (this.readingOsc || this.readingLa) { return; }
        if (!this.running) {
            //first iteration
            this.running = true;
            this.singleClick();
            return;
        }
        this.activeDevice.instruments.trigger.single([1]).subscribe(
            (data) => {

            },
            (err) => {
                this.running = false;
                console.log('error trigger single');
            },
            () => {
                this.triggerStatus = 'Armed';
                for (let i = 0; i < this.gpioComponent.laActiveChans.length; i++) {
                    if (this.gpioComponent.laActiveChans[i]) {
                        this.readingLa = true;
                        break;
                    }
                }
                for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
                    if (this.chart1.oscopeChansActive[i]) {
                        this.readingOsc = true;
                        break;
                    }
                }
                setTimeout(() => {
                    this.readOscope(this.currentOscReadArray);
                    this.readLa(this.currentLaReadArray);
                }, this.theoreticalAcqTime);

            }
        );

    }

    //Stop dc stream
    stopClick() {
        console.log('stop');
        this.running = false;
        this.abortSingle(true);
    }

    //Enable cursors and timeline view
    initSettings() {
        this.chart1.enableCursors();
        this.chart1.enableTimelineView();
        this.chart1.enableMath();
    }
}
