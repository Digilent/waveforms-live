import { NavParams, ViewController, Platform } from 'ionic-angular';
import { ViewChild, Component } from '@angular/core';

//Components
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { FgenComponent } from '../../components/function-gen/function-gen.component';
import { WaveformComponent } from '../../components/data-types/waveform';

@Component({
    templateUrl: "fgen-modal.html"
})
export class ModalFgenPage {
    @ViewChild('chart') chart: SilverNeedleChart;
    public platform: Platform;
    public viewCtrl: ViewController;
    public params: NavParams;
    public fgenComponent: FgenComponent;
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
        this.fgenComponent = this.params.get('fgenComponent');
        this.numPoints = 1000;
    }

    openFileInput() {
        document.getElementById('file').click();
    }

    fileChange(event) {
        if (event.target.files.length === 0) { return }
        let fileReader = new FileReader();
        let fileName = event.target.files[0].name;
        let fileEnding = fileName.slice(fileName.indexOf('.') + 1);
        if (fileEnding === 'csv') {
            fileReader.onload = ((file) => {
                let myFile: any = file;
                this.parseCsv(myFile.target.result);
            });
            fileReader.readAsText(event.target.files[0]);
        }
        else if (fileEnding === 'osjb') {
            fileReader.onload = ((file) => {
                let myFile: any = file;
                this.parseOsjb(myFile.target.result);
            });
            fileReader.readAsArrayBuffer(event.target.files[0]);
        }
        else {
            alert('File Type Not Supported');
        }
        
    }

    parseOsjb(fileAsArraybuffer: ArrayBuffer) {
        console.log('osjb not yet supported');
    }

    parseCsv(fileAsText: string) {
        let points = fileAsText.split('\n');
        console.log(points.length);
        let pointData = points[0].split(',');
        let pointData2 = points[1].split(',');
        let xInterval = parseFloat(pointData2[0]) - parseFloat(pointData[0]);
        
        let dataContainer = [];
        for (let i = 0; i < pointData.length - 1; i++) {
            dataContainer[i] = [parseFloat(pointData[i + 1])];
        }

        console.log(pointData);
        //Assume first column is time
        //Assume second column is y1
        //Assume third column is y2 etc
        for (let i = 0; i < points.length; i++) {
            let currentPointData = points[i].split(',');
            for (let j = 0; j < currentPointData.length - 1; j++) {
                dataContainer[j].push(parseFloat(currentPointData[j + 1]));
            }
        }
        console.log('data container: ');
        console.log(dataContainer);
        console.log('xInterval: ' + xInterval);

        let waveformComponentArray: WaveformComponent[] = [];

        for (let i = 0; i < dataContainer.length; i++) {
            let waveform = {
                y: dataContainer[i],
                t0: 0,
                dt: xInterval,
                pointOfInterest: 0,
                triggerPosition: undefined,
                seriesOffset: 0
            };
            waveformComponentArray[i] = new WaveformComponent(waveform);
        }
        this.chart.clearExtraSeries([0, 1]);
        this.chart.setCurrentBuffer(waveformComponentArray);
        for (let i = 0; i < dataContainer.length; i++) {
            this.chart.drawWaveform(i, waveformComponentArray[i], true);
        }
    }

    //Called when fgen modal is closed. Returns data
    closeModal() {
        this.viewCtrl.dismiss();
    }

    togglePower() {
        this.fgenComponent.togglePower();
    }

    //Determines if current wave type is square
    isSquare() {
        if (this.fgenComponent.waveType === 'square') {
            return true;
        }
        return false;
    }

    //Determines if current wave type is dc
    isDc() {
        if (this.fgenComponent.waveType === 'dc') {
            return true;
        }
        return false;
    }

    //Initialize chart for awg config
    initChart(chart: Object) {
        this.chart.setTitle('AWG Configuration');
        this.chart.clearExtraSeries([0]);
        this.drawWave();
    }

    //When a different tab is selected, draw new wavetype
    onSegmentChanged(event) {
        this.drawWave();
    }

    //Case structure to determine which wavetype to draw
    drawWave() {
        if (this.fgenComponent.waveType === 'sine') { this.drawSine(); }
        else if (this.fgenComponent.waveType === 'sawtooth') { this.drawRampUp(); }
        else if (this.fgenComponent.waveType === 'square') { this.drawSquare(); }
        else if (this.fgenComponent.waveType === 'dc') { this.drawDc(); }
        else if (this.fgenComponent.waveType === 'triangle') { this.drawTriangle(); }
        else if (this.fgenComponent.waveType === 'ramp-down') { this.drawRampDown(); }
        else { alert('wavetype not supported yet'); }
    }

    //Draws sine wave
    drawSine() {
        //incomplete: need to set up point interval for x axis
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: parseFloat(this.fgenComponent.offset)
        };
        let period = 0;
        if (parseFloat(this.fgenComponent.frequency) != 0) {
            period = 1 / parseFloat(this.fgenComponent.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        waveform.dt = dt;
        for (let i = 0; i < this.numPoints; i++) {
            waveform.y[i] = parseFloat(this.fgenComponent.amplitude) * Math.sin(((Math.PI * 2) / (this.numPoints / 2)) * i) + parseFloat(this.fgenComponent.offset);
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }

    //Draws ramp up 
    drawRampUp() {
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: this.fgenComponent.offset
        };
        let period = 0;
        if (parseFloat(this.fgenComponent.frequency) != 0) {
            period = 1 / parseFloat(this.fgenComponent.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        waveform.dt = dt;
        for (let i = 0; i < this.numPoints; i++) {
            waveform.y[i] = (i % (this.numPoints / 2)) * (parseFloat(this.fgenComponent.amplitude) / (this.numPoints / 2)) +
                parseFloat(this.fgenComponent.offset);
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }

    //Draws dc 
    drawDc() {
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: this.fgenComponent.offset
        };
        waveform.dt = 1;
        for (let i = 0; i < this.numPoints; i++) {
            waveform.y[i] = parseFloat(this.fgenComponent.offset);
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }

    //Draws triangle wave
    drawTriangle() {
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: this.fgenComponent.offset
        };
        let period = 0;
        if (parseFloat(this.fgenComponent.frequency) != 0) {
            period = 1 / parseFloat(this.fgenComponent.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        waveform.dt = dt;
        for (let i = 0; i < (this.numPoints / 8); i++) {
            waveform.y[i] = ((parseFloat(this.fgenComponent.amplitude) / (this.numPoints / 8)) * i) + parseFloat(this.fgenComponent.offset);
        }
        for (let i = 0; i < (this.numPoints / 4); i++) {
            waveform.y[i + (this.numPoints / 8)] = parseFloat(this.fgenComponent.amplitude) + parseFloat(this.fgenComponent.offset) -
                ((parseFloat(this.fgenComponent.amplitude) / (this.numPoints / 4)) * 2 * i);
        }
        for (let i = 0; i < (this.numPoints / 8); i++) {
            waveform.y[i + (this.numPoints * 3 / 8)] = waveform.y[i] - parseFloat(this.fgenComponent.amplitude);
        }
        for (let i = 0; i < (this.numPoints / 2); i++) {
            waveform.y[i + this.numPoints / 2] = (waveform.y[i]);
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }

    //Draws ramp down
    drawRampDown() {
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: this.fgenComponent.offset
        };
        let period = 0;
        if (parseFloat(this.fgenComponent.frequency) != 0) {
            period = 1 / parseFloat(this.fgenComponent.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        waveform.dt = dt;
        for (let i = 0; i < this.numPoints; i++) {
            waveform.y[i] = ((-1 * i) % (this.numPoints / 2)) * (parseFloat(this.fgenComponent.amplitude) / (this.numPoints / 2)) +
                parseFloat(this.fgenComponent.amplitude) + parseFloat(this.fgenComponent.offset);
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }

    //Not yet implemented
    drawNoise() {
        //let waveform: number[] = [];
    }

    //Not yet implemented
    drawTrap() {
        //let waveform: number[] = [];
    }

    //Not yet implemented
    drawSinPow() {
        //let waveform: number[] = [];
    }

    //Draw square wave
    drawSquare() {
        let waveform = {
            y: [],
            t0: 0,
            dt: 1,
            pointOfInterest: 0,
            triggerPosition: undefined,
            seriesOffset: this.fgenComponent.offset
        };
        let period = 0;
        if (parseFloat(this.fgenComponent.frequency) != 0) {
            period = 1 / parseFloat(this.fgenComponent.frequency);
        }
        let dt = (2 * period) / this.numPoints;
        waveform.dt = dt;
        let i = 0;
        for (i = 0; i < (this.numPoints / 2) * (parseFloat(this.fgenComponent.dutyCycle) / 100); i++) {
            waveform.y[i] = parseFloat(this.fgenComponent.offset) + parseFloat(this.fgenComponent.amplitude);
        }
        for (; i < (this.numPoints / 2); i++) {
            waveform.y[i] = parseFloat(this.fgenComponent.offset) - parseFloat(this.fgenComponent.amplitude);
        }
        for (let j = 0; i < this.numPoints; i++ , j++) {
            waveform.y[i] = waveform.y[j];
        }
        this.chart.setCurrentBuffer([new WaveformComponent(waveform)]);
        this.chart.drawWaveform(0, waveform, true);
    }
}