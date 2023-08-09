import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import {formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class GeobaseService {

  serverUrl = environment.serverUrl; // 'http://18.144.21.216:8080/fusedotearth';
  serverUrlV2 = environment.serverUrlV2; // 'http://18.144.21.216:8080/fusedotearth';
  // localURL = 'http://localhost:9090';
  constructor(private http: HttpClientService) { }

  // getting default or saved geobase
  getGeobase(geobaseId, isDefault): any {
    console.log('geobaseId, isDefault ', geobaseId, isDefault);
    const url = this.serverUrl + '/api/geobases/' + geobaseId + '?isDefault=' + isDefault;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  getGeobaseDownload(geobaseId, isDefault, siteIds): any {
    console.log('geobaseId, isDefault ', geobaseId, isDefault);
    const url = this.serverUrlV2 + '/api/v2/geobases/' + geobaseId + '/geopads/' + geobaseId + '/sites/download?siteids=' + siteIds;
    const today= new Date();
    return this.http.get(url, {responseType: 'blob'})
      /* .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      ); */
      .subscribe(
        (response: any) => {
            let dataType = response.type;
            let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
            // if (filename)
            downloadLink.setAttribute('download', 'FE_' + formatDate(today, 'dd-MM-yyyy_hh:mm:ss_a', 'en-US') + '.kml');
            document.body.appendChild(downloadLink);
            downloadLink.click();
        }
    )
  }

  // getting the list of geobases
  getGeobasesList(includeDefaultGeobase): any {
    console.log('includeDefaultGeobase ', includeDefaultGeobase);
    const url = this.serverUrl + '/api/geobases/?includeDefaultGeobase=' + includeDefaultGeobase;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  createNewGeobase(geobaseInfo): any {
    console.log('creating new geobase info ', geobaseInfo);
    const url = this.serverUrl + '/api/geobases/';
    return this.http.post(url, geobaseInfo)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  updateDefaultGeobase(geobaseInfo, geobaseId): any {
    console.log('updating default geobase info ', geobaseInfo, geobaseId);
    const url = this.serverUrl + '/api/geobases/' + geobaseId;
    return this.http.put(url, geobaseInfo)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  createGeobaseShare(geobaseShareRequest, sessionId): any {
    console.log('share geobase info ', geobaseShareRequest, sessionId);
    const requestURL = this.serverUrl + '/api/geobases/' + sessionId + '/share';
    return this.http.post(requestURL, geobaseShareRequest);
      // .pipe(map((response: any) => {
      //   return response;
      // }), catchError((err: any) => {
      //   console.log(err);
      //   return err;
      // })
      // );
  }

  getGeobasesListByFilter(filterName): any {
    console.log('getting geobaseListByFilter ', filterName);
    const url = this.serverUrl + '/api/geobases/filter?filterName=' + filterName;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  getGeobasesListByType(filterName, sessionId): any {
    console.log('getting geobaseListByFilter ', filterName);
    const url = this.serverUrlV2 + '/api/v2/geobases';
    const body = {
        searchName : filterName,
        includeDefaultGeobase : false,
        sessionId, // global object --get from capture component
        isDefault : false
    };
    return this.http.post(url, body)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  createGeobaseTowerGeopad(): any {
    console.log('creating the geobase and tower and geopad');
    const url = this.serverUrl + '/api/create/sessionAndTowerAndGeoapd';
    return this.http.post(url, '')
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  getSharedGeobaseNew(filterName, sessionId): any {
    console.log('getting geobase by shared  ', sessionId);
    const url = this.serverUrlV2 + '/api/v2/geobases';
    const body = {
        searchName : filterName,
        includeDefaultGeobase : false,
        sessionId, // global object --get from capture component
        isDefault : false
    };
    return this.http.post(url, body)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }
  getSharedGeobase(sessionId, uuid): any {
    console.log('getting geobase by shared  ', sessionId, uuid);
    const url = this.serverUrl + '/api/guest/geobases/' + sessionId + '/' + uuid;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  getUserEmailsListByOrg(type = 'INDEPENDENT'): any {
    console.log('getting user emails List with in org  ');
    let url = '';
    if (type === 'INDEPENDENT') {
      url = this.serverUrl + '/api/organization/emaillist/all';
    } else if (type === 'ORG') {
      url = this.serverUrl + '/api/organization/emaillist';
    }
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }
  isGeobaseExist(name): Observable<any>{
    const url = this.serverUrlV2 + '/api/v2/geobases?name=' + name;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }) );
  }
}
