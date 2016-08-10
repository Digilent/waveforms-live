import {Component, Output, EventEmitter, Input} from '@angular/core';
import {NgClass} from '@angular/common';

//Components
import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';

@Component({
  templateUrl: 'build/components/dc-supply/dc-supply.html',
  selector: 'dc-supply',
  directives: [NgClass]
})
export class DcSupplyComponent { 
    @Output() headerClicked: EventEmitter<any> = new EventEmitter();
    @Input() contentHidden: boolean;
    private voltageSupplies: any[];
    private voltages: string[];
    private currents: string[];
    private dcPower: boolean;
    private maxVoltages: number[];
    private maxCurrents: number[];
    private correctVoltages: boolean[];
    private correctCurrents: boolean[];

    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;

    private storageService: StorageService;
    private storageEventListener: EventEmitter<any>;
    
    constructor(_deviceManagerService: DeviceManagerService, _storageService: StorageService) {
        this.voltageSupplies = [0, 1, 2];
        this.contentHidden = true;
        this.voltages = ['5.00', '5.00', '-5.00'];
        this.currents = ['1.00', '1.00', '1.00'];
        this.dcPower = false;
        this.maxVoltages = [6, 25, -25];
        this.maxCurrents = [1, 1, 1];
        this.correctCurrents = [true, true, true];
        this.correctVoltages = [true, true, true];

        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        console.log('dc supply component constructor');
        this.storageService = _storageService;
        this.storageEventListener = this.storageService.saveLoadEventEmitter.subscribe((data) => {
            console.log(data);
            if (data === 'save') {
                this.storageService.saveData('dcSupplyVoltages', JSON.stringify(this.voltages));
            }
            else if (data === 'load') {
                this.storageService.getData('dcSupplyVoltages').then((data) => {
                    this.voltages = JSON.parse(data);
                });
            }
        });
    }

    ngOnInit() {
        if (this.activeDevice !== undefined) {
            let channelNumArray = [];
            this.voltages = [];
            for (let i = 0; i < this.activeDevice.instruments.dc.numChans; i++) {
                channelNumArray[i] = this.activeDevice.instruments.dc.chans[i].currentIncrement;
                this.voltages[i] = "5.00";
                this.currents[i] = "1.00";
            }
            this.voltageSupplies = channelNumArray;
        }
    }

    ngOnDestroy() {
        console.log('ngondestroy');
        this.storageEventListener.unsubscribe();
    }

    setVoltages(chans: Array<number>, voltages: Array<number>) {
        console.log(this.activeDevice.instruments.dc);
        this.activeDevice.instruments.dc.setVoltages(chans, voltages).subscribe(
            (data) => {
                console.log(data);
                if (data.statusCode == 0) {
                    console.log('DC channels: ' + chans + ' set to ' + voltages);
                }
                else {
                    console.log('DC set n chan failed');
                }
            },
            (err) => {
                console.log(err);
            },
            () => {}
        );
    }

    getVoltages(chans: Array<number>) {
        this.activeDevice.instruments.dc.getVoltages(chans).subscribe(
            (voltages) => {
                console.log('Voltages are currently: ' + voltages);
            },
            (err) => {
                console.log(err);
            },
            () => {
                console.log('getVoltage Done');
            }
        )
    }
    
    togglePower() {
        for (let i = 0; i < this.voltageSupplies.length; i++) {
            if (this.correctCurrents[i] === false || this.correctVoltages[i] === false) {
                return;
            }
        }
        this.dcPower = !this.dcPower;
        if (this.dcPower) {
            this.setVoltages(this.voltageSupplies, this.voltages.map(Number));
        }
        else {
            this.getVoltages(this.voltageSupplies);
        }
    }

    validateSupply(supplyNum: number) {
        if ((parseFloat(this.voltages[supplyNum]) < 0 || parseFloat(this.voltages[supplyNum]) > this.maxVoltages[supplyNum]) && this.maxVoltages[supplyNum] > 0) {
            //bad shit
            console.log(supplyNum + ' is messed up dude');
            this.correctVoltages[supplyNum] = false;
            return;
        }
        if (this.maxVoltages[supplyNum] < 0 && (parseFloat(this.voltages[supplyNum]) > 0 || parseFloat(this.voltages[supplyNum]) < this.maxVoltages[supplyNum])) {
            //negative supply
            console.log(supplyNum + ' is negative and messed yo');
            this.correctVoltages[supplyNum] = false;
            return;
        }
        this.correctVoltages[supplyNum] = true;
    }

    validateCurrent(supplyNum: number) {
        if (parseFloat(this.currents[supplyNum]) < 0 || parseFloat(this.currents[supplyNum]) > this.maxCurrents[supplyNum]) {
            console.log(supplyNum + ' is wrong mosuckra');
            this.correctCurrents[supplyNum] = false;
            return;
        }
        this.correctCurrents[supplyNum] = true;
    }
}