import { Injectable } from '@angular/core';

declare var waveformsLiveDictionary: any;

@Injectable()
export class FftService {
    public workerRef: Worker;
    public webworkerErrorFlag: boolean = false;

    constructor() {
        console.log('fft service constructor');
        this.spawnWorker();
    }

    spawnWorker() {
        try {
            this.workerRef = new Worker('assets/js/fft.worker.js');
        }
        catch (e) {
            console.log(e);
            this.webworkerErrorFlag = true;
            alert('Error creating webworker. Please use a modern browser');
        }
    }

    calculateFft(array: number[], sampleFreq: number): Promise<{ frequency: number, amplitude: number }> {
        if (this.webworkerErrorFlag) {
            return new Promise((resolve, reject) => { reject('Worker not supported'); });
        }
        else {
            return new Promise((resolve, reject) => {
                this.workerRef.onmessage = ((e) => {
                    let finish = performance.now();
                    console.log('web worker done in');
                    console.log(finish - start);
                    resolve(e.data);
                });
                this.workerRef.onerror = ((e) => {
                    reject(e);
                });
                let imaginaryArray = new Array(array.length).fill(0);
                let start = performance.now();
                this.workerRef.postMessage({
                    real: array,
                    imaginary: imaginaryArray,
                    sampleFreq: sampleFreq
                });
            });
        }
    }

}