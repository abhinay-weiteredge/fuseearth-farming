import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ConfigServices {
    configData;
    constructor(private http: HttpClient) {
        this.getJSON().subscribe(data => {
            this.configData = data;
        }, error => console.log(error));
    }
    private getJSON() {
        return this.http.get('/config/config.json')
            .map(result => {
                return result;
            });
    }
}
