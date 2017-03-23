import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class CommandUtilityService {

    constructor() {
        console.log('command parser service constructor');
    }

    parseChunkedTransfer(data): Promise<any> {
        return new Promise((resolve, reject) => {
            if (String.fromCharCode.apply(null, new Uint8Array(data.slice(0, 1))) === '{') {
                reject('json');
                return;
            }
            let chunkGuardLength = 100;
            let currentReadIndex: number = 0;
            let chunkLength: number;
            let chunkInfo = this._findNewLineChar(chunkGuardLength, data, currentReadIndex);
            console.log('first');
            console.log(chunkInfo);
            console.log(String.fromCharCode.apply(null, new Uint8Array(data.slice(0, 300))));
            chunkLength = this._getChunkLength(chunkInfo.stringBuffer);
            currentReadIndex = chunkInfo.endingIndex;
            let jsonPortion;
            try {
                jsonPortion = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(data.slice(currentReadIndex, currentReadIndex + chunkLength + 2))));
            }
            catch (e) {
                reject(e);
                return;
            }
            currentReadIndex = currentReadIndex + chunkLength + 2;
            console.log(currentReadIndex);
            chunkInfo = this._findNewLineChar(chunkGuardLength, data, currentReadIndex);
            chunkLength = this._getChunkLength(chunkInfo.stringBuffer);
            console.log(chunkInfo);
            currentReadIndex = chunkInfo.endingIndex;
            console.log(currentReadIndex, chunkLength);
            let typedArray;
            try {
                typedArray = new Int16Array(data.slice(currentReadIndex, currentReadIndex + chunkLength));
            }
            catch(e) {
                reject(e);
                return;
            }
            resolve({
                json: jsonPortion,
                typedArray: typedArray
            });
        });
    }

    observableParseChunkedTransfer(data): Observable<any> {
        let start = performance.now();
        return Observable.create((observer) => {
            if (String.fromCharCode.apply(null, new Uint8Array(data.slice(0, 1))) === '{') {
                observer.error('json');
                return;
            }
            let chunkGuardLength = 100;
            let currentReadIndex: number = 0;
            let chunkLength: number;
            let chunkInfo = this._findNewLineChar(chunkGuardLength, data, currentReadIndex);
            chunkLength = this._getChunkLength(chunkInfo.stringBuffer);
            currentReadIndex = chunkInfo.endingIndex;
            let jsonPortion;
            try {
                jsonPortion = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(data.slice(currentReadIndex, currentReadIndex + chunkLength + 2))));
            }
            catch (e) {
                observer.error(e);
            }
            currentReadIndex = currentReadIndex + chunkLength + 2;
            chunkInfo = this._findNewLineChar(chunkGuardLength, data, currentReadIndex);
            chunkLength = this._getChunkLength(chunkInfo.stringBuffer);
            currentReadIndex = chunkInfo.endingIndex;
            let typedArray;
            try {
                typedArray = new Int16Array(data.slice(currentReadIndex, currentReadIndex + chunkLength));
            }
            catch(e) { 
                observer.error(e);
                return;
            }
            let finish = performance.now();
            console.log('in function parse time: ' + (finish - start));
            observer.next({
                json: jsonPortion,
                typedArray: typedArray
            });
            observer.complete();
        });
    }

    _getChunkLength(chunkString: string) {
        return parseInt(chunkString, 16);
    }

    _findNewLineChar(maxLength: number, data: ArrayBuffer, startIndex: number) {
        let char = '';
        let i = startIndex;
        maxLength = maxLength + i;
        let stringBuffer = '';
        while (i < maxLength && char !== '\n') {
            char = String.fromCharCode.apply(null, new Int8Array(data.slice(i, i + 1)));
            stringBuffer += char;
            i++;
        }
        let returnInfo = {
            stringBuffer: stringBuffer,
            endingIndex: i
        };
        return returnInfo;
    }

    createInt16ArrayBuffer(array: number[]): ArrayBuffer {
        let arrayBufferView = new Int16Array(array);
        return arrayBufferView.buffer;
    }

    createArrayBufferFromString(source: string): ArrayBuffer {
        let arrayBuffer = new ArrayBuffer(source.length);
        let bufView = new Uint8Array(arrayBuffer);
        for (var i = 0; i < source.length; i < i++) {
            bufView[i] = source.charCodeAt(i);
        }
        return arrayBuffer;
    }

    createChunkedArrayBuffer(json: any, arrayBuffer: ArrayBuffer): Uint8Array {
        let jsonString = JSON.stringify(json);
        let jsonStringLength = jsonString.length.toString(16);
        let arrayBufferLength = arrayBuffer.byteLength.toString(16);
        let beginningString = jsonStringLength + '\r\n' + jsonString + '\r\n' + arrayBufferLength + '\r\n';
        let endString = '\r\n0\r\n\r\n';
        let startArrayBuffer = this.createArrayBufferFromString(beginningString);
        let endingArrayBuffer = this.createArrayBufferFromString(endString);
        let temp = new Uint8Array(startArrayBuffer.byteLength + arrayBuffer.byteLength + endingArrayBuffer.byteLength);
        temp.set(new Uint8Array(startArrayBuffer), 0);
        temp.set(new Uint8Array(arrayBuffer), startArrayBuffer.byteLength);
        temp.set(new Uint8Array(endingArrayBuffer), startArrayBuffer.byteLength + arrayBuffer.byteLength);
        //Since we're actually sending the result directly to the transport, return the actual byte array instead of the arrayBuffer which is just a reference.
        return temp;
    }

}