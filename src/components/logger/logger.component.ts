import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { LoadingService } from '../../services/loading/loading.service';
import { ToastService } from '../../services/toast/toast.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { DropdownPopoverComponent } from '../dropdown-popover/dropdown-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { UtilityService } from '../../services/utility/utility.service';
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';

//Interfaces
import { DataContainer } from '../chart/chart.interface';

@Component({
    templateUrl: 'logger.html',
    selector: 'logger-component'
})
export class LoggerComponent {
    @ViewChildren('dropPopOverflow') overflowChildren: QueryList<DropdownPopoverComponent>;
    @ViewChildren('dropPopLocation') locationChildren: QueryList<DropdownPopoverComponent>;
    @ViewChildren('dropPopLink') linkChildren: QueryList<DropdownPopoverComponent>;
    @ViewChild('dropPopProfile') profileChild: DropdownPopoverComponent;
    @ViewChild('dropPopMode') modeChild: DropdownPopoverComponent;
    private activeDevice: DeviceService;
    public showLoggerSettings: boolean = true;
    public showAnalogChan: boolean[] = [];
    public showDigitalChan: boolean[] = [];
    private defaultAnalogParams: AnalogLoggerParams = {
        gain: 1,
        vOffset: 0,
        maxSampleCount: -1,
        sampleFreq: 1000000,
        startDelay: 0,
        overflow: 'stop',
        storageLocation: 'ram',
        uri: '',
        startIndex: 0,
        count: 0,
        state: 'idle',
        linked: false,
        linkedChan: -1
    }
    public analogChans: AnalogLoggerParams[] = [];
    public digitalChans: DigitalLoggerParams[] = [];
    private analogChanNumbers: number[] = [];
    private digitalChanNumbers: number[] = [];
    public overflowConditions: string[] = ['stop', 'circular'];
    public modes: string[] = ['log', 'stream', 'both'];
    private selectedMode: string = this.modes[0];
    public storageLocations: string[] = ['cloud'];
    public loggingProfiles: string[] = ['New Profile'];
    public selectedLogProfile: string = this.loggingProfiles[0];
    private defaultProfileName: string = 'NewProfile';
    public profileNameScratch: string = this.defaultProfileName;
    public analogLinkOptions: string[][] = [];
    private profileObjectMap: any = {};
    public running: boolean = false;
    private dataContainers: DataContainer[] = [];
    private viewMoved: boolean = false;
    private analogChansToRead: number[] = [];
    private subscriptionRef;

    constructor(
        private devicemanagerService: DeviceManagerService,
        private loadingService: LoadingService,
        private toastService: ToastService,
        private utilityService: UtilityService,
        public loggerPlotService: LoggerPlotService
    ) {
        this.activeDevice = this.devicemanagerService.devices[this.devicemanagerService.activeDeviceIndex];
        let loading = this.loadingService.displayLoading('Loading device info...');
        this.init();
        this.loadDeviceInfo()
            .then((data) => {
                console.log(data);
                loading.dismiss();
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('deviceDroppedConnection', true, undefined, 5000);
                loading.dismiss();
            });
    }

    ngOnDestroy() {
        this.subscriptionRef.unsubscribe();
    }

    private init() {
        this.subscriptionRef = this.loggerPlotService.chartPan.subscribe(
            (data) => {
                console.log('GOT PAN EVENT');
                if (this.running) {
                    this.viewMoved = true;
                }
            },
            (err) => {},
            () => { }
        );
        for (let i = 0; i < 2/* this.activeDevice.instruments.logger.analog.numChans */; i++) {
            this.analogChans.push(Object.assign({}, this.defaultAnalogParams));
            this.showAnalogChan.push(i === 0);

            this.analogLinkOptions[i] = ['no'];
            for (let j = 0; j < this.analogLinkOptions.length; j++) {
                if (i !== j) {
                    this.analogLinkOptions[j].push('Ch ' + (i + 1).toString());
                    this.analogLinkOptions[i].push('Ch ' + (j + 1).toString());
                }
            }
        }
        for (let i = 0; i < this.analogChans.length; i++) {
            this.analogChanNumbers.push(i + 1);
            this.dataContainers.push({
                data: [],
                yaxis: i + 1,
                lines: {
                    show: true
                },
                points: {
                    show: false
                }
            });
        }
        for (let i = 0; i < this.digitalChans.length; i++) {
            this.digitalChanNumbers.push(i + 1);
            this.dataContainers.push({
                data: [],
                yaxis: i + 1 + this.analogChans.length,
                lines: {
                    show: true
                },
                points: {
                    show: false
                }
            })
        }
    }

    private loadDeviceInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            let analogChanArray = [];
            let digitalChanArray = [];
            for (let i = 0; i < this.analogChans.length; i++) {
                analogChanArray.push(i + 1);
            }
            for (let i = 0; i < this.digitalChans.length; i++) {
                digitalChanArray.push(i + 1);
            }
            if (analogChanArray.length < 1 && digitalChanArray.length < 1) { 
                resolve('done');
                return; 
            }

            this.getStorageLocations()
                .then((data) => {
                    console.log(data);
                    if (data && data.device && data.device[0]) {
                        data.device[0].storageLocations.forEach((el, index, arr) => {
                            if (el !== 'flash') {
                                this.storageLocations.unshift(el);
                            }
                        });
                    }
                    return this.loadProfilesFromDevice();
                })
                .then((data) => {
                    console.log(data);
                    return this.getCurrentState('analog', analogChanArray);
                    //return this.analogGetMultipleChannelStates(analogChanArray);
                })
                .catch((e) => {
                    console.log(e);
                    return this.getCurrentState('analog', analogChanArray);
                    //return this.analogGetMultipleChannelStates(analogChanArray);
                })
                .then((data) => {
                    console.log(data);
                    return this.getCurrentState('digital', digitalChanArray);
                })
                .then((data) => {
                    console.log(data);
                    console.log(this.analogChans);
                    resolve(data);
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });
        });
    }

    xAxisValChange(event) {
        console.log(event);
        this.loggerPlotService.setValPerDivAndUpdate('x', 1, event);
    }

    private setView() {
        if (this.viewMoved) { return; }
        if (this.dataContainers[0].data[0] == undefined || this.dataContainers[0].data[0][0] == undefined) {
            //Data was cleared
            this.loggerPlotService.setPosition('x', 1, this.loggerPlotService.xAxis.base * 5, true);
            return;
        }
        let rightPos = this.dataContainers[0].data[this.dataContainers[0].data.length - 1][0];
        for (let i = 1; i < this.dataContainers.length; i++) {
            let tempRightPos = this.dataContainers[i].data[this.dataContainers[i].data.length - 1][0];
            rightPos = tempRightPos > rightPos ? tempRightPos : rightPos;
        }
        let span = this.loggerPlotService.xAxis.base * 10;
        let leftPos = rightPos - span;
        if (leftPos < 0) { return; }
        let newPos = (rightPos + leftPos) / 2;
        this.loggerPlotService.setPosition('x', 1, newPos, false);
    }

    modeSelect(event) {
        console.log(event);
        if (this.selectedMode === 'stream' && event !== 'stream') {
            for (let i = 0; i < this.analogChans.length; i++) {
                this.analogChans[i].storageLocation = this.storageLocations[0];
                this.setChannelDropdowns(i, {
                    storageLocation: this.storageLocations[0]
                });
            }
            for (let i = 0; i < this.digitalChans.length; i++) {
                this.digitalChans[i].storageLocation = this.storageLocations[0];
                //TODO update to support digital in setChannelDropdowns
                /* this.setChannelDropdowns(i, {
                    storageLocation: this.storageLocations[0]
                }); */
            }
        }
        if (event === 'stream') {
            for (let i = 0; i < this.analogChans.length; i++) {
                this.analogChans[i].storageLocation = 'ram';
            }
            for (let i = 0; i < this.digitalChans.length; i++) {
                this.digitalChans[i].storageLocation = 'ram';
            }
        }
        this.selectedMode = event;
    }

    linkSelect(event, instrument: 'analog' | 'digital', channel: number) {
        console.log(event);
        if (event === 'no') {
            if (this.analogChans[channel].linked) {
                let linkedChan = this.analogChans[channel].linkedChan;
                this.copyLoggingProfile(instrument, channel, this.analogChans[linkedChan]);
                this.setChannelDropdowns(channel, {
                    storageLocation: this.analogChans[linkedChan].storageLocation,
                    overflow: this.analogChans[linkedChan].overflow,
                    linkChan: -1
                });
            }
            this.analogChans[channel].linked = false;
            this.analogChans[channel].linkedChan = -1;
            return;
        }
        let linkChan: number = event.split(' ')[1] - 1;
        console.log('linked chan selection: ' + linkChan);
        if (instrument === 'analog') {
            if (this.analogChans[linkChan].linked) {
                //TODO display error
                console.log('linked to linked channel');
                let id = 'link' + channel;
                this.linkChildren.forEach((child) => {
                    if (id === child.elementRef.nativeElement.id) {
                        child._applyActiveSelection('no');
                    }
                });
                return;
            }
            this.copyLoggingProfile('analog', channel, this.analogChans[linkChan]);
            this.analogChans[channel].linked = true;
            this.analogChans[channel].linkedChan = linkChan;
            this.setChannelDropdowns(channel, {
                storageLocation: this.analogChans[channel].storageLocation,
                overflow: this.analogChans[channel].overflow,
                linkChan: linkChan
            });
        }
        else {
            
        }
        console.log(this.analogChans);
    }

    private copyLoggingProfile(instrument: 'analog' | 'digital', channel: number, source: any) {
        let instrumentChan = instrument === 'analog' ? this.analogChans : this.digitalChans;
        instrumentChan[channel].count = source.count;
        instrumentChan[channel].maxSampleCount = source.maxSampleCount;
        instrumentChan[channel].overflow = source.overflow;
        instrumentChan[channel].sampleFreq = source.sampleFreq;
        instrumentChan[channel].startDelay = source.startDelay;
        instrumentChan[channel].startIndex = source.startIndex;
        instrumentChan[channel].storageLocation = source.storageLocation;

        if (instrument === 'analog') {
            (<AnalogLoggerParams>instrumentChan[channel]).gain = source.gain;
            (<AnalogLoggerParams>instrumentChan[channel]).vOffset = source.vOffset;
        }
        else {
            (<DigitalLoggerParams>instrumentChan[channel]).bitMask = source.bitMask;
        }
    }

    private setChannelDropdowns(channel: number, applyOptions: { storageLocation?: string, overflow?: string, linkChan?: number }) {
        setTimeout(() => {
            if (applyOptions.linkChan != undefined) {
                let linkedChanString = applyOptions.linkChan > -1 ? 'Ch ' +  (applyOptions.linkChan + 1) : 'no';
                let id = 'link' + channel;
                this.linkChildren.forEach((child) => {
                    if (id === child.elementRef.nativeElement.id) {
                        child._applyActiveSelection(linkedChanString);
                    }
                });
            }

            if (applyOptions.storageLocation != undefined) {
                let id = 'location' + channel;
                this.locationChildren.forEach((child) => {
                    if (id === child.elementRef.nativeElement.id) {
                        child._applyActiveSelection(applyOptions.storageLocation);
                    }
                });
            }

            if (applyOptions.overflow != undefined) {
                let id = 'overflow' + channel;
                this.overflowChildren.forEach((child) => {
                    if (id === child.elementRef.nativeElement.id) {
                        child._applyActiveSelection(applyOptions.overflow);
                    }
                });
            }
        }, 20);
    }

    overflowSelect(event, instrument: 'analog' | 'digital', channel: number) {
        console.log(event);
        if (instrument === 'analog') {
            this.analogChans[channel].overflow = event;
        }
        else {
            this.digitalChans[channel].overflow = event;
        }
    }

    locationSelect(event, instrument: 'analog' | 'digital', channel: number) {
        console.log(event);
        if (instrument === 'analog') {
            this.analogChans[channel].storageLocation = event;
        }
        else {
            this.digitalChans[channel].storageLocation = event;
        }
    }

    profileSelect(event) {
        console.log(event);
        this.selectedLogProfile = event;
        if (event === this.loggingProfiles[0]) { return; }
        if (this.profileObjectMap[event] == undefined) {
            //TODO present error message
            console.log('profile not found in profile map');
            this.selectedLogProfile = this.loggingProfiles[0];
            return;
        }
        this.parseAndApplyProfileJson(this.profileObjectMap[event]);
    }

    saveAndSetProfile() {
        this.saveProfile(this.profileNameScratch)
        .then((data) => {
            this.toastService.createToast('loggerSaveSuccess');
        })
        .catch((e) => {
            console.log(e);
            this.toastService.createToast('loggerSaveFail');
        });
        let nameIndex: number = this.loggingProfiles.indexOf(this.profileNameScratch);
        if (nameIndex !== -1) {
            this.loggingProfiles.splice(nameIndex, 1);
        }
        this.loggingProfiles.push(this.profileNameScratch);
        this.selectedLogProfile = this.profileNameScratch;
        this.profileNameScratch = this.defaultProfileName;
        setTimeout(() => {
            this.profileChild._applyActiveSelection(this.selectedLogProfile);
        }, 50);
    }

    loadProfilesFromDevice(): Promise<any> {
        return new Promise((resolve, reject) => {
            /* TODO: Make sure /profiles exists and then list the files in the directory to get the names */
            let profileName = 'test.json';
            this.activeDevice.file.read('flash', profileName, 0, -1).subscribe(
                (data) => {
                    console.log(data);
                    let parsedData;
                    try {
                        parsedData = JSON.parse(data.file);
                    }
                    catch(e) {
                        console.log('error parsing json');
                        reject(e);
                        return;
                    }
                    let splitArray = profileName.split('.');
                    this.loggingProfiles.push(splitArray[0]);
                    this.profileObjectMap[splitArray[0]] = parsedData;
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    private generateProfileJson() {
        let saveObj = {};
        if (this.analogChans.length > 0) {
            saveObj['analog'] = {};
        }
        if (this.digitalChans.length > 0) {
            saveObj['digital'] = {};
        }
        for (let i = 0; i < this.analogChans.length; i++) {
            saveObj['analog'][i.toString()] = this.analogChans[i];
        }
        for (let i = 0; i < this.digitalChans.length; i++) {
            saveObj['digital'][i.toString()] = this.analogChans[i];
        }
        return saveObj;
    }

    private parseAndApplyProfileJson(loadedObj) {
        for (let instrument in loadedObj) {
            for (let channel in loadedObj[instrument]) {
                if (instrument === 'analog') {
                    this.analogChans[parseInt(channel)] = loadedObj[instrument][channel];
                    this.analogChans[parseInt(channel)].count = this.defaultAnalogParams.count;
                    this.analogChans[parseInt(channel)].startIndex = this.defaultAnalogParams.startIndex;
                }
                else if (instrument === 'digital') {
                    this.digitalChans[parseInt(channel)] = loadedObj[instrument][channel];
                    this.digitalChans[parseInt(channel)].count = this.defaultAnalogParams.count;
                    this.digitalChans[parseInt(channel)].startIndex = this.defaultAnalogParams.startIndex;
                }
                //Wait for ngFor to execute on the dropPops (~20ms) before we apply the active selections (there has to be a better way)

                let dropdownChangeObj = {
                    storageLocation: loadedObj[instrument][channel].storageLocation,
                    overflow: loadedObj[instrument][channel].overflow
                };
                if (loadedObj[instrument][channel].linked) {
                    dropdownChangeObj['linkChan'] = loadedObj[instrument][channel].linkedChan;
                }
                this.setChannelDropdowns(parseInt(channel), dropdownChangeObj);
            }
        }
    }

    private saveProfile(profileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < this.analogChans.length; i++) {
                if (this.analogChans[i].linked) {
                    this.copyLoggingProfile('analog', i, this.analogChans[this.analogChans[i].linkedChan]);
                }
            }

            for (let i = 0; i < this.digitalChans.length; i++) {
                if (this.digitalChans[i].linked) {
                    this.copyLoggingProfile('digital', i, this.digitalChans[this.digitalChans[i].linkedChan]);
                }
            }

            let objToSave = this.generateProfileJson();
            let str = JSON.stringify(objToSave);
            let buf = new ArrayBuffer(str.length);
            let bufView = new Uint8Array(buf);
            for (let i = 0; i < str.length; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            this.activeDevice.file.write('flash', profileName + '.json', buf).subscribe(
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
        });
    }

    private getStorageLocations(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.storageGetLocations().subscribe(
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
        });
    }

    formatInputAndUpdate(trueValue: number, instrument: 'analog' | 'digital', type: LoggerInputType, channel: number) {
        console.log(trueValue);
        let chanType = instrument === 'analog' ? this.analogChans[channel] : this.digitalChans[channel];
        switch (type) {
            case 'delay':
                chanType.startDelay = trueValue;
                break;
            case 'offset':
                (<AnalogLoggerParams>chanType).vOffset = trueValue;
                break;
            case 'samples':
                chanType.maxSampleCount = trueValue;
                break;
            case 'sampleFreq':
                chanType.sampleFreq = trueValue;
                break;
            default:
                break;
        }
    }

    stopLogger() {
        this.stop('analog', this.analogChanNumbers)
            .then((data) => {
                console.log(data);
                return this.stop('digital', this.digitalChanNumbers);
            })
            .then((data) => {
                console.log(data);
                this.running = false;
            })
            .catch((e) => {
                console.log(e);
            });
    }

    private clearChart() {
        for (let i = 0; i < this.dataContainers.length; i++) {
            this.dataContainers[i].data = [];
        }
        this.loggerPlotService.setData(this.dataContainers, false);
    }

    private parseReadResponseAndDraw(readResponse) {
        let startAxis = 1;
        for (let instrument in readResponse.instruments) {
            for (let channel in readResponse.instruments[instrument]) {
                let formattedData: number[][] = [];
                let channelObj = readResponse.instruments[instrument][channel];
                let dt = 1 / (channelObj.actualSampleFreq / 1000);
                let timeVal = channelObj.startIndex * dt;
                for (let i = 0; i < channelObj.data.length; i++) {
                    formattedData.push([timeVal, channelObj.data[i]]);
                    timeVal += dt;
                }
                let dataContainerIndex = 0;
                if (instrument === 'digital') {
                    dataContainerIndex += this.analogChans.length;
                }
                dataContainerIndex += parseInt(channel) - 1;
                this.dataContainers[dataContainerIndex].data = this.dataContainers[dataContainerIndex].data.concat(formattedData);
            }
        }
        this.setView();
        this.loggerPlotService.setData(this.dataContainers, false);
    }

    startLogger() {
        let loading = this.loadingService.displayLoading('Starting data logging...');

        let foundChansMap = {};
        for (let i = 0; i < this.analogChans.length; i++) {
            if ((this.analogChans[i].storageLocation !== 'ram' && this.analogChans[i].uri == '') || (this.analogChans[i].state !== 'idle' && this.analogChans[i].state !== 'stopped') || foundChansMap[this.analogChans[i].uri] != undefined) {
                loading.dismiss();
                this.toastService.createToast('loggerInvalidParams', true, undefined, 8000);
                return;
            }
            if (this.analogChans[i].storageLocation !== 'ram') {
                foundChansMap[this.analogChans[i].uri] = 1;
            }
        }

        let analogChanArray = [];
        let digitalChanArray = [];
        for (let i = 0; i < this.analogChans.length; i++) {
            analogChanArray.push(i + 1);
        }
        for (let i = 0; i < this.digitalChans.length; i++) {
            digitalChanArray.push(i + 1);
        }

        this.clearChart();
        this.setView();

        this.setParameters('analog', analogChanArray)
            .then((data) => {
                console.log(data);
                return this.setParameters('digital', digitalChanArray);
            })
            .then((data) => {
                console.log(data);
                return this.run('analog', analogChanArray);
            })
            .then((data) => {
                console.log(data);
                return this.run('digital', digitalChanArray);
            })
            .then((data) => {
                console.log(data);
                this.running = true;
                loading.dismiss();
                //TODO load this value from the selected chans
                this.analogChansToRead = this.analogChanNumbers.slice();
                console.log("ANALOG CHANS TO READ: ");
                console.log(this.analogChansToRead);
                this.readLiveData();
            })
            .catch((e) => {
                console.log(e);
                //TODO: display error
                loading.dismiss();
            });
    }

    private readLiveData() {
        //Make copies of analogChansToRead so mid-read changes to analogChansToRead don't change the channel array
        this.read('analog', this.analogChansToRead.slice())
            .then((data) => {
                this.parseReadResponseAndDraw(data);
                if (this.running) {
                    this.readLiveData();
                }
                else {
                    this.viewMoved = false;
                }
            })
            .catch((e) => {
                console.log(e);
                this.getCurrentState('analog', this.analogChanNumbers)
                    .then((data) => {
                        console.log(data);
                        return this.getCurrentState('digital', this.digitalChanNumbers);
                    })
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((e) => {
                        console.log(e);
                    });
                this.running = false;
                //TODO - display error
            });
    }

    toggleLoggerSettings() {
        this.showLoggerSettings = !this.showLoggerSettings;
    }

    toggleSeriesSettings(instrument: 'analog' | 'digital', chan: number) {
        if (instrument === 'analog') {
            this.showAnalogChan[chan] = !this.showAnalogChan[chan];
        }
        else {
            this.showDigitalChan[chan] = !this.showDigitalChan[chan];
        }
    }

    private applyCurrentStateResponse(data: any) {
        for (let instrument in data.log) {
            for (let channel in data.log[instrument]) {
                if (instrument === 'analog' || instrument === 'digital') {
                    this.copyState(<'analog' | 'digital'>instrument, data.log[instrument][channel][0], (parseInt(channel) - 1));
                }
            }
        }
    }

    private copyState(instrument: 'analog' | 'digital', respObj, channelInternalIndex: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[channelInternalIndex];
            activeChan.gain = respObj.actualGain;
            activeChan.vOffset = respObj.actualVOffset / 1000;
        }
        else {
            activeChan = this.digitalChans[channelInternalIndex];
            activeChan.bitMask = respObj.bitMask;
        }
        activeChan.maxSampleCount = respObj.maxSampleCount;
        activeChan.sampleFreq = respObj.actualSampleFreq / 1000;
        activeChan.startDelay = respObj.actualStartDelay / Math.pow(10, 12);
        activeChan.overflow = respObj.overflow;
        let it = 0;
        this.overflowChildren.forEach((child) => {
            if (channelInternalIndex === it) {
                child._applyActiveSelection(activeChan.overflow);
            }
            it++;
        });
        activeChan.storageLocation = respObj.storageLocation;
        if (respObj.storageLocation === 'ram') {
            console.log('setting selected mode to stream');
            this.selectedMode = 'stream';
            this.modeChild._applyActiveSelection('stream');
        }
        it = 0;
        this.locationChildren.forEach((child) => {
            if (channelInternalIndex === it) {
                child._applyActiveSelection(activeChan.storageLocation);
            }
            it++;
        });
        activeChan.uri = respObj.uri;
        activeChan.state = respObj.state;
        if (activeChan.state === 'running') {
            this.running = true;
        }
    }

    setParameters(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let observable;
            let paramObj = {};
            if (instrument === 'analog') {
                if (this.analogChans.length < 1) {
                    resolve();
                    return;
                }
                let analogParamArray: string[] = ['maxSampleCount', 'gain', 'vOffset', 'sampleFreq', 'startDelay', 'overflow', 'storageLocation', 'uri'];
                for (let i = 0; i < chans.length; i++) {
                    for (let j = 0; j < analogParamArray.length; j++) {
                        if (paramObj[analogParamArray[j]] == undefined) {
                            paramObj[analogParamArray[j]] = [];
                        }
                        paramObj[analogParamArray[j]].push(this.analogChans[chans[i] - 1][analogParamArray[j]]);
                    }
                }
                console.log(paramObj);
                observable = this.activeDevice.instruments.logger.analog.setParameters(
                    chans, 
                    paramObj[analogParamArray[0]], 
                    [1, 1],
                    paramObj[analogParamArray[2]], 
                    paramObj[analogParamArray[3]], 
                    paramObj[analogParamArray[4]], 
                    paramObj[analogParamArray[5]], 
                    paramObj[analogParamArray[6]], 
                    paramObj[analogParamArray[7]]
                );
            }
            else {
                if (this.digitalChans.length < 1) {
                    resolve();
                    return;
                }
                let digitalParamArray: string[] = ['maxSampleCount', 'sampleFreq', 'startDelay', 'overflow', 'storageLocation', 'uri', 'bitMask'];
                for (let i = 0; i < chans.length; i++) {
                    for (let j = 0; j < digitalParamArray.length; j++) {
                        if (paramObj[digitalParamArray[j]] == undefined) {
                            paramObj[digitalParamArray[j]] = [];
                        }
                        paramObj[digitalParamArray[j]].push(this.digitalChans[chans[i] - 1][digitalParamArray[j]]);
                    }
                }
                console.log(paramObj);
                observable = this.activeDevice.instruments.logger.digital.setParameters(
                    chans, 
                    paramObj[digitalParamArray[0]],
                    paramObj[digitalParamArray[1]], 
                    paramObj[digitalParamArray[2]], 
                    paramObj[digitalParamArray[3]], 
                    paramObj[digitalParamArray[4]], 
                    paramObj[digitalParamArray[5]],
                    paramObj[digitalParamArray[6]]
                );
            }
            observable.subscribe(
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
        });
    }

    run(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (instrument === 'analog' && this.analogChans.length < 1) {
                resolve();
                return;
            }
            if (instrument === 'digital' && this.digitalChans.length < 1) {
                resolve();
                return;
            }

            chans.forEach((el, index, arr) => {
                if (instrument === 'analog') {
                    this.analogChans[el - 1].count = 0;
                    this.analogChans[el - 1].startIndex = 0;
                }
                else {
                    this.digitalChans[el - 1].count = 0;
                    this.digitalChans[el - 1].startIndex = 0;
                }
            });

            this.activeDevice.instruments.logger[instrument].run(instrument, chans).subscribe(
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
        });
    }

    stop(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (instrument === 'analog' && this.analogChans.length < 1) {
                resolve();
                return;
            }
            if (instrument === 'digital' && this.digitalChans.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger[instrument].stop(instrument, chans).subscribe(
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
        });
    }

    read(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let startIndices: number[] = [];
            let counts: number[] = [];
            if (instrument === 'analog') {
                if (this.analogChansToRead.length < 1 || this.analogChans.length < 1) {
                    resolve();
                    return;
                }
                for (let i = 0; i < this.analogChansToRead.length; i++) {
                    startIndices.push(this.analogChans[this.analogChansToRead[i] - 1].startIndex);
                    counts.push(this.analogChans[this.analogChansToRead[i] - 1].count);
                }
            }
            if (instrument === 'digital') {
                if (this.digitalChans.length < 1) {
                    resolve();
                    return;
                }
                //TODO to use the digitalChansToRead instead of all chans
                for (let i = 0; i < this.digitalChans.length; i++) {
                    startIndices.push(this.digitalChans[i].startIndex);
                    counts.push(this.digitalChans[i].count);
                }
            }
            
            let finalObj = {};
            
            chans.reduce((accumulator, currentVal, currentIndex) => {
                return accumulator.flatMap((data) => {
                    if (currentIndex > 0) {
                        this.updateValuesFromRead(data, instrument, chans, currentIndex - 1);
                    }
                    this.deepMergeObj(finalObj, data);
                    return this.activeDevice.instruments.logger[instrument].read(instrument, [chans[currentIndex]], [startIndices[currentIndex]], [counts[currentIndex]]);
                });
            }, Observable.create((observer) => { observer.next({}); observer.complete(); }))
                .subscribe(
                    (data) => {
                        this.updateValuesFromRead(data, instrument, chans, chans.length - 1);
                        this.deepMergeObj(finalObj, data);
                        resolve(finalObj);
                    },
                    (err) => {
                        console.log(err);
                        reject(err);
                    },
                    () => {}
                );
        });
    }

    private updateValuesFromRead(data, instrument: 'analog' | 'digital', chans: number[], index: number) {
        if (data != undefined && data.instruments != undefined && data.instruments[instrument] != undefined && data.instruments[instrument][chans[index]].statusCode === 0) {
            if (instrument === 'analog') {
                this.analogChans[chans[index] - 1].startIndex += data.instruments[instrument][chans[index]].actualCount + 1;
                if (this.analogChans[chans[index] - 1].maxSampleCount > 0 && this.analogChans[chans[index] - 1].startIndex >= this.analogChans[chans[index] - 1].maxSampleCount) {
                    this.analogChansToRead.splice(this.analogChansToRead.indexOf(chans[index]), 1);
                    if (this.analogChansToRead.length < 1) {
                        this.running = false;
                    }
                }
            }
            else {
                this.digitalChans[chans[index] - 1].startIndex += data.instruments[instrument][chans[index]].actualCount + 1;
                if (this.digitalChans[chans[index] - 1].maxSampleCount > 0 && this.digitalChans[chans[index] - 1].startIndex >= this.digitalChans[chans[index] - 1].maxSampleCount) {
                    this.running = false;
                }
            }
            /* if (data.instruments[instrument][chans[index]].state !== 'running') {
                console.log('no longer running!');
                this.running = false;
            } */
        }
    }

    private deepMergeObj(destObj, sourceObj) {
        if (this.isObject(destObj) && this.isObject(sourceObj)) {
            Object.keys(sourceObj).forEach((key) => {
                if (sourceObj[key].constructor === Array) {
                    destObj[key] = [];
                    sourceObj[key].forEach((el, index, arr) => {
                        if (this.isObject(el)) {
                            if (destObj[key][index] == undefined) {
                                destObj[key][index] = {};
                            }
                            this.deepMergeObj(destObj[key][index], sourceObj[key][index]);
                        }
                        else {
                            destObj[key][index] = sourceObj[key][index];
                        }
                    });
                }
                else if (this.isObject(sourceObj[key])) {
                    if (destObj[key] == undefined) {
                        destObj[key] = {};
                    }
                    this.deepMergeObj(destObj[key], sourceObj[key]);
                }
                else {
                    destObj[key] = sourceObj[key];
                }
            });
        }
    }

    private isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    getCurrentState(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (instrument === 'analog' && this.analogChans.length < 1) {
                resolve();
                return;
            }
            if (instrument === 'digital' && this.digitalChans.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger[instrument].getCurrentState(instrument, chans).subscribe(
                (data) => {
                    if (data.log != undefined && data.log.analog != undefined) {
                        this.applyCurrentStateResponse(data);
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }
}

export interface LoggerParams {
    maxSampleCount: number,
    sampleFreq: number,
    startDelay: number,
    overflow: 'stop' | 'circular',
    storageLocation: string,
    uri: string,
    startIndex: number,
    count: number,
    state: LoggerChannelState,
    linked: boolean,
    linkedChan: number
}

export type LoggerChannelState = 'busy' | 'idle' | 'stopped' | 'running';

export interface AnalogLoggerParams extends LoggerParams {
    gain: number,
    vOffset: number
}

export interface DigitalLoggerParams extends LoggerParams {
    bitMask: number
}

export type LoggerInputType = 'delay' | 'offset' | 'samples' | 'sampleFreq';