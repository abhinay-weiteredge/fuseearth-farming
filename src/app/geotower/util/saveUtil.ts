import * as moment from 'moment';
import { GeotowerService } from '../geotower.service';
import { ConfigServices } from 'src/app/config.service';
import { ConfigDataKeys } from 'src/app/config.enum';
import { Router } from '@angular/router';


export class SaveUtil {
  private _authentication: any;
  private _geomocusServer: any;
  private _createGeoserverWorkspaceURL: any;
  private _postgisConnParams: any;
  private _savePostgisworkspaceURL: any;
  private _savePostgisLayerURL: any;
  private _appBookmarkURL: any;
  private _baseURL: any;
  private _geoserverURL: string;
  private ZIP_EXTENSION_CONSTANT: string = '.zip';
  private KML_EXTENSION_CONSTANT: string = '.kml';
  private JPG_EXTENSION_CONSTANT: string = '.jpg';
  private TIF_EXTENSION_CONSTANT: string = '.tif';

  constructor(private geotowerService: GeotowerService,
    private configService: ConfigServices,
    private router: Router) {
    this._settingConfigData();
  }

  private _settingConfigData() {
    this._baseURL = this.configService.configData[ConfigDataKeys.baseURL];
    this._authentication = this.configService.configData[ConfigDataKeys.authorization];
    this._geomocusServer = this.configService.configData[ConfigDataKeys.geomocusServer][ConfigDataKeys.url];
    this._createGeoserverWorkspaceURL = this.configService.configData[ConfigDataKeys.createWorkspace];
    this._postgisConnParams = this.configService.configData[ConfigDataKeys.connectionParameters];
    this._savePostgisworkspaceURL = this.configService.configData[ConfigDataKeys.geomocusServer][ConfigDataKeys.save];
    this._appBookmarkURL = this.configService.configData[ConfigDataKeys.bookmarkurl];
    this._savePostgisLayerURL = this.configService.configData[ConfigDataKeys.geomocusServer][ConfigDataKeys.layersave];
    this._geoserverURL = this.configService.configData[ConfigDataKeys.geoserver][ConfigDataKeys.url];
  }

  public saveData(options) {
    console.log('checking is bookmark url or new workspace url', options.parmWorkspaceName);
    const paramWorkspaceName = options.parmWorkspaceName;
    if (paramWorkspaceName !== null && paramWorkspaceName !== undefined) {
      this._exstingWorkspaceUpdate(paramWorkspaceName, options.layerObj);
    } else {
      // create new workspace
      this._newWorkspaceCreation(options.basemapProjection, options.layerObj);
    }
  }

  private _exstingWorkspaceUpdate(paramWorkspaceName, layerDataObj) {
    this.geotowerService.getWorkspaceDetails(this._geomocusServer + paramWorkspaceName)
      .subscribe(result => {
        const workspaceId = result['rows'][0].id;
        if (result['rowCount'] > 0) {
          this._saveLayerDataPostgis(layerDataObj, paramWorkspaceName, workspaceId);
          this._saveLayerDataGeoServer(layerDataObj, paramWorkspaceName);
        }
      });
  }

  private _newWorkspaceCreation(projection, layerDataObj) {
    const customWorkspaceName = 'workspace_' + moment().utc().valueOf();
    this.geotowerService.createWorkspace(this._createGeoserverWorkspaceURL, this._authentication,
      this._workspaceJsonObj(customWorkspaceName))
      .subscribe((result) => {
        console.log('saved workspace Success!! ');
      },
        err => {
          console.log(err.statuscode);
          this.geotowerService.createWorkspacePostgis(this._savePostgisworkspaceURL,
            this._workspacePostgisJsonObj(customWorkspaceName, projection))
            .subscribe((result) => {
              console.log('workspace created in posttgis ');
              alert('Change to correct message later, Please add Bookmark : ' + this._appBookmarkURL + customWorkspaceName);
              if (result['rowCount'] > 0) {
                const datastoreURL = this._createGeoserverWorkspaceURL + customWorkspaceName + '/datastores/';
                this.geotowerService.createDataStore(datastoreURL, this._authentication, this._datastoreJsonObj(customWorkspaceName))
                  .subscribe(res => {
                    console.log('datastore saved ');
                  },
                    errs => {
                      console.log(errs);
                      this._saveLayerDataPostgis(layerDataObj, customWorkspaceName, result['rows'][0].id);
                      this._saveLayerDataGeoServer(layerDataObj, customWorkspaceName);
                      this.router.navigate(['/workspace', customWorkspaceName]);
                      setTimeout(() => {
                        this._addBookmark();
                      }, 2000);
                    });
              }
            });
        });
  }

  private _addBookmark() {
    alert('Press ' + (/Mac/i.test(navigator.platform) ? 'Cmd' : 'Ctrl') + '+D to bookmark this page.');
    return false;
  }

  private _saveLayerDataPostgis(layerDataObj, paramWorkspaceName, id) {
    this.geotowerService.saveLayerDataPostgis(this._savePostgisLayerURL,
      this._layerSchemaJsonObj(layerDataObj, paramWorkspaceName, id))
      .subscribe(response => {
        this._removeClientObjFromClientList(layerDataObj.name);
      });
  }

  private _removeClientObjFromClientList(clientLayerName) {
    this.geotowerService.clientObjList.forEach((clientobj, indexs) => {
      if (clientobj.name === clientLayerName) {
        this.geotowerService.clientObjList.splice(indexs, 1);
      }
    });
    console.log(this.geotowerService.clientObjList);
  }

  private _saveLayerDataGeoServer(layerDataObj, postgres_workspace_name) {
    const files = layerDataObj['zipfile'];
    const file: File = files;
    const formData: FormData = new FormData();
    formData.append('uploadFile', file, layerDataObj.fileName);
    if (layerDataObj['fileType'] === this.ZIP_EXTENSION_CONSTANT) {
      this.geotowerService.saveShpZipDataToGeoServer(this._geoserverURL, formData, this._authentication,
        'datastore_' + postgres_workspace_name, postgres_workspace_name);
    } else if (layerDataObj['fileType'] === this.JPG_EXTENSION_CONSTANT) {
      this.geotowerService.saveJpgDataToGeoServer(this._geoserverURL, formData, this._authentication,
        'datastore_' + postgres_workspace_name, postgres_workspace_name);
    } else if (layerDataObj['fileType'] === this.KML_EXTENSION_CONSTANT) {
      this.geotowerService.saveKmlDataToGeoServer(this._geoserverURL, formData, this._authentication,
        'datastore_' + postgres_workspace_name, postgres_workspace_name);
    }
    this.router.navigate(['/workspace', postgres_workspace_name]);
  }

  private _workspaceJsonObj(customWorkspaceName) {
    return JSON.stringify({
      'workspace': {
        'name': customWorkspaceName
      }
    });
  }

  private _layerSchemaJsonObj(layerData, paramWorkspaceName, id) {
    let metadataInfo = layerData.metadata;
    if (layerData['fileType'] === this.ZIP_EXTENSION_CONSTANT) {
      metadataInfo = this.getShpLayerExtent(layerData.metadata[0]).toString();
    }
    return JSON.stringify({
      'name': layerData.name,
      'type': layerData.fileType,
      'url': this._baseURL + paramWorkspaceName,
      'workspaceID': id,
      'files': layerData.zipfile[0],
      'details': '',
      'metadataInfo': metadataInfo,
      'firebaseURL': layerData.firebaseUrl
    });
  }

  private getShpLayerExtent(geoJson) {
    let extent = geoJson.features[0].geometry.coordinates;
    if (extent.length > 0) {
      extent = geoJson.features[0].geometry.coordinates[0];
      if (extent.length !== 2) {
        extent = geoJson.features[0].geometry.coordinates[0][0];
        if (extent.length > 2) {
          extent = geoJson.features[0].geometry.coordinates[0][0][0];
        }
      }
    }
    return extent;
  }

  private _workspacePostgisJsonObj(customWorkspaceName, projection) {
    return JSON.stringify({
      'name': customWorkspaceName,
      'projection': projection,
      'basemap_type': 'OSM',
      'bookmark_url': this._appBookmarkURL + customWorkspaceName
    });
  }

  private _datastoreJsonObj(customWorkspaceName) {
    const dataStoreName = 'datastore_' + customWorkspaceName;
    return JSON.stringify({
      'dataStore': {
        'name': dataStoreName,
        'connectionParameters': this._postgisConnParams
      }
    });
  }
}
