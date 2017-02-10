import { Injectable } from '@angular/core';

@Injectable()
export class CommandUtilityService {

    constructor() {
        console.log('command parser service constructor');
    }

    parseChunkedTransfer(): Promise<any> {
        return new Promise((resolve, reject) => {
            let data: ArrayBuffer = new ArrayBuffer(100);
            let chunkGuardLength = 100;
            let currentReadIndex: number = 0;
            let chunkLength: number;
            let chunkInfo = this.findNewLineChar(chunkGuardLength, data, currentReadIndex);
            chunkLength = this.getChunkLength(chunkInfo.stringBuffer);
            currentReadIndex = chunkInfo.endingIndex;
            let jsonPortion;
            try {
                jsonPortion = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(data.slice(currentReadIndex, chunkLength + 2))));
            }
            catch(e) {
                reject(e);
            }
            currentReadIndex = currentReadIndex + chunkLength + 2;
            chunkInfo = this.findNewLineChar(chunkGuardLength, data, currentReadIndex);
            chunkLength = this.getChunkLength(chunkInfo.stringBuffer);
            currentReadIndex = chunkInfo.endingIndex;
            let typedArray = new Int16Array(data.slice(currentReadIndex, chunkLength));
            resolve({
                json: jsonPortion,
                typedArray: typedArray
            });
        });
    }

    getChunkLength(chunkString: string) {
        return parseInt(chunkString, 16);
    }

    findNewLineChar(maxLength: number, data: ArrayBuffer, startIndex: number) {
        let char = '';
        let i = 0;
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

}