import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {AwgInstrumentComponent} from '../instruments/awg/awg-instrument.component';
import {DcInstrumentComponent} from '../instruments/dc/dc-instrument.component';
import {LaInstrumentComponent} from '../instruments/la/la-instrument.component';
import {OscInstrumentComponent} from '../instruments/osc/osc-instrument.component';
import {TriggerInstrumentComponent} from '../instruments/trigger/trigger-instrument.component';

//Services
import {TransportService} from '../../services/transport/transport.service';

@Component({
})
export class DeviceComponent {

    private transport: TransportService;

    private rootUri: string;
    public deviceMake: string;
    public deviceModel: string;
    public firmwareVersion;
    public instruments: {
        awg: AwgInstrumentComponent,
        dc: DcInstrumentComponent,
        la: LaInstrumentComponent,
        osc: OscInstrumentComponent,
        trigger: TriggerInstrumentComponent
    } = {
        awg: null,
        dc: null,
        la: null,
        osc: null,
        trigger: null
    };

    constructor(_rootUri: string, deviceDescriptor: any) {
        console.log('Device Contructor');
        //TODO If deviceDescriptor is empty, attempt to enumerate the deviceDescriptor [?]

        this.rootUri = _rootUri;
        this.transport = new TransportService(this.rootUri);
        if (_rootUri === 'local') {
            this.transport.setLocalTransport(deviceDescriptor);
        }
        console.log(deviceDescriptor);
        this.deviceMake = deviceDescriptor.deviceMake;
        this.deviceModel = deviceDescriptor.deviceModel;
        this.firmwareVersion = deviceDescriptor.firmwareVersion;
        this.instruments.awg = new AwgInstrumentComponent(this.transport, deviceDescriptor.awg);
        this.instruments.dc = new DcInstrumentComponent(this.transport, deviceDescriptor.dc);
        this.instruments.la = new LaInstrumentComponent(this.transport, deviceDescriptor.la);
        this.instruments.osc = new OscInstrumentComponent(this.transport, deviceDescriptor.osc);
        this.instruments.trigger = new TriggerInstrumentComponent(this.transport, 'deviceDescriptor.trigger');
        this.multiCommand('hey').subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => {
                console.log('multiCommand complete');
            }
        );
    }

    multiCommand(commandObject: any): Observable<any> {
        commandObject = {
            dc: {
                getVoltages: [[1, 2]],
                setVoltages: [[1, 2], [3.3, 3.3]]
            },
            osc: {
                setParameters: [[1], [0], [1]]
            }
        }
        let commandToBeSent = {

        }
        return Observable.create((observer) => {
            for (let instrument in commandObject) {
                commandToBeSent[instrument] = {};
                let functionNames = Object.keys(commandObject[instrument]);
                let flag = false;
                    for (let element of functionNames) {
                        let responseJson;
                        try {
                            console.log(element);
                            responseJson = this.instruments[instrument][element + 'Json'](...commandObject[instrument][element]);
                            console.log(responseJson);
                        }
                        catch (e) {
                            console.log(e);
                            flag = true;
                            observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + element + 'Json.\nAuto-generated error: ' + e);
                        }
                        if (flag) {
                            return;
                        }
                        for (let channel in responseJson[instrument]) {
                            if (commandToBeSent[instrument][channel] === undefined) {
                                commandToBeSent[instrument][channel] = [];
                                commandToBeSent[instrument][channel] = responseJson[instrument][channel];
                            }
                            else {
                                commandToBeSent[instrument][channel].push(responseJson[instrument][channel][0]);
                            }
                            console.log(commandToBeSent);
                        }
                    }
            }
            //MultiCommand packet is complete. Now to send
            let multiCommandResponse;
            console.log(this.rootUri);
            this.transport.writeRead('/', JSON.stringify(commandToBeSent), 'json').subscribe(
                (arrayBuffer) => {
                    try {
                        multiCommandResponse = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                        console.log(multiCommandResponse);
                    }
                    catch (e) {
                        console.log(e);
                        observer.error('Error in multiCommand().\nThis is most likely due to an unparseable response.\nAuto-generated error: ' + e);
                    }
                    
                },
                (err) => {
                    console.log(err);
                },
                () => {
                    console.log('complete');
                }
            );
            //Response Received! Now to reparse and call observer.next for each command
            let flag = false;
            for (let instrument in multiCommandResponse) {
                for (let channel in multiCommandResponse[instrument]) {
                    for (let responseObject of multiCommandResponse[instrument][channel]) {
                        try {
                            observer.next(this.instruments[instrument][responseObject.command + 'Parse'](channel, responseObject));
                        }
                        catch (e) {
                            console.log(e);
                            flag = true;
                            observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + responseObject.command + 'Parse.\nAuto-generated error: ' + e);
                        }
                        if (flag) return;
                    }
                }
            }
            observer.next('noice');
            observer.complete();
        });
        
    }


}