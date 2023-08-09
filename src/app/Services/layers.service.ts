
import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LayersService {

  serverUrl = environment.serverUrl; 
  serverUrlV2 = environment.serverUrlV2// 'http://18.144.21.216:8080/fusedotearth';
  // localURL = 'http://localhost:9090';
  constructor(private http: HttpClientService) { }

  getAllLayers(aTowerId): any {
    console.log('tower id is ', aTowerId);
    const url = this.serverUrl + '/api/towers/' + aTowerId + '/layers';

    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  getWorkspaceWithLayer_GEOServer(wsname: string): any {
    let url = 'http://18.144.21.216:8282/geoserver/rest/workspaces/' + wsname + '/layers';
    url = 'http://18.144.21.216:8282/geoserver/tower_2_1606713572617/wms?service=WMS&version=1.1.0&request=GetMap&layers=tower_2_1606713572617%3Acnty24k09_1_poly0&bbox=-374443.1875%2C-604504.6875%2C540082.75%2C450029.875&width=666&height=768&srs=EPSG%3A3310&format=image%2Fjpeg';
    return this.http.get(url)
      .pipe(map((response: any) => {
        console.log('geoserver response ');
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  getTowerIncludeLayers(towerId, isGuest): any {
    let url = this.serverUrl + '/api/towers/' + towerId + '?includeLayers=true'; // '/fusedotearth/api/tower/search/' + userMailId;
    if (isGuest) {
      url = this.serverUrl + '/api/guest/towers/' + towerId + '?includeLayers=true';
    }
    return this.http.get(url)
      .pipe(map((response: any) => {
        console.log('response is ', response);
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      })
      );
  }

  createWorkspceForUser(towerName: string, orgId, projection: string): any {
    const url = this.serverUrl + '/api/tower/save' +
      '?towerName=' + towerName + '&bookmarkUrl=test&basemapType=osm&projection=' + projection;
    const data = {
      basemapType: 'osm', bookmarkUrl: 'test',
      createdDate: new Date().toISOString(),
      name: towerName, organizationId: orgId,
      owner: 2,
      projection, status: 'Active'
    };

    return this.http.postJson(url, JSON.stringify(data))
      .pipe(map(response => {
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  saveMapLayer(file: File, layerInfo: any): any {
    console.log('In upload participant create Tower and layer');
    const url = this.serverUrl + '/api/createTowerAndLayer';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('layerInfo', JSON.stringify(layerInfo));
    console.log(layerInfo);
    console.log(formData);
    return this.http.post(url, formData, { observe: 'events', reportProgress: true })
      .pipe(map(response => {
        console.log(response);
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  saveLayerToExistingTower(file: File, layerInfo: any, towerId): any {
    console.log('In upload participant create Tower and layer');
    const url = this.serverUrl + '/api/towers/' + towerId + '/layers';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('layerInfo', JSON.stringify(layerInfo));
    console.log(layerInfo);
    console.log(formData);
    return this.http.post(url, formData, { observe: 'events', reportProgress: true })
      .pipe(map(response => {
        console.log(response);
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  updateLayerToExistingTower(layerInfo: any, towerId): any {
    console.log('In upload participant create Tower and layer');
    const url = this.serverUrl + '/api/towers/' + towerId + '/layers/'  + layerInfo.layerId + '/update';
    const formData = new FormData();
    formData.append('towerLayerInfo', JSON.stringify(layerInfo));
    console.log(layerInfo);
    console.log(layerInfo);
    return this.http.post(url, formData, { observe: 'events', reportProgress: true })
      .pipe(map(response => {
        console.log(response);
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  updateLayerOrder(layerOrderInfo: any, towerId): any{
    console.log('In updateLayerOrder()');
    const url = this.serverUrlV2 + '/api/towers/layers/order';
    const formData = new FormData();
    const requestData = {"towerId": towerId, "towerLayerRelationInfoList": layerOrderInfo};
    formData.append('towerLayerInfo', JSON.stringify(requestData));
    console.log(requestData);
    console.log(layerOrderInfo);
    return this.http.post(url, formData, { observe: 'events', reportProgress: true })
      .pipe(map(response => {
        console.log(response);
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  saveMultipleLayers(towerLayersInfo, multipartFiles): any {
    console.log('saving multiple layers service ', towerLayersInfo, multipartFiles);
    const url = this.serverUrl + '/api/towers/layers/multiple/';
    const formData = new FormData();
    multipartFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('towerLayerInfo', JSON.stringify(towerLayersInfo));
    return this.http.post(url, formData, { observe: 'events', reportProgress: true });
      // .pipe(map((response: any) => {
      //   return response;
      // }), catchError((err: any) => {
      //   console.log(err);
      //   return err;
      // })
      // );
  }

  deleteTowerLayerRelation(towerId, layerId): any {
    console.log('deleting the layer and tower relation ', towerId, layerId);
    const url = this.serverUrl + '/api/towers/' + towerId + '/layers/' + layerId;
    return this.http.delete(url /*, { observe: 'events', reportProgress: true }*/)
      .pipe(map(response => {
        console.log(response);
        return response;
      }), catchError((err): any => {
        return throwError(err);
      }));
  }

  createZip(multipartFiles): any {
    console.log('create zip from multiple layers service ', multipartFiles);
    const url = this.serverUrl + '/api/create/zip';
    const formData = new FormData();
    multipartFiles.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post(url, formData, { responseType: 'blob', observe: 'events', reportProgress: true });
      // .pipe(map((response: any) => {
      //   return response;
      // }), catchError((err: any) => {
      //   console.log(err);
      //   return err;
      // })
      // );
  }
}
