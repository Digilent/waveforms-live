import {Component} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {TransportComponent} from './transport.component';

@Component({
    viewProviders: [HTTP_PROVIDERS],
    providers: [Http, HTTP_PROVIDERS]
})
export class HttpTransportComponent extends TransportComponent {

    private http: Http;

    private streamState: {
        mode: string,
        remainingSamples: number
    };

    private dataSource;
    private dataSourceSubscription;

    //private dataSource: ;;
    //private dataSourceSubscription: any; 

    constructor(_http: Http, _rootUri: string) {
        console.log('Transport HTTP Contructor');
        super();

        this.http = _http;
        this.rootUri = _rootUri;
        this.streamState = {
            mode: 'off',
            remainingSamples: 0
        }
    }

    //Data transmission wrapper to avoid duplicate code. 
    writeReadHelper(http: Http, rootUri: string, endpoint: string, sendData: Object): Observable<any> {
        return Observable.create((observer) => {
            http.post(rootUri + endpoint, JSON.stringify(sendData)).subscribe(
                (data: any) => {
                    let dataObj = JSON.parse(data._body);
                    //Handle device errors and warnings
                    if (dataObj.statusCode < 1) {
                        observer.next(dataObj);
                        observer.complete();
                    }
                    else {
                        observer.error(dataObj.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        })
    }

    writeRead(endpoint: string, sendData: Object): Observable<any> {
        return this.writeReadHelper(this.http, this.rootUri, endpoint, sendData);
    }

    streamFrom(endpoint: string, sendData: Object, delay = 0): Observable<any> {
        this.streamState.mode = 'continuous';

        return Observable.create((observer) => {
            let i = 0;

            let getData = function (writeReadHelper, streamState: any, http: Http, rootUri: string, endpoint: string, sendData: Object, delay: number) {
                writeReadHelper(http, rootUri, endpoint, sendData).subscribe(
                    (data: any) => {
                        console.log('Inner Read ', i, ' >> ', data);
                        observer.next(data)
                    },
                    (err) => {
                        console.log(err);
                    },
                    () => {
                        i++;
                        if (streamState.mode == 'continuous') {
                            //Wrap getData in anaonymous function to allow passing parameters to setTimeout handler
                            setTimeout(() => {
                                getData(writeReadHelper, streamState, http, rootUri, endpoint, sendData, delay)
                            }, delay);
                        } else {
                            observer.complete();
                        }
                    });
            };
            getData(this.writeReadHelper, this.streamState, this.http, this.rootUri, endpoint, sendData, delay);
        });
    }

    /*
        streamFrom(endpoint: string, sendData: Object): Observable<any> {
            this.streaming = true;
            return Observable.create((observer) => {
                this.writeRead(endpoint, sendData).subscribe(
                    (data: any) => {
                        console.log('new streaming data');
                        observer.next(data);
                    },
                    (err) => {
                        observer.error(err);
                    },
                    () => {
                        if (this.streaming == true) {
                            this.streamFrom(endpoint, sendData);
                        } else {
                            console.log('done streaming');
                            observer.complete();
                        }
                    });
            });
        }
    */

    stopStream() {
        this.streamState.mode = 'off';
    }

    getType() {
        return 'Http';
    }
}