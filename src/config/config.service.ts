import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
// import 'rxjs/add/operator/map';
import { Logger } from 'angular2-logger/core';
import { async } from 'rxjs/internal/scheduler/async';

@Injectable()
export class ConfigService {
    private _config: Object;
    private _env: Object;
    constructor(private http: HttpClient, private _logger: Logger) {
    }
    load() {
        return new Promise((resolve, reject) => {
            this.http.get('/config/env.json')
                .map(res => {
                    return res;
                })
                .subscribe((env_data) => {
                    this._logger.debug('data', env_data);
                    this._env = env_data;
                    this.http.get('/config/' + env_data['env'] + '.json')
                        .map(res => {
                            this._logger.debug('data', res);
                            return res;
                        })
                        .catch((error: any) => {
                            this._logger.error('Error occured while reading config data: ', error);
                            return Observable.throwError(error.json().error || 'Server error');
                        })
                        .subscribe((data) => {
                            this._logger.debug('data', data);
                            this._config = data;
                            resolve(true);
                        });
                });
        });
    }
    getEnv(key: any) {
        this._logger.debug('config with key: ', key);
        if (!this._config) {
            this._logger.debug('Calling config load');
            // use Async await here
            // async this.load();
            this.load();
        }
        return this._env[key];
    }
    get(key: any) {
        if (!this._config) {
            this._logger.debug('Calling config load');
            this.load();
        }
        this._logger.debug('config with key: ', key);
        return this._config[key];
    }
    // configData;
    // constructor(private http: HttpClient, private _logger: Logger) {
    //     this.getJSON().subscribe(data => {
    //         this.configData = data;
    //         this._logger.debug('configData: ', this.configData);
    //     },
    //     error => this._logger.error('Error occured while reading config data:', error));
    // }
    // private getJSON() {
    //     return this.http.get('/config/config.json')
    //         .map(result => {
    //             return result;
    //         });
    // }
}
