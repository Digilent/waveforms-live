import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { InstrumentComponent } from '../instrument.component';
import { AwgChannelComponent } from './awg-channel.component';

//Services
import { TransportService } from '../../../services/transport/transport.service';

//Interfaces
import { SettingsObject } from './awg-instrument.component';

@Injectable()
export class AwgInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public chans: Array<AwgChannelComponent> = [];

    constructor(_transport: TransportService, _awgInstrumentDescriptor: any) {
        super(_transport, '/');

        //Store reference to device transport for communication with device
        this.transport = _transport;

        //Populate AWG supply parameters
        this.numChans = _awgInstrumentDescriptor.numChans;
        //Populate channels  
        for (let channel in _awgInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new AwgChannelComponent(_awgInstrumentDescriptor[channel]));
            }
        }
    }

    //Enumerate instrument info
    enumerate(): Observable<number> {
        let command = {
            command: 'awgEnumerate'
        }
        return this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json');
    }

    setArbitraryWaveform(chans: number[], waveforms: Array<any>, dataTypes: string[]): Observable<any> {
        let command = {
            "awg": {}
        }
        console.log(waveforms);
        let binaryOffset = 0;
        let binaryLength = 0;
        chans.forEach((element, index, array) => {
            //Hard code 2 bytes per value
            //TODO read data types and generate length from that instead of hard code
            binaryLength = waveforms[index].y.length * 2;
            command.awg[chans[index]] =
                [
                    {
                        command: "setArbitraryWaveform",
                        binaryOffset: binaryOffset,
                        binaryLength: binaryLength,
                        binaryType: dataTypes[index],
                        vpp: 3,
                        vOffset: 0,
                        dt: waveforms[index].dt
                    }
                ]
            binaryOffset += binaryLength;
        });
        let stringCommand = JSON.stringify(command) + '\r\n';
        let jsonChars = stringCommand.length;
        let fullString = jsonChars + '\r\n' + stringCommand;
        let binaryBufferToSend = new ArrayBuffer(fullString.length + binaryOffset);
        for (let i = 0; i < fullString.length; i++) {
            binaryBufferToSend[i] = fullString.charCodeAt(i);
        }
        for (let i = 0; i < chans.length; i++) {
            let typedArray = new Int16Array(waveforms[i].y);
            let byteConvert = new Uint8Array(typedArray.buffer);
            for (let i = fullString.length, j = 0; i < binaryOffset + fullString.length; i = i + 2, j = j + 2) {
                binaryBufferToSend[i] = byteConvert[j];
                binaryBufferToSend[i + 1] = byteConvert[j + 1];
            }
        }

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, binaryBufferToSend, 'binary').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    observer.next(data);
                    observer.complete();
                },

                (err) => {
                    observer.error(err);
                },

                () => {
                    observer.complete();
                }
            );
        });
    }

    setRegularWaveform(chans: number[], settings: SettingsObject[]): Observable<any> {
        let command = {
            "awg": {}
        }
        chans.forEach((element, index, array) => {
            command.awg[chans[index]] =
                [
                    {
                        command: "setRegularWaveform",
                        signalType: settings[index].signalType,
                        signalFreq: Math.floor(settings[index].signalFreq * 1000),
                        vpp: Math.floor(settings[index].vpp * 1000),
                        vOffset: Math.floor(settings[index].vOffset * 1000)
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    console.log(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    let data;
                    try {
                        data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    }
                    catch (e) {
                        console.log(e);
                        console.log('Error parsing JSON response');
                        observer.error(e);
                        return;
                    }
                    console.log(data);
                    if ((data.awg !== undefined && data.awg['1'][0].statusCode > 0) || data.statusCode !== undefined) {
                        console.log('statuscode error');
                        observer.error('Error Setting AWG Parameters. Status Code');
                        return;
                    }
                    console.log('no status code error');
                    observer.next(data);
                    observer.complete();

                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    run(chans: number[]): Observable<any> {
        let command = {
            "awg": {}
        }
        chans.forEach((element, index, array) => {
            command.awg[chans[index]] =
                [
                    {
                        command: "run"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    }
                    catch (e) {
                        console.log(e);
                        console.log('Error parsing run response');
                        observer.error(e);
                        return;
                    }
                    console.log(data);
                    if ((data.awg !== undefined && data.awg['1'][0].statusCode > 0) || data.statusCode !== undefined) {
                        console.log('statuscode error');
                        observer.error('Error running AWG. Status Code');
                        return;
                    }
                    console.log('no status code error');
                    observer.next(data);
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }

    stop(chans: number[]): Observable<any> {
        let command = {
            "awg": {}
        }
        chans.forEach((element, index, array) => {
            command.awg[chans[index]] =
                [
                    {
                        command: "stop"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.awg === undefined || data.awg["1"] === undefined || data.awg["1"][0].statusCode > 0) {
                        console.log(data);
                        observer.error(data);
                    }
                    else {
                        observer.next(data);
                        observer.complete();
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            );
        });
    }
}

export interface SettingsObject {
    signalType: string,
    signalFreq: number,
    vpp: number,
    vOffset: number
}
