import {Component} from '@angular/core';
import {Http, Headers, RequestOptions, HTTP_PROVIDERS} from '@angular/http';
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
    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.writeReadHelper(this.http, this.rootUri, endpoint, sendData, dataType);
    }

    writeReadHelper(http: Http, rootUri: string, endpoint: string, sendData: any, dataType: string): Observable<any> {

        let uri = rootUri + endpoint;
        let body = sendData;

        return Observable.create((observer) => {
            let XHR = new XMLHttpRequest();


            // We define what will happen if the data are successfully sent
            XHR.addEventListener("load", function (event) {
                observer.next(event.currentTarget.response);
                observer.complete();
            });

            // We define what will happen in case of error
            XHR.addEventListener("error", function (event) {
                observer.error('TX Error: ', event);
            });


            // We setup our request
            XHR.open("POST", uri);
            //Set resposne type as arraybuffer to receive response as bytes
            XHR.responseType = 'arraybuffer';
            //Setting request header content type as application json causes nodejs error?
            //XHR.setRequestHeader("Content-Type", "application/json");
            XHR.send(body);
        });
    }

    //Stream via back to back xhr calls
    streamFrom(endpoint: string, sendData: any, dataType: string, delay = 0): Observable<any> {
        this.streamState.mode = 'continuous';

        return Observable.create((observer) => {
            let i = 0;

            let getData = function (writeReadHelper, streamState: any, http: Http, rootUri: string, endpoint: string, sendData: Object, delay: number) {
                writeReadHelper(http, rootUri, endpoint, sendData).subscribe(
                    (data: any) => {
                        //console.log('Inner Read ', i, ' >> ', data);
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

    //Sets stream to off
    stopStream() {
        this.streamState.mode = 'off';
    }

    //Get transport type
    getType() {
        return 'Http';
    }
}