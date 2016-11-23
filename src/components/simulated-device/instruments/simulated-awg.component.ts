import {Injectable} from '@angular/core';

//Services
import {SimulatedDeviceService} from '../../../services/simulated-device/simulated-device.service';

@Injectable()

export class SimulatedAwgComponent {
    public simulatedDeviceService: SimulatedDeviceService;
    public signalTypes: string[] = ['', '', '', '', '', '', '', ''];
    public signalFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    public vpps: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    public vOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor(_simulatedDeviceService: SimulatedDeviceService) {
        this.simulatedDeviceService = _simulatedDeviceService;

    }

    setArbitraryWaveform(chan) {
        return {
            statusCode: 0,
            wait: 0
        };
    }

    setRegularWaveform(chan, commandObject) {
        console.log('awg chan: ' + chan);
        this.signalTypes[chan] = commandObject.signalType;
        this.signalFreqs[chan] = commandObject.signalFreq;
        this.vpps[chan] = commandObject.vpp;
        this.vOffsets[chan] = commandObject.vOffset;
        this.simulatedDeviceService.setAwgSettings(commandObject, chan);
        return {
            "command":"setRegularWaveform",
            "statusCode":0,
            "actualSignalFreq": commandObject.signalFreq,
            "actualVpp": commandObject.vpp,
            "actualVOffset":commandObject.vOffset,
            "wait": 0
        };
    }

    run(chan) {
        this.simulatedDeviceService.setTriggerArmed(true);
        return {
            "command":"run",
            "statusCode":0,
            "wait":0
        }
    }

    stop(chan) {
        console.log('stop');
        this.simulatedDeviceService.setTriggerArmed(false);
        return {
            "command":"stop",
            "statusCode":0,
            "wait":0
        };
    }
}

