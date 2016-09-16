import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {SimulatedAwgComponent} from './instruments/simulated-awg.component.ts';
import {SimulatedDcComponent} from './instruments/simulated-dc.component.ts';
import {SimulatedOscComponent} from './instruments/simulated-osc.component.ts';
import {SimulatedTriggerComponent} from './instruments/simulated-trigger.component.ts';

@Component({

})
export class SimulatedDeviceComponent {

    private streamState: {
        mode: string,
        remainingSamples: number
    };

    private descriptor: string;
    private awg: SimulatedAwgComponent;
    private dc: SimulatedDcComponent;
    private osc: SimulatedOscComponent;
    private trigger: SimulatedTriggerComponent;

    constructor(enumeration) {
        this.descriptor = enumeration;
        this.awg = new SimulatedAwgComponent();
        this.dc = new SimulatedDcComponent();
        this.osc = new SimulatedOscComponent();
        this.trigger = new SimulatedTriggerComponent();
    }

    send(command: any): Observable<any> {
        return Observable.create((observer) => {
            observer.next(this.parseCommand(JSON.parse(command)));
            observer.complete();
        })
    }

    parseCommand(event) {
        let responseObject: any = {};
        let sumStatusCode = 0;
        let binaryDataFlag = 0;
        console.log(event);
        for (let instrument in event) {
            console.log(instrument, event[instrument], event.hasOwnProperty(instrument));
            //create property on response object
            responseObject[instrument] = {};
            if (event[instrument][0] !== undefined && event[instrument][0].command !== undefined) {
                if (instrument === 'device') {
                    responseObject[instrument] = [];
                    let activeIndex = responseObject[instrument].push(this.processCommands(instrument, event[instrument][0], [])) - 1;
                    sumStatusCode += responseObject[instrument][activeIndex].statusCode;
                }
                else {
                    responseObject[instrument] = this.processCommands(instrument, event[instrument][0], []);
                    sumStatusCode += responseObject[instrument].statusCode;
                }

            }

            for (let channel in event[instrument]) {
                if (event[instrument][channel][0] !== undefined) {
                    //create property on response object 
                    responseObject[instrument][channel] = [];
                    event[instrument][channel].forEach((element, index, array) => {
                        let activeIndex = responseObject[instrument][channel].push(this.processCommands(instrument, event[instrument][channel][index], [channel])) - 1;
                        sumStatusCode += responseObject[instrument][channel][activeIndex].statusCode;
                        console.log(element.command);
                        if (element.command === 'read') {
                            binaryDataFlag = 1;
                        }
                    });

                }

            }
        }
        responseObject.statusCode = sumStatusCode
        if (binaryDataFlag) {
            //processBinaryDataAndSend(responseObject, postResponse);
            let woops = {
                woops: 'woops'
            }
            let response = JSON.stringify(woops);
            let buf = new ArrayBuffer(response.length);
            let bufView = new Uint8Array(buf);
            for (let i = 0; i < response.length; i++) {
                bufView[i] = response.charCodeAt(i);
            }
            return bufView;
        }
        else {
            let response = JSON.stringify(responseObject);
            let buf = new ArrayBuffer(response.length);
            let bufView = new Uint8Array(buf);
            for (let i = 0; i < response.length; i++) {
                bufView[i] = response.charCodeAt(i);
            }
            return bufView;
        }
    }

    processCommands(instrument: any, commandObject: any, params: any) {
        let command = instrument + commandObject.command;
        switch (command) {
            //---------- Device ----------
            case 'deviceenumerate':
                return JSON.parse(this.descriptor);

            //---------- AWG ----------            
            case 'awgsetArbitraryWaveform':
                return this.awg.setArbitraryWaveform(params[0]);
            case 'awgsetRegularWaveform':
                return this.awg.setRegularWaveform(params[0], commandObject);
            case 'awgrun':
                return this.awg.run(params[0]);
            case 'awgstop':
                return this.awg.stop(params[0]);

            //---------- DC ----------        
            case 'dcsetVoltage':
                return this.dc.setVoltage(params[0], commandObject.voltage);
            case 'dcgetVoltage':
                return this.dc.getVoltage(params[0]);

            //-------- TRIGGER --------
            case 'triggersetParameters':
                return this.trigger.setParameters(params[0], commandObject.source, commandObject.targets);
            case 'triggerrun':
                return this.trigger.run();
            case 'triggerread':
                return this.trigger.read(params[0]);

            //---------- OSC ----------            
            case 'oscsetParameters':
                return this.osc.setParameters(params[0], commandObject.offset, commandObject.gain);
            default:
                return {
                    statusCode: 1,
                    errorMessage: 'Not a recognized command'
                };
        }
    }
}