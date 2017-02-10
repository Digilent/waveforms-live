import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { TransportService } from '../../services/transport/transport.service';

@Injectable()
export abstract class InstrumentComponent {

    protected transport: TransportService;

    protected endpoint: string = '';
    public numChans: number;

    constructor(_transport: TransportService, _endpoint: string) {
        console.log('Generic Instrument Contructor');
        this.transport = _transport;
        this.endpoint = _endpoint;
    }

    _genericResponseHandler(commandObject: Object): Observable<any> {
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(commandObject), 'json').subscribe(
                (arrayBuffer) => {
                    let data;
                    try {
                        let stringify = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0)));
                        console.log(stringify);
                        data = JSON.parse(stringify);
                    }
                    catch (e) {
                        observer.error(e);
                        return;
                    }
                    if (data == undefined || data.agent != undefined) {
                        observer.error(data);
                        return;
                    }
                    for (let instrument in data) {
                        for (let channel in data[instrument]) {
                            if (data[instrument][channel][0].statusCode > 0) {
                                observer.error(data);
                                return;
                            }
                        }
                    }
                    observer.next(data);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }
}