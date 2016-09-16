import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components

//Interfaces

@Component({

})
export class SimulatedDeviceComponent {

    private streamState: {
        mode: string,
        remainingSamples: number
    };

    private descriptor: string;

    constructor(enumeration) {
        this.descriptor = enumeration;
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
                console.log(event[instrument][0]);
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
                //break;
            case 'getMake':
                //callback(null, device.getMake());
                break;
            case 'getModel':
                //callback(null, device.getModel());
                break;
            case 'getFirmwareVersion':
                //callback(null, device.getFirmwareVersion());
                break;
            case 'getInstruments':
                //callback(null, device.getInstruments());
                break;
            case 'getId':
                //callback(null, device.getId());
                break;

            //---------- AWG ----------            
            case 'awggetSetting':
                //return awg.getSetting(params[0]);
            case 'awgsetSetting':
                //return awg.setSetting(params[0], commandObject.settings);

            case 'awgsetArbitraryWaveform':
                //return awg.setArbitraryWaveform(params[0]);
            case 'awgsetRegularWaveform':
                //return awg.setRegularWaveform(params[0], commandObject);
            case 'awgrun':
                //return awg.run(params[0]);
            case 'awgstop':
                //return awg.stop(params[0]);

            //---------- DC ----------        
            case 'dcsetVoltage':
                //return dc.setVoltage(params[0], commandObject.voltage);
            case 'dcgetVoltage':
                //return dc.getVoltage(params[0]);

            //-------- TRIGGER --------
            case 'triggersetParameters':
                //return trigger.setParameters(params[0], commandObject.source, commandObject.targets);
            case 'triggerrun':
                //return trigger.run();
            case 'triggerread':
                //return trigger.read(params[0]);

            //---------- OSC ----------            
            case 'oscrunSingle':
                //return osc.runSingle(params[0]);
            case 'oscsetParameters':
                //return osc.setParameters(params[0], commandObject.offset, commandObject.gain);
            default:
                return {
                    statusCode: 1,
                    errorMessage: 'Not a recognized command'
                };
        }
    }
}