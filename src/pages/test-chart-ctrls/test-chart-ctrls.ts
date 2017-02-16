import { App, Platform, NavParams } from 'ionic-angular';
import { ViewChild, Component } from '@angular/core';

//Components
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { DeviceComponent } from '../../components/device/device.component';
import { TriggerComponent } from '../../components/trigger/trigger.component';
import { FgenComponent } from '../../components/function-gen/function-gen.component';
import { DigitalIoComponent } from '../../components/digital-io/digital-io.component';


//Services
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { StorageService } from '../../services/storage/storage.service';
import { ToastService } from '../../services/toast/toast.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';


@Component({
    templateUrl: 'test-chart-ctrls.html'
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    @ViewChild('triggerComponent') triggerComponent: TriggerComponent;
    @ViewChild('gpioComponent') gpioComponent: DigitalIoComponent;
    @ViewChild('fgenComponent') fgenComponent: FgenComponent;
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
    public activeDevice: DeviceComponent;
    public storage: StorageService;

    public chartReady: boolean = false;
    public toastService: ToastService;
    public clickBindReference;
    public readAttemptCount: number = 0;
    public previousOscSettings: any[] = [];
    public previousTrigSettings: any = {
        instrument: null,
        channel: null,
        type: null,
        lowerThreshold: null,
        upperThreshold: null
    };
    public previousLaSettings: any[] = [];

    public theoreticalAcqTime: number;
    public readingOsc: boolean = false;
    public readingLa: boolean = false;

    public currentOscReadArray: number[];
    public currentLaReadArray: number[];

    constructor(
        _deviceManagerService: DeviceManagerService,
        _storage: StorageService,
        _toastService: ToastService,
        _tooltipService: TooltipService,
        _app: App,
        _params: NavParams,
        _platform: Platform
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
    }

    executeHelp() {
        this.tutorialMode = false;
        this.fgenComponent.finishTutorial();
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

    abortSingle() {
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
            this.tutorialFinished();
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
        switch (this.triggerComponent.edgeDirection) {
            case 'rising': trigType = 'risingEdge'; break;
            case 'falling': trigType = 'fallingEdge'; break;
            default: trigType = 'risingEdge';
        }
        let samplingParams = this.chart1.calculateDataFromWindow();
        this.theoreticalAcqTime = 1000 * (samplingParams.bufferSize / samplingParams.sampleFreq);
        console.log(':::::TRIGGER DELAY::::::');
        console.log(this.chart1.base);
        let triggerDelay = Math.max(Math.min(parseFloat(this.chart1.base.toString()), this.activeDevice.instruments.osc.chans[0].delayMax / Math.pow(10, 12)), this.activeDevice.instruments.osc.chans[0].delayMin / Math.pow(10, 12));
        console.log(this.theoreticalAcqTime);
        console.log(triggerDelay);

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

            if (this.previousOscSettings[i].offset !== 0 || this.previousOscSettings[i].gain !== this.activeDevice.instruments.osc.chans[i].gains[j] ||
                this.previousOscSettings[i].sampleFreqMax !== samplingParams.sampleFreq ||
                this.previousOscSettings[i].bufferSizeMax !== samplingParams.bufferSize ||
                this.previousOscSettings[i].delay !== triggerDelay ||
                this.previousOscSettings[i].active !== this.chart1.oscopeChansActive[i]) {
                setOscParams = true;
                setTrigParams = true;
            }
            if (this.chart1.oscopeChansActive[i]) {
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
            if (this.previousLaSettings[i].sampleFreq !== samplingParams.sampleFreq ||
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
                //Still acquiring
            },
            () => {
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
            if (this.activeDevice.instruments.osc.dataBufferWriteIndex - 1 < 0) {
                oscBufferArray = this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBuffer.length - 1];
            }
            else {
                oscBufferArray = this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex - 1];
            }
        }
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (oscBufferArray[i] == undefined) {
                oscBufferArray[i] = [];
            }
        }
        currentBufferArray = oscBufferArray;
        if (this.gpioComponent.laActiveChans.indexOf(true) !== -1) {
            if (this.activeDevice.instruments.la.dataBufferWriteIndex - 1 < 0) {
                laBufferArray = this.activeDevice.instruments.la.dataBuffer[this.activeDevice.instruments.la.dataBuffer.length - 1];
            }
            else {
                laBufferArray = this.activeDevice.instruments.la.dataBuffer[this.activeDevice.instruments.la.dataBufferWriteIndex - 1];
            }
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
    }

    //Enable cursors and timeline view
    initSettings() {
        this.chart1.enableCursors();
        this.chart1.enableTimelineView();
        this.chart1.enableMath();
    }
}
