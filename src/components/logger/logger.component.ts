import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { LoadingService } from '../../services/loading/loading.service';
import { ToastService } from '../../services/toast/toast.service';

//Components
import { DropdownPopoverComponent } from '../dropdown-popover/dropdown-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

@Component({
    templateUrl: 'logger.html',
    selector: 'logger-component'
})
export class LoggerComponent {
    @ViewChildren('dropPopOverflow') overflowChildren: QueryList<DropdownPopoverComponent>;
    @ViewChildren('dropPopLocation') locationChildren: QueryList<DropdownPopoverComponent>;
    @ViewChildren('dropPopLink') linkChildren: QueryList<DropdownPopoverComponent>;
    @ViewChild('dropPopProfile') profileChild: DropdownPopoverComponent;
    public ignoreFocusOut: boolean = false;
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
    public overflowConditions: string[] = ['stop', 'circular'];
    public storageLocations: string[] = ['ram'];
    public loggingProfiles: string[] = ['New Profile'];
    public selectedLogProfile: string = this.loggingProfiles[0];
    private defaultProfileName: string = 'NewProfile';
    public profileNameScratch: string = this.defaultProfileName;
    public analogLinkOptions: string[][] = [];
    private profileObjectMap: any = {};

    constructor(
        private devicemanagerService: DeviceManagerService,
        private loadingService: LoadingService,
        private toastService: ToastService

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

    private init() {
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
                                this.storageLocations.push(el);
                            }
                        });
                    }
                    return this.loadProfilesFromDevice();
                })
                .then((data) => {
                    console.log(data);
                    return this.analogGetMultipleChannelStates(analogChanArray);
                })
                .catch((e) => {
                    console.log(e);
                    return this.analogGetMultipleChannelStates(analogChanArray);
                })
                .then((data) => {
                    console.log(data);
                    return this.digitalGetMultipleChannelStates(digitalChanArray);
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
        this.saveProfile(this.profileNameScratch).catch((e) => {
            console.log(e);
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
        this.toastService.createToast('loggerSaveSuccess');
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
                }
                else if (instrument === 'digital') {
                    this.digitalChans[parseInt(channel)] = loadedObj[instrument][channel];
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

    private analogGetMultipleChannelStates(analogChannelNumbers: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (analogChannelNumbers.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.analog.getCurrentState('analog', analogChannelNumbers).subscribe(
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

    private digitalGetMultipleChannelStates(digitalChannelNumbers: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (digitalChannelNumbers.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.digital.getCurrentState('analog', digitalChannelNumbers).subscribe(
                (data) => {
                    if (data.log != undefined && data.log.digital != undefined) {
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

    checkForEnter(event, instrument: 'analog' | 'digital', type: LoggerInputType, channel: number) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, instrument, type,  channel);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event, instrument: 'analog' | 'digital', type: LoggerInputType, channel: number) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, instrument, type, channel);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event, instrument: 'analog' | 'digital', type: LoggerInputType, channel: number) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
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

    startLogger() {
        let loading = this.loadingService.displayLoading('Starting data logging...');

        let foundChansMap = {};
        for (let i = 0; i < this.analogChans.length; i++) {
            if (this.analogChans[i].uri == '' || this.analogChans[i].state !== 'idle' || foundChansMap[this.analogChans[i].uri] != undefined) {
                loading.dismiss();
                this.toastService.createToast('loggerInvalidParams', true, undefined, 8000);
                return;
            }
            foundChansMap[this.analogChans[i].uri] = 1;
        }

        let analogChanArray = [];
        let digitalChanArray = [];
        for (let i = 0; i < this.analogChans.length; i++) {
            analogChanArray.push(i + 1);
        }
        for (let i = 0; i < this.digitalChans.length; i++) {
            digitalChanArray.push(i + 1);
        }

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
                loading.dismiss();
            })
            .catch((e) => {
                console.log(e);
                loading.dismiss();
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
        it = 0;
        this.locationChildren.forEach((child) => {
            if (channelInternalIndex === it) {
                child._applyActiveSelection(activeChan.storageLocation);
            }
            it++;
        });
        activeChan.uri = respObj.uri;
        activeChan.state = respObj.state;
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
                    paramObj[analogParamArray[1]],
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

            this.activeDevice.instruments.logger[instrument].run(instrument, [chans[0]]).subscribe(
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

    stop(instrument: 'analog' | 'digital', chan: number) {
        this.activeDevice.instruments.logger[instrument].stop(instrument, [chan + 1]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    read(instrument: 'analog' | 'digital', chan: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[chan];
        }
        else {
            activeChan = this.digitalChans[chan];
        }
        this.activeDevice.instruments.logger[instrument].read(instrument, [chan + 1], activeChan.startIndex, activeChan.count).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    getCurrentState(instrument: 'analog' | 'digital', chan: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[chan];
        }
        else {
            activeChan = this.digitalChans[chan];
        }
        this.activeDevice.instruments.logger[instrument].getCurrentState(instrument, [chan + 1]).subscribe(
            (data) => {
                console.log(data);
                let respObj = data.log[instrument][chan + 1][0];
                this.copyState(instrument, respObj, chan);
                console.log(this.analogChans);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
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