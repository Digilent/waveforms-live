import {Injectable} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {TransportComponent} from '../../components/transport/transport.component';
import {HttpTransportComponent} from '../../components/transport/http-transport.component';

@Injectable()
export class TransportService {

    private http: Http;
    private transport: TransportComponent;

    constructor(_http: Http, _uri: string) {
        console.log('Transport Service Parent Constructor');
        this.http = _http;
        this.transport = new HttpTransportComponent(this.http, _uri);
    }

    setUri(uri) {
        this.transport.setUri(uri);
    }

    /*
    writeRead(endpoint: string, sendData: Object): Observable<any> {
        return Observable.create((observer) => {
            this.transport.writeRead(endpoint, sendData).subscribe(
                (data) => {
                    observer.next(data);
                    observer.complete();
                },
                (err) => {
                    console.log(err);
                },
                () => { }
            )
        })
    }
    */

    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.transport.writeRead(endpoint, sendData, dataType);
    }

    streamFrom(endpoint: string, sendData: Object, dataType: string, delay = 0): Observable<any> {
        return this.transport.streamFrom(endpoint, sendData, dataType, delay);
    }

    stopStream() {
        this.transport.stopStream();
    }

    getType() {
        return 'Parent';
    }
}