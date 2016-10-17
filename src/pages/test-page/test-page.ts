import { NavParams, ViewController, Platform} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Component({
    templateUrl: "test-page.html"
})
export class TestPage {
    @ViewChild('chart') chart: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public waveType: string;
    public frequency: string;
    public amplitude: string;
    public offset: string;
    public dutyCycle: string;
    public newChart: any;
    public numPoints: number;
    
    public value: number;
    
    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.value = this.params.get('value');
        this.waveType = this.params.get('waveType');
        this.frequency = this.params.get('frequency');
        this.amplitude = this.params.get('amplitude');
        this.offset = this.params.get('offset');
        this.dutyCycle = this.params.get('dutyCycle');
        this.numPoints = 1000;
    }

    closeModal() {
        this.viewCtrl.dismiss({
            waveType: this.waveType,
            frequency: this.frequency,
            amplitude: this.amplitude,
            offset: this.offset,
            dutyCycle: this.dutyCycle
        });
    }
    
    isSquare() {
        if (this.waveType === 'square') {
            return true;
        }
        return false;
    }
    
    isDc() {
        if (this.waveType === 'dc') {
            return true;
        }
        return false;
    }
    
    saveInstance(chart: Object) {
        //not actually using right now
        console.log(chart);
        this.newChart = chart;
        this.drawWave();
    }
    
    onSegmentChanged(event) {
        this.drawWave();
    }
    
    drawWave() {
        if (this.waveType === 'sine') {this.drawSine();}
        else if (this.waveType === 'ramp-up') {this.drawRampUp();}
        else if (this.waveType === 'square') {this.drawSquare();}
        else if (this.waveType === 'dc') {this.drawDc();}
        else if (this.waveType === 'triangle') {this.drawTriangle();}
        else if (this.waveType === 'ramp-down') {this.drawRampDown();}
        else {alert('wavetype not supported yet');}
    }
    
    drawSine() {
        //incomplete: need to set up point interval for x axis
        let waveform = [];
        let period = 0;
        if (parseFloat(this.frequency) != 0) {
            period = 1 / parseFloat(this.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        for (let i = 0; i < this.numPoints; i++) {
            waveform[i] = [dt * i, parseFloat(this.amplitude) * Math.sin(((Math.PI * 2) / (this.numPoints / 2)) * i) + parseFloat(this.offset)];
        }
        this.chart.drawWaveform(0, waveform, true);
    }
    
    drawRampUp() {
        let waveform = [];
        let period = 0;
        if (parseFloat(this.frequency) != 0) {
            period = 1 / parseFloat(this.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        for (let i = 0; i < this.numPoints; i++) {
            waveform[i] = [dt * i, (i % (this.numPoints / 2)) * (parseFloat(this.amplitude) / (this.numPoints / 2)) + 
            parseFloat(this.offset)];
        }
        this.chart.drawWaveform(0, waveform, true);
    }
    
    drawDc() {
        let waveform: number[] = [];
        for (let i = 0; i < this.numPoints; i++) {
            waveform[i] = parseFloat(this.offset);
        }
        this.chart.drawWaveform(0, waveform, true);
    }
    
    drawTriangle() {
        let waveform = [];
        let period = 0;
        if (parseFloat(this.frequency) != 0) {
            period = 1 / parseFloat(this.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        for (let i = 0; i < (this.numPoints / 8); i++) {
            waveform[i] = [dt * i, ((parseFloat(this.amplitude) / (this.numPoints / 8)) * i) + parseFloat(this.offset)];
        }
        for (let i = 0; i < (this.numPoints / 4); i++) {
            waveform[i + (this.numPoints / 8)] = [dt * (i + (this.numPoints / 8)), parseFloat(this.amplitude) + parseFloat(this.offset) - 
            ((parseFloat(this.amplitude) / (this.numPoints / 4)) * 2 * i)];
        }
        for (let i = 0; i < (this.numPoints / 8); i++) {
            waveform[i + (this.numPoints * 3 / 8)] = [dt * (i + (this.numPoints * 3 / 8)), waveform[i][1] - parseFloat(this.amplitude)];
        }
        for (let i = 0; i < (this.numPoints / 2); i++) {
            waveform[i + this.numPoints / 2] = [dt * (i + this.numPoints / 2), (waveform[i])[1]];
        }
        console.log(waveform);
        this.chart.drawWaveform(0, waveform, true);
    }
    
    drawRampDown() {
        let waveform = [];
        let period = 0;
        if (parseFloat(this.frequency) != 0) {
            period = 1 / parseFloat(this.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        for (let i = 0; i < this.numPoints; i++) {
            waveform[i] = [dt * i, ((-1 * i) % (this.numPoints / 2)) * (parseFloat(this.amplitude) / (this.numPoints / 2)) + 
            parseFloat(this.amplitude) + parseFloat(this.offset)];
        }
        this.chart.drawWaveform(0, waveform, true);
    }
    
    drawNoise() {
        //let waveform: number[] = [];
    }
    
    drawTrap() {
        //let waveform: number[] = [];
    }
    
    drawSinPow() {
        //let waveform: number[] = [];
    }
    
    drawSquare() {
        let waveform = [];
        let period = 0;
        if (parseFloat(this.frequency) != 0) {
            period = 1 / parseFloat(this.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        let i = 0;
        for (i = 0; i < (this.numPoints / 2) * (parseFloat(this.dutyCycle) / 100); i++) {
            waveform[i] = [dt * i, parseFloat(this.offset) + parseFloat(this.amplitude)];
        }
        for (; i < (this.numPoints / 2); i++) {
            waveform[i] = [dt * i, parseFloat(this.offset) - parseFloat(this.amplitude)];
        }
        for (let j = 0; i < this.numPoints; i++, j++) {
            waveform[i] = [dt * i, waveform[j][1]];
        }
        this.chart.drawWaveform(0, waveform, true);
    }
}