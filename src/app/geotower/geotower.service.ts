import { Injectable, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BasemapService } from '../basemap/basemap.service';
import { SaveUtil } from './util/saveUtil';
import { ConfigServices } from 'src/app/config.service';
import { LayerPreviewUtil } from './util/layerPreviewUtil';
import { GroupDockerUtil } from './util/groupDockerUtil';
import { Router } from '@angular/router';
import { DeleteUtil } from './util/deleteUtil';
import { SetLayerTOMapUtil } from './util/setLayerToMapUtil';
import { CommonService } from '../Services/common.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeotowerService {
  private subject= new Subject<any>();
  sendDelEvent(){
    this.subject.next();
  }
  getDelEvent(): Observable<any>{ 
    return this.subject.asObservable();
  }
  public geotowerLayersList = [];
  public geotowerClientLayersMap = new Map();
  public clientObjList = [];
  @Output() towerScrollEventEmit: EventEmitter<any> = new EventEmitter();
  @Output() deleteEventTowerRefreshEmit: EventEmitter<any> = new EventEmitter();
  public prevActiveServerLayersList = [];

  constructor(private http: HttpClient, private basemapService: BasemapService,
              private configService: ConfigServices, private router: Router, private commonService: CommonService) { }

  private _getUtilOptions() {
    return {
      SaveData: {
        instance: new SaveUtil(this, this.configService, this.router),
        event: 'saveData'
      },
      DisplayLayer: {
        instance: new LayerPreviewUtil(this.configService, this.basemapService),
        event: 'displayLayer'
      },
      GroupUngroup: {
        instance: new GroupDockerUtil(),
        event: 'groupDocker'
      },
      DeleteLayer: {
        instance: new DeleteUtil(this, this.configService),
        event: 'deleteLayer'
      },
      LayerSetToMap: {
        instance: new SetLayerTOMapUtil(this.basemapService, this.commonService),
        event: 'layerPreview'
      }
    };
  }

  activateEvent(options, eventName) {
    const events = this._getUtilOptions();
    const event = events[eventName].event;
    events[eventName].instance[event](options);
  }

  // geoserver APIs
  getLayerData(url, authentication) {
    return this.http.get(url, this._initHeaders(authentication));
  }

  createWorkspace(url, authentication, body) {
    return this.http.post(url, body, this._initHeaders(authentication));
  }

  createDataStore(url, authentication, body) {
    return this.http.post(url, body, this._initHeaders(authentication));
  }

  // postgres Apis
  getWorkspaceDetails(url) {
    return this.http.get(url);
  }

  getWorkspaceList(url) {
    return this.http.get(url);
  }

  createWorkspacePostgis(url, body) {
    return this.http.post(url, body, this._initHeaders(''));
  }

  saveLayerDataPostgis(url, body) {
    return this.http.put(url, body, this._initHeaders(''));
  }

  getLayerDataByWorkspaceName(url) {
    return this.http.get(url);
  }

  saveShpZipDataToGeoServer(request_URL, formData, authentication, postgres_store_name, postgres_workspace_name) {
    console.log('start ZIp shp files postgis API executions');
    this.http.post(request_URL, this.postgisRequestBody(postgres_store_name, postgres_workspace_name), this.initHeaders(authentication))
      .subscribe((postgisResults: any) => {
        console.log('postgisresults: ', postgisResults);
        const importData_ID = postgisResults.import.id;
        this.http.post(request_URL + '/' + importData_ID + '/tasks', formData)
          .subscribe(uploadzipResults => {
            console.log('uploadzipResults: ', uploadzipResults);
            this.http.put(request_URL + '/' + importData_ID + '/tasks/0/target',
              this.postgisRequestBody2(postgres_store_name), this.postgisRequestHeaders(authentication))
              .subscribe(putResults => {
                console.log('putResults: ', putResults);
                this.http.post(request_URL + '/' + importData_ID, this.postgisRequestHeaders2(authentication))
                  .subscribe(executeResults => {
                    console.log('executeResults: ', executeResults);
                    console.log('Shp zip file uploading success!! ');
                  });
              });
          });
      });
  }

  saveJpgDataToGeoServer(request_URL, formData, authentication, postgres_store_name, postgres_workspace_name) {
    console.log('start JPG postgis API executions');
    /* this.http.post(request_URL, this.postgisRequestBody(postgres_store_name, postgres_workspace_name), this.initHeaders(authentication))
      .subscribe(postgisResults => {
      }); */
  }

  saveKmlDataToGeoServer(request_URL, formData, authentication, postgres_store_name, postgres_workspace_name) {
    console.log('start kml postgis API executions');
    /* this.http.post(request_URL, this.postgisRequestBody(postgres_store_name, postgres_workspace_name), this.initHeaders(authentication))
      .subscribe(postgisResults => {
      }); */
  }

  deleteLayerFromGeoServer(url, authentication) {
    console.log('deleting url & authentication ', url, authentication);
    return this.http.delete(url, this._initHeaders(authentication));
  }

  deleteLayerFromPostgresql(url) {
    console.log('deleting url & authentication from postgresql DB ', url);
    return this.http.delete(url);
  }

  /** Header & Request Body section */

  private _initHeaders(authentication) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: authentication
      })
    };
    return httpOptions;
  }

  // Post-1 PostGis Request Body
  postgisRequestBody(postgres_store_name, postgres_workspace_name) {
    const body = {
      import: {
        targetStore: {
          dataStore: {
            name: postgres_store_name
          }
        },
        targetWorkspace: {
          workspace: {
            name: postgres_workspace_name
          }
        }
      }
    };
    return body;
  }
  // Post-3 PostGis Request Body
  postgisRequestBody2(postgres_store_name) {
    const body = {
      dataStore: {
        name: postgres_store_name
      }
    };
    return body;
  }
  // Post-3 PostGis Request Headers
  postgisRequestHeaders(authentication) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: authentication
      })
    };
    return httpOptions;
  }
  // Post-4 PostGis Request Headers
  postgisRequestHeaders2(authentication) {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: authentication
      })
    };
    return httpOptions;
  }

  private initHeaders(authentication) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: authentication
      })
    };
    return httpOptions;
  }
  towerScrollEventTrigger() {
    this.towerScrollEventEmit.emit();
  }
  deleteEventTowerRefresh(): any {
    this.deleteEventTowerRefreshEmit.emit();
  }
}
