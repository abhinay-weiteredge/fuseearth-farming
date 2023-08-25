import { Component, OnInit, ViewChild, ElementRef, EventEmitter, SimpleChange, Input, OnChanges,
  HostListener, Renderer2, AfterViewInit, Output } from '@angular/core';
import { GeotowerService } from './geotower.service';
import { BasemapService } from '../basemap/basemap.service';
import { ConfigDataKeys } from 'src/app/config.enum';
import { ConfigServices } from 'src/app/config.service';
import { ActivatedRoute } from '@angular/router';
import { AuthObservableService } from '../Services/authObservableService';
import { CommonService } from '../Services/common.service';
import { LayersService } from '../Services/layers.service';
import { GeobaseService } from '../Services/geobase.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { GeobarAlertComponent } from '../geobar-alert/geobar-alert.component';
import { AnalyticsService } from '../Services/analytics.service';
import { environment } from 'src/environments/environment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TowerItemComponent } from './tower-item/tower-item.component';

@Component({
  selector: 'app-geotower',
  templateUrl: './geotower.component.html',
  styleUrls: ['./geotower.component.scss']
})
export class GeotowerComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('towerOrder') towerOrderEle: ElementRef;
  towerOrderEleEmit: EventEmitter<any> = new EventEmitter();
  @ViewChild('tower') towerEle: ElementRef;
  @ViewChild('dragenable') dragenable: ElementRef;
  @Input() sessionId;
  @Input() towerId;
  @Input() currentSession: any = {};
  @Input() isGuest = true;
  @Input() globalObject;
  @Input() userClickOnMap = '';
  isGeotowerActive = false;
  geotowerDocker = 'tower-btn';
  isDragDisabled=true;
  scrollerIsActive = false;
  geotowerMaximized = false;
  private postgisLayersList = [];
  layersList: any[] = [];
  draggable = true;
  @ViewChild('towerItems') towerItemsEle: ElementRef;

  refreshTowerScroll = String(new Date().getTime());
  layerOptionsSelected = false;
  towerWidth = 165;
  towerOptionsWidth = 155;
  paddingForScrollSpace = 45;
  trailingSpace = 45;
  layerOptionsHeight = 100;
  // isGuest = true;
  currentWorkspace: any = {};
  afterLoginOperations: any[] = [];
  geobaseInfo: any = null;
  refreshTowerData = '';
  currentLayersCount: any;

  // Here new code for basemap...
  isBaseMapOptActive = false;
  // mapTypeName = 'toner';
  // selecteMapType: any = { name: 'Toner (Stamen)', value: 'toner' };
  selecteMapType: any = { name: 'Street (Bing)', value: 'bingstreet' };
  @Input() isDeleteDisable = false;
  mapTypesList: any[] = [
    { name: 'Satellite (Mapbox)', value: 'satellite' },
    { name: 'Satellite (Bing)', value: 'bingsatellite' },
    { name: 'Street (Bing)', value: 'bingstreet' },
    { name: 'Street (Google)', value: 'googlestreet' },
    { name: 'Satellite (Google)', value: 'googlesatellite' },
    { name: 'Toner (Stamen)', value: 'toner' },
    { name: 'Terrain (Stamen)', value: 'terrain' },
    { name: 'Open Street', value: 'openstreet' },
  ];
  @ViewChild(GeobarAlertComponent) alertComponent: GeobarAlertComponent;
  showSelectedImgPreview: boolean;
  geoRefEnabled = false;
  showGeoReferencingScreen: boolean;
  minimizedGeoRefWindow: boolean;
  @ViewChild('geoRefWindow') geoRefWindow: ElementRef<HTMLDivElement>;
 
  selectedLayerToPreview: any = {};
  showGeorefConfirmClose = false;
  geoRefOrPreviewClosed: string;
  markedGeoRefPoints = 0;
  geoRefLayerDataToShow: any = {};
  showTooltip = true;
  layer: any;
dragg=TowerItemComponent.isdrag;
  dragen2: any;
  dragfeature=true;
  constructor(private geotowerService: GeotowerService, private renderer: Renderer2,
              private basemapService: BasemapService, private commonService: CommonService,
              private configService: ConfigServices, private authObsr: AuthObservableService,
              private route: ActivatedRoute, private layersService: LayersService,
              private geobaseService: GeobaseService, private analytics: AnalyticsService) {

    // if (this.commonService.isValid(localStorage.getItem('token'))) {
    //   this.isGuest = false;
    // } else {
    //   this.isGuest = true;
    // }
    this.authObsr.subscribeForAuthStatus('GeotowerComponent', (status, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(status);
      console.log(msg);
      if (status.status === 'success') {
        this.isGuest = false;
        this.closeTooltip();
        // this.runAllWaitingTasks();
      } else if (status.status === 'failed') {
        this.isGuest = true;
        // this.afterLoginOperations = [];
      }
    });
    this.authObsr.subscribeForGeorefToggleStatus('GeotowerComponent', (status, msg) => {
        console.log('GEOREF TOGGLE STATUS CHANGED');
        console.log(status,"status of georef");
        console.log(msg);
        this.geoRefEnabled = status;
        if (!this.geoRefEnabled){
          this.closeGeoRefPanel();
        }
    });
  }

  @HostListener('window:keyup.esc', ['$event'])
  keyEvent(event: KeyboardEvent): any {
      this.isBaseMapOptActive = false;
  }
  

  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    console.log('IN currentSession CHANGES', changes.isGuest);
    console.log(changes,"these are changes in geotower");
    console.log(this);
    console.log(TowerItemComponent.isdrag,"cvbcvb")
    
    
    
    // if(TowerItemComponent.isdrag==true){
    //   console.log(TowerItemComponent.isdrag,"i am in geotower")
    //   this.dragenable.nativeElement.setAttribute('cdkDrag')
    // }
    // if(TowerItemComponent.isdrag==false){
    //   this.dragenable.nativeElement.removeAttribute('cdkDrag')
    // }
  
      
    
    // console.log('is guest ?? ', this.isGuest, this.isGeotowerActive, changes.isGuest.currentValue);
    // if (!this.isGeotowerActive) {
    //   this.activateGeotower();
    // }
    // here need to work about session & guest
    if (!this.isGuest) {
      if (this.commonService.isValid(changes.globalObject)) {
        if (this.commonService.isValid(changes.globalObject.currentValue)){
          if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
            this.currentSession = this.globalObject.geobase;
            this.tryToLoadTower();
          }
        }
      }
      
    }
    if (this.commonService.isValid(changes.currentSession)) {
      if (this.commonService.isValid(changes.currentSession.currentValue) && changes.currentSession.currentValue) {
        this.tryToLoadTower();
      }
      
    }
    if (this.commonService.isValid(changes.isGuest)) {
      if (this.commonService.isValid(changes.isGuest.currentValue) && !changes.isGuest.currentValue) {
        console.log('NOT A GUEST');
        if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
          this.currentSession = this.globalObject.geobase;
          this.tryToLoadTower();
        }
      } else if (this.commonService.isValid(changes.isGuest.currentValue) && changes.isGuest.currentValue) {
        console.log('GUEST');
        this.afterLoginOperations = [];
        this.towerId = 0;
        this.basemapService.getCurrentBasemap().getLayers().forEach(layerObj => {
          if (layerObj !== undefined) {
            const index = this.layersList.findIndex(layer => layer.name === layerObj.values_.name);
            if (index !== -1) {
              this.basemapService.getCurrentBasemap().removeLayer(layerObj);
            }
          }
        });
        this.layersList = [];
        this.geotowerService.geotowerLayersList = [];
        this.geotowerService.clientObjList = [];
        this._getTowerLayerList(0);
        // this.towerReloaded.emit(String(new Date().getTime()));
        // this.layersCount.emit(this.layersList.length);
      }
    }
    if (this.commonService.isValid(changes.userClickOnMap)) {
      if (this.commonService.isValid(changes.userClickOnMap.currentValue)) {
          this.isBaseMapOptActive = false;
      }
    }
  }

  tryToLoadTower(): any {
    
    console.log('In tryToLoadTower');
    console.log(this.currentSession, this.isGuest);
    if (this.isGuest) {
      console.log('NOT YET LOGGED-IN');
      this.refreshTowerData = String(new Date().getTime());
    }
    if (this.currentSession.status !== 'completed') {
      console.log('SESSION DATA NOT COLLECTED');
    }
    if (this.currentSession.status === 'completed' && !this.isGuest) {
      // LOAD TOWER
      console.log('LOAD TOWER DATA');
      this.runAllWaitingTasks();
      this.geobaseInfo = this.currentSession;
      this.towerId = this.currentSession.towerId;
      console.log(this.towerId, this.currentSession);
      this._getTowerLayerList(this.towerId);

      // REFRESHING TOWER WHEN LOGOUT AND LOGIN WITH TOWER OPENED
      this.refreshTowerData = String(new Date().getTime());

    }
  }

  ngOnInit(): any {
    
    //this.activateGeotower();
    // this._getLayerListFromPostgis(null);
    this._setClientLayerToTower();
    // this.getGeobaseInfo();
    console.log(this);
    if (!this.isGuest) {
    }
    this.geotowerService.towerScrollEventEmit.subscribe((event) => {
      setTimeout(() => {
        this.heightEventTrigger();
        this.refreshTowerScroll = String(new Date().getTime());
      }, 1500);
    });
    this.geotowerService.deleteEventTowerRefreshEmit.subscribe((event) => {
      /* this.activateGeotower();
      setTimeout(() => {
        this.activateGeotower();
      }, 500); */
      this.tryToLoadTower();
    });
    setTimeout(() => {
      this.authObsr.updateBaseLayerName(this.selecteMapType.name);
    }, 1000);
    // Here georef emit function adding.. its subscribe call from basemapservice
  }

  ngAfterViewInit(): void{
    this.activateGeotower();
    this.closeTooltip();
  }

  runAllWaitingTasks(): any {
    this.afterLoginOperations.forEach(operation => {
      if (operation.type === 'saveTowerLayer') {
        console.log('CALLING SAVE LAYER AFTER LOGIN');
        // type: 'saveTowerLayer',
        // data: layerData
        this.saveTowerLayerFun(operation.data);
        const index = this.afterLoginOperations.findIndex(op => op.type === 'saveTowerLayer');
        if (index !== -1) {
          this.afterLoginOperations.splice(index, 1);
        }
      }
    });
  }

  creatingRequestLayerInfo(layerData): any {
    console.log(layerData.layerObj.type);
    console.log(layerData.layerObj.fileType);
    let fileTypeName = layerData.layerObj.type || layerData.layerObj.fileType;
    fileTypeName = fileTypeName.substring(fileTypeName.indexOf('.') + 1);
    const layerObj = {
      layerId: this.commonService.isValid(layerData.layerObj.layerId) ? layerData.layerObj.layerId : 0,
      name: layerData.layerObj.name,
      organizationId: this.commonService.isValid(layerData.layerObj.organizationId) ? layerData.layerObj.organizationId : 1,
      type: fileTypeName,
      orderNumber: layerData.layerObj.orderNumber,
      metadata: '',
      towerId: '',
      status: 'Active',
      owner: this.commonService.isValid(layerData.layerObj.owner) ? layerData.layerObj.owner : 0,
      url: '',
      workspaceName: '',
      datastoreName: '',
      // createdDate: new Date().toISOString(),
      // updatedDate: new Date().toISOString()
      // created_date: new Date().toISOString(),
      // updated_date: new Date().toISOString()
    };
    /* if (layerData.layerObj.fileType === '.zip' || layerData.layerObj.fileType === 'kml') {
      this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
        if (layerData.layerObj.name === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          console.log('adding extent value for shap zip or kml files ', extentValue);
          layerObj.metadata = JSON.stringify(extentValue);
          layerData.layerObj.metadata = extentValue;
        }
      });
    } */
    if (layerData.layerObj.fileType === '.zip') {
      if (layerData.layerObj.zipfile instanceof File) {
        // here zip file request json creation
        // Here adding the medatadata i.e. extent of this shap file
        this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
          if (layerData.layerObj.name === currentLayer.values_.name) {
            const extentValue = currentLayer.values_.source.getExtent();
            console.log('adding extent value for zip shap files ', extentValue);
            layerObj.metadata = JSON.stringify(extentValue);
          }
        });
        return layerObj;
      } else {
        // AWS CLOUD URL
        layerObj.metadata = JSON.stringify(layerData.layerObj.metadata);
        return layerObj;
      }
    } else {
      // here jpeg, kml..files json creation
      layerObj.metadata = JSON.stringify(layerData.layerObj.metadata);
      layerObj.url = layerData.layerObj.firebaseUrl;
      return layerObj;
    }
  }
  saveTowerLayerFun(layerData): any {
    // Here starting saving the layer.. so need to disable the delete button
    console.log('starting disable delete button ', this.isDeleteDisable);
    this.isDeleteDisable = true;
    console.log('In saveTowerLayerFun', layerData);
    const layerInfo = this.creatingRequestLayerInfo(layerData);
    console.log('requesting layer object json is ', layerInfo);
    if (!this.isGuest && this.currentSession.status === 'completed') {
      console.log('FOUND LOGGED-IN USER');
      let file: File = layerData.layerObj.zipfile;
      if (layerData.layerObj.fileType !== '.zip') {
          // file = layerData.layerObj.files;
          file =  new File([new Blob()], layerInfo.name, {lastModified: new Date().getTime()});
      }

      // here adding some code condition default session available or not,
      // yes then save it as under that session & tower
      console.log('geobase information ', this.geobaseInfo, this.towerId);
      if (this.geobaseInfo !== null && this.towerId > 0) {
        console.log('some session available and save layer to that session & tower');
        this.getTowerInfoAndSaveLayer(this.towerId, file, layerInfo);
      } else {
        console.log('new session need to create for user i.e. default session and save the tower & layer');
        this.saveDefaultSessioTowerLayer(file, layerInfo);
      }
    } else {
      console.log('LOGGED-IN USER NOT FOUND');
      // SAVING OPERATION TO PERFORM AFTER LOGIN
      const index = this.afterLoginOperations.findIndex(op => op.type === 'saveTowerLayer');
      if (index === -1) {
        // IF NO TOWER LAYER SAVE REQUEST PRESENT
        this.afterLoginOperations.push({
          type: 'saveTowerLayer',
          data: layerData
        });
      } else {
        // IF TOWER LAYER SAVE REQUEST PRESENT, SAVING RECENT REQUEST ONLY
        this.afterLoginOperations[index] = { type: 'saveTowerLayer', data: layerData };
      }
      this.authObsr.initiateAuthenticationRequest({ from: 'geotower' });
    }
  }

  getTowerInfoAndSaveLayer(towerId, file, layerInfo): any {
    if (this.commonService.isValid(towerId)) {
      this.layersService.getTowerIncludeLayers(towerId, this.isGuest)
        .subscribe(towerInfo => {
          console.log('Got towerInfo info', towerInfo);
          if (!this.commonService.isValid(towerInfo)) {
            console.log('No towerInfo present');
          } else {
            console.log('towerInfo present', towerInfo[0].tower);
            layerInfo.workspaceName = towerInfo[0].tower.name;
            layerInfo.datastoreName = 'datastore_' + towerInfo[0].tower.name;
            layerInfo.towerId = this.towerId;
            this.saveLayerToExistingTower(file, layerInfo, this.towerId);
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while getting towerInfo');
          console.log(error);
          if (error.errorCode === 500) {
          }
        });
    }
  }

  getTowerInfoAndUpdateLayer(towerId, layerInfo): any {
    if (this.commonService.isValid(towerId)) {
      this.layersService.getTowerIncludeLayers(towerId, this.isGuest)
        .subscribe(towerInfo => {
          console.log('Got towerInfo info', towerInfo);
          if (!this.commonService.isValid(towerInfo)) {
            console.log('No towerInfo present');
          } else {
            console.log('towerInfo present', towerInfo[0].tower);
            layerInfo.workspaceName = towerInfo[0].tower.name;
            layerInfo.datastoreName = 'datastore_' + towerInfo[0].tower.name;
            layerInfo.towerId = this.towerId;
            this.updateLayerToExistingTower(layerInfo, this.towerId);
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while getting towerInfo');
          console.log(error);
          if (error.errorCode === 500) {
          }
        });
    }
  }

  saveLayerToExistingTower(file, layerInfo, towerId): any {
    this.layersService.saveLayerToExistingTower(file, layerInfo, towerId)
        .subscribe((result: HttpEvent<any>) => {
          if (result.type === HttpEventType.UploadProgress) {
            // console.log(`Loaded : ${result.loaded}`);
            // console.log(`TOTAL : ${result.total}`);
            const layerSaveProgress = (100 * result.loaded / result.total).toFixed(2);
          }
          if (result.type === HttpEventType.Response) {
              // Here got some response frm saving the layer.. so need to enable the delete button
              this.isDeleteDisable = false;
              if (result.status === 200 || result.status === 201) {
                console.log('Layer saved', result);
                this.geotowerService.clientObjList.forEach((obj, index) => {
                  if (obj.name === layerInfo.name) {
                    this.geotowerService.clientObjList.splice(index, 1);
                  }
                });
                this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
                  if (layerInfo.name === currentLayer.values_.name) {
                    console.log('removing the vector layer from map');
                    this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
                  }
                });
                /* this.activateGeotower();
                setTimeout(() => {
                  this.activateGeotower();
                }, 500); */
                this.tryToLoadTower();
                setTimeout(() => {
                  this.updateLayerOrderForRenderingOnMap();
                }, 5000);
                
              } else {
                console.log('Save map status');
                console.log(result, result.type);
              }
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while saving layer');
          console.log(error);
        });
  }

  updateLayerToExistingTower(layerInfo, towerId): any {
    this.layersService.updateLayerToExistingTower(layerInfo, towerId)
        .subscribe((result: HttpEvent<any>) => {
          if (result.type === HttpEventType.UploadProgress) {
            // console.log(`Loaded : ${result.loaded}`);
            // console.log(`TOTAL : ${result.total}`);
            const layerSaveProgress = (100 * result.loaded / result.total).toFixed(2);
          }
          if (result.type === HttpEventType.Response) {
              // Here got some response frm saving the layer.. so need to enable the delete button
              this.isDeleteDisable = false;
              if (result.status === 200 || result.status === 201) {
                console.log('Layer updated', result);
                this.geotowerService.clientObjList.forEach((obj, index) => {
                  if (obj.name === layerInfo.name) {
                    this.geotowerService.clientObjList.splice(index, 1);
                  }
                });
                this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
                  if (layerInfo.name === currentLayer.values_.name) {
                    console.log('removing the vector layer from map');
                    this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
                  }
                });
                /* this.activateGeotower();
                setTimeout(() => {
                  this.activateGeotower();
                }, 500); */
                this.tryToLoadTower();
              } else {
                console.log('Save map status');
                console.log(result, result.type);
              }
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while saving layer');
          console.log(error);
        });
  }

  saveDefaultSessioTowerLayer(file, layerInfo): any {
    this.layersService.saveMapLayer(file, layerInfo)
        .subscribe((result: HttpEvent<any>) => {
          if (result.type === HttpEventType.UploadProgress) {
            console.log(`Loaded : ${result.loaded}`);
            console.log(`TOTAL : ${result.total}`);
            const layerSaveProgress = (100 * result.loaded / result.total).toFixed(2);
          }
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          if (result.type === HttpEventType.Response) {
              // this.getGeobaseInfo();
              if (result.status === 200 || result.status === 201) {
                console.log('Layer saved', result);
                this.geotowerService.clientObjList.forEach((obj, index) => {
                  if (obj.name === layerInfo.name) {
                    this.geotowerService.clientObjList.splice(index, 1);
                  }
                });
                this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
                  if (layerInfo.name === currentLayer.values_.name) {
                    console.log('removing the vector layer from map');
                    this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
                  }
                });
                /* this.activateGeotower();
                setTimeout(() => {
                  this.activateGeotower();
                }, 500); */
                
                this.tryToLoadTower();
              } else {
                console.log('Save map status');
                console.log(result, result.type);
              }
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while saving layer');
          console.log(error);
        });
  }

  private _getLayerListFromPostgis(paramWorkspaceName): any {
    console.log('calling the geoserver.....');
    this.layersService.getWorkspaceWithLayer_GEOServer(paramWorkspaceName)
      .subscribe((response: any) => {
        console.log('Total number of layer records are from server:  ', response.rowCount);
        if (response.rowCount > 0) {
          response.rows.forEach(layerObj => {
            this.postgisLayersList.push(layerObj.name);
          });
        }
      });
  }

  private _createClientLayerJsonObj(clientLayerObj): any {
    return {
      name: clientLayerObj.fileName,
      isServer: false,
      maximized: false,
      previewLayer: true,
      files: clientLayerObj.inputFiles,
      fileType: clientLayerObj.filetype,
      zipfile: clientLayerObj.zipfile,
      metadata: clientLayerObj.metadata,
      firebaseUrl: clientLayerObj.firebaseUrl,
      proj: clientLayerObj.proj,
      timestamp: new Date(),
      orderNumber: this.layersList.length + 1
    };
  }

  private _setClientLayerToTower(): any {
    this.basemapService.onLayerAddedToTower.subscribe((clientLayerObj) => {
      this.basemapService.setLoadScaleLine();
      console.log('emit ', clientLayerObj);
      const clientLayer = this._createClientLayerJsonObj(clientLayerObj);
      const options = { layerObj: clientLayer, geotower: this };
      if (!this.isGeotowerActive) {
        this.activateGeotower();
        // setTimeout(() => {
        console.log('before duplication fun what is list here after auto activeTower ', this.isDuplicateLayerNameFound(clientLayer.name));
        if (!this.isDuplicateLayerNameFound(clientLayer.name)) {
            // this.geotowerService.clientObjList.push(clientLayer);
            // this.geotowerService.geotowerLayersList.push(clientLayer);
            this.geotowerService.activateEvent(options, 'LayerSetToMap');
            setTimeout(() => {
              this.heightEventTrigger();
            }, 1500);
        }
        // }, 1000);
      } else {
        console.log('before duplication fun what is list here after opened Tower ',
              this.geotowerService.clientObjList, this.geotowerService.geotowerLayersList);
        if (!this.isDuplicateLayerNameFound(clientLayer.name)) {
          // this.geotowerService.clientObjList.push(clientLayer);
          // this.geotowerService.geotowerLayersList.push(clientLayer);
          this.geotowerService.activateEvent(options, 'LayerSetToMap');
          setTimeout(() => {
            this.heightEventTrigger();
          }, 1500);

          // TRIGGERING REFRESH DATA WHEN TOWER OPENED
          this.refreshTowerData = String(new Date().getTime());
        }
      }

      this.tryToLoadTower();
      this.refreshTowerScroll = String(new Date().getTime());
      const layerDataForSave = {
        layerObj: clientLayer,
      };
      // if (!this.isGuest && this.currentSession.status === 'completed') {
      //   console.log('SAVING LAYER...');
      // here need some work on guest & share session
     /*  if (!this.isGuest) {
        this.saveTowerLayerFun(layerDataForSave);
      } */
      // }
    });
  }

  isDuplicateLayerNameFound(layerName): any {
    let isduplicateFound = false;
    this.geotowerService.geotowerLayersList.forEach((layer) => {
      if (layerName === layer.name) {
        console.log('Duplicate layer object found in DataBase');
        // alert('Please select another layer, Duplicate layer found!!.');
        this.authObsr.updateErrors('Please select another layer, Duplicate layer found!!.');
        this.authObsr.updateDuplicateErrors('Duplicate found');
        isduplicateFound = true;
      }
    });
    return isduplicateFound;
  }

  activateGeotower(): any {
    this.isGeotowerActive = !this.isGeotowerActive;
    this.refreshTowerData = '';
    if (this.isGeotowerActive) {
      this.geotowerDocker = 'tower-btn active';
      this.analytics.sendPageViewData('geotower', 'GeoTower');
      this.tryToLoadTower();
    } else {
      this.geotowerDocker = 'tower-btn';
    }
    setTimeout(() => {
      this.heightEventTrigger();
    }, 1500);
  }

  towerEleEmit(event): any {
    console.log(event);
    this.towerEle.nativeElement.scrollTop = event.emitData;
  }

  groupButtonChangeTrigger(): any {
    this.towerOrderEleEmit.emit(this.towerEle);
    this.heightEventTrigger();
  }

  heightEventTrigger(): any {
    const layerListCount = 0;
    if (this.towerOrderEle) {
      const towerHeight = this.towerEle.nativeElement.offsetHeight; // this.towerOrderEle.nativeElement.offsetHeight + 35;
      console.log(towerHeight);
      const requiredHeight = (this.layerOptionsHeight * 5) + 25;
      console.log('REQUIRED HEIGHT TO TRIGGER SCROLL : ', requiredHeight);
      if (towerHeight >= 220) {
        this.scrollerIsActive = true;
      } else {
        if (layerListCount > 3) {
          this.scrollerIsActive = true;
        } else {
          this.scrollerIsActive = false;
        }
      }
    }
  }
  getHeight(): any {
    try {
      // return (this.geotowerService.clientObjList.length * this.layerOptionsHeight) + 'px';
      return (this.currentLayersCount * this.layerOptionsHeight) + 'px';
    } catch (e) {
      console.log(e);
      return '0px';
    }
  }
  layerItemOptActive(e): any {
    console.log(e);
    this.layerOptionsSelected = e;
  }

  layersCount(event): any{
    this.currentLayersCount = event;
  }
  refreshTowerScrollFun(): void{
    setTimeout(() => {
      this.heightEventTrigger();
      setTimeout(() => {
        this.refreshTowerScroll = String(new Date().getTime());
      }, 500);
    }, 1500);
  }

  selectMapOption(): any {
    console.log('select the map option dropdown', this.isBaseMapOptActive);
    this.isBaseMapOptActive = !this.isBaseMapOptActive;
  }

  filterMapTypes(mapTypeObj): any {
    const mapType = mapTypeObj.value;
    console.log('what is map type: ', mapType, this.isBaseMapOptActive);
    // this.mapTypeName = mapType;
    this.selecteMapType = mapTypeObj;
    this.authObsr.updateBaseLayerName(this.selecteMapType.name);
    this.isBaseMapOptActive = !this.isBaseMapOptActive;
    // #TODO - later this code need to be simply & easly...
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('layer name ', mapType, layer.values_.name, layer.getVisible());
      if (mapType === 'openstreet') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'openstreet') {
          layer.setVisible(true);
        }
      }
      if (mapType === 'satellite') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'satellite') {
          layer.setVisible(true);
        }
      }
      if (mapType === 'terrain') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'terrain') {
          layer.setVisible(true);
        }
      }

      if (mapType === 'toner') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'terrain' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'toner') {
          layer.setVisible(true);
        }
      }

      if (mapType === 'bingsatellite') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'terrain' || layer.values_.name === 'toner'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'bingsatellite') {
          layer.setVisible(true);
        }
      }
      // New code for street view of bing
      if (mapType === 'bingstreet') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'googlestreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'bingstreet') {
          layer.setVisible(true);
        }
      }

      // New code for street view of bing
      if (mapType === 'googlestreet') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'googlestreet') {
          layer.setVisible(true);
        }
      }

      // New code for satellite view of google
      if (mapType === 'googlesatellite') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlestreet') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'googlesatellite') {
          layer.setVisible(true);
        }
      }
    });
  }

  // getGeobaseInfo(): any {
  //   if (!this.isGuest) {
  //     // here default geobase getting.. how to find is default or selected geobase session??
  //     console.log('checking the default session or not condition', this.sessionId);
  //     let geobaseId = 0;
  //     let isDefault = true;
  //     if (this.sessionId > 0) {
  //       geobaseId = this.sessionId;
  //       isDefault = false;
  //     }
  //     console.log('is default session or opened new session?? ', this.sessionId, geobaseId, isDefault);
  //     this.geobaseService.getGeobase(geobaseId, isDefault)
  //     .subscribe(geobaseInfo => {
  //       console.log('Got default geobaseInfo info in geotower');
  //       console.log(geobaseInfo);
  //       if (!this.commonService.isValid(geobaseInfo)) {
  //         console.log('No geobaseInfo present');
  //         // no default geobase for this user..
  //         this.towerId = 0;
  //       } else {
  //         console.log('geobaseInfo present', geobaseInfo, geobaseInfo.sessionId, geobaseInfo.towerId);
  //         this.geobaseInfo = geobaseInfo;
  //         // this._getTowerLayerList(geobaseInfo.towerId);
  //         // sending the towerId to geotower-item for checking the tower & layers list
  //         this.towerId = geobaseInfo.towerId;
  //       }
  //     }, error => {
  //       console.log('Error while getting geobaseInfo');
  //       console.log(error);
  //       if (error.errorCode === 500) {
  //       }
  //       // this._getTowerLayerList('');
  //       this.towerId = 0;
  //     });
  //   }
  // }

  closePreview(): void{
    this.showSelectedImgPreview = false;
    this.geoRefOrPreviewClosed = String(new Date().getTime());
  }

  showPreviewFun(layer): void{
   
    console.log(layer,"layerdetails");
    console.log( this.geoRefEnabled,"enalble");
    
    this.selectedLayerToPreview = layer.layer.layer;
    if ((this.selectedLayerToPreview.fileType === '.jpg' || this.selectedLayerToPreview.type === 'jpg') &&
        this.geoRefEnabled){
      console.log('GEOREF ENABLED. SHOWING GEOREF WINDOW.');
      this.showGeoReferencingScreen = true;
      this.markedGeoRefPoints = 0;
    } else {
      console.log('GEOREF DISABLED. SHOWING PREVIEW.');
      this.showSelectedImgPreview = true;
     
    }
  }

  closeGeoRefPanel(askConfirm = false): any {
    if (askConfirm && this.markedGeoRefPoints > 0){
      this.showGeorefConfirmClose = true;
    } else {
      this.closeGeoRefPanelFun();
    }
  }

  closeGeoRefPanelFun(): void{
    this.showGeoReferencingScreen = false;
    this.minimizedGeoRefWindow = false;
    this.selectedLayerToPreview = {};
    this.showGeorefConfirmClose = false;
    this.geoRefOrPreviewClosed = String(new Date().getTime());
  }
  minimizeGeoRefPanel(): any {
    console.log('IN minimizeGeoRefPanel');
    this.renderer.listen(this.geoRefWindow.nativeElement, 'animationend', (e) => {
      // console.log('ANIMATION ENDED');
      // console.log(e);
      this.minimizedGeoRefWindow = true;
      const clsList1 = this.geoRefWindow.nativeElement.classList;
      if (clsList1.contains('geoReferenceWinSlideLeft')){
        clsList1.remove('geoReferenceWinSlideLeft');
      }
    }).bind(this);
    const clsList = this.geoRefWindow.nativeElement.classList;
    if (!clsList.contains('geoReferenceWinSlideLeft')){
      console.log('not contains slideLeft');
      clsList.add('geoReferenceWinSlideLeft');
    } else {
      console.log('Already contains geoReferenceWinSlideLeft');
    }
  }
  maximizeGeoRefPanel(): any {
    console.log('IN maximizeGeoRefPanel');
    this.minimizedGeoRefWindow = false;

    this.renderer.listen(this.geoRefWindow.nativeElement, 'animationend', (e) => {
      // console.log('ANIMATION ENDED');
      // console.log(e);
      this.minimizedGeoRefWindow = false;
      const clsList1 = this.geoRefWindow.nativeElement.classList;
      if (clsList1.contains('geoReferenceWinSlideRight')){
        clsList1.remove('geoReferenceWinSlideRight');
      }
    }).bind(this);
    const clsList = this.geoRefWindow.nativeElement.classList;
    if (!clsList.contains('geoReferenceWinSlideRight')){
      console.log('not contains slideRight');
      clsList.add('geoReferenceWinSlideRight');
    } else {
      console.log('Already contains geoReferenceWinSlideRight');
    }
  }


  saveGeorefInfo(georefData): any {
    console.log('In saveGeorefInfo');
    console.log(georefData);
    this.closeGeoRefPanel();
    // this.basemapService.saveGeorefLayer.subscribe((georefData) => {
    //   console.log('emit calling for saving georef data from georef component to geotower ', georefData);
    // });
    const layerData = {
      layerObj : georefData
    };
    if (layerData.layerObj.layerId > 0) {
      const layerInfo = this.creatingRequestLayerInfo(layerData);
      console.log('geobase information ', this.geobaseInfo, this.towerId);
      if (this.geobaseInfo !== null && this.towerId > 0) {
        console.log('some session available and save layer to that session & tower');
        this.getTowerInfoAndUpdateLayer(this.towerId, layerInfo);
      }
    } else {
      this.saveTowerLayerFun(layerData);
    }

    if (!this.isGeotowerActive){
      this.isGeotowerActive = true;
    }
    if (this.isGeotowerActive) {
      this.geotowerDocker = 'tower-btn active';
      this.analytics.sendPageViewData('geotower', 'GeoTower');
    } else {
      this.geotowerDocker = 'tower-btn';
    }
    this.geoRefLayerDataToShow = layerData;
    // this.authObsr.updateGeorefToggleStatus(false);
  }
  closeTooltip(): void{
    if (!this.isGuest){
      setTimeout(() => {
        this.showTooltip = false;
      }, environment.feUserGuideTooltipAutoCloseDuration);
    }
  }

  _getTowerLayerList(towerId): any {
    console.log('In ._getTowerLayerList');
    const tempList = [];
    if (!this.isGuest) {
      this.geotowerService.clientObjList.forEach((clientObj) => {
        // this.layersList.push(clientObj);
        clientObj.height = `${this.layerOptionsHeight}px`; // '40px';
        tempList.push(clientObj);
      });
    }
    this.layersList = tempList;
    this.sortLayersListBasedOnOrderNumber();
    // Here will getAllLayers call API
    console.log('Here calling tower-item-option layers list ', this.isGuest, towerId, this.globalObject);
    if (!this.isGuest || this.globalObject.pageType === 'share') {
      console.log('In getUserWorkSpace');
      const email = sessionStorage.getItem('email');
      if (this.globalObject.pageType === 'share') {
        towerId = this.globalObject.geobase.towerId;
      }
      if (this.commonService.isValid(towerId)) {
        this.layersService.getTowerIncludeLayers(towerId, this.isGuest)
          .subscribe(workspaceRes => {
            console.log('Got workspace info');
            console.log(workspaceRes);
            if (!this.commonService.isValid(workspaceRes)) {
              console.log('No workspace present');
            } else {
              console.log('Workspace present');
              let layerList = workspaceRes[0].listOfLayers;
              if (layerList.length > 0) {
                layerList.forEach(layerObj => {
                  layerObj.active = false;
                  layerObj.selected = false;
                  layerObj.previewLayer = false;
                  layerObj.isServer = true;
                  layerObj.maximized = false;
                  const index: number = this.geotowerService.prevActiveServerLayersList.
                    findIndex(layerName => layerName === layerObj.name);

                  if (index !== -1) {
                    console.log('prev active layer ', layerObj.name, this.geotowerService.prevActiveServerLayersList);
                    layerObj.previewLayer = true;
                  }
                  layerObj.firebaseUrl = layerObj.url;
                  layerObj.height = `${this.layerOptionsHeight}px`; // '40px';
                  // this.layersList.push(layerObj);
                });
                layerList = this.commonService.sortByDesc(layerList);

                layerList.forEach(layerObj => {
                  this.layersList.push(layerObj);
                });

                this.sortLayersListBasedOnOrderNumber();
                console.log(this.layersList);

                // if (this.isGeotowerActive){
                if (this.commonService.isValid(this.geoRefLayerDataToShow)){
                  if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj)){
                    if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj.name)){
                      const layerIndex = this.layersList.findIndex(layer => layer.name === this.geoRefLayerDataToShow.layerObj.name);
                      console.log(layerIndex);
                      console.log(this.layersList[layerIndex]);
                      if (layerIndex !== -1){
                        // this.showLayer(this.layersList[layerIndex], true);
                        this.geoRefLayerDataToShow = {};
                      }
                    }
                  }
                }
              }
              // this.layersCount.emit(this.layersList.length);
            }
            // this.towerReloaded.emit(String(new Date().getTime()));
          }, error => {
            console.log('Error while getting workspace');
            console.log(error);
            if (error.errorCode === 500) {
            }
            // this.towerReloaded.emit(String(new Date().getTime()));
          });
      } else {
        // this.towerReloaded.emit(String(new Date().getTime()));
      }
      this.geotowerService.geotowerLayersList = this.layersList;
    } else {
      // this.towerReloaded.emit(String(new Date().getTime()));
    }
    // this.layersCount.emit(this.layersList.length);
  }

  drop(event: CdkDragDrop<string[]>) {
    
    moveItemInArray(this.layersList, event.previousIndex, event.currentIndex);
    console.log(this.layersList);
    this.updateLayerOrderForRenderingOnMap();
    console.log(TowerItemComponent.isdrag,"i am in geotower")
  }

  updateLayerOrderForRenderingOnMap(){
    console.log(this.layersList);
    for (let i = this.layersList.length; i > 0; i--){
        console.log(i);
        console.log(this.layersList[i-1]);
        this.layersList[i-1].orderNumber = (this.layersList.length - i) + 1;  
        console.log((this.layersList.length - i) + 1);
        console.log(this.layersList[i-1]);
    }
    console.log(this.layersList);
    // Here Logic For Rendering the Layers based on order Number
    this.basemapService.getCurrentBasemap().getLayers().forEach(layerObj => {
      this.layersList.filter(layer => {
        if (layer.name === layerObj.values_.name) {
          console.log(layer.name, layerObj.values_.name, layer.orderNumber);
          layerObj.setZIndex(layer.orderNumber);
        }
      });
    });
    this.sortLayersListBasedOnOrderNumber();
    this.updateLayerOrderToDb();
  }
 
  updateLayerOrderToDb(): any{
    console.log(this.layersList);
    const layerOrderList = [];
    let count = 0;
    for (let i = this.layersList.length - 1; i >= 0; i--){
      if (this.layersList[i].isServer){
        // if (this.layersList[i].orderNumber == null || this.layersList[i].orderNumber !== (this.layersList.length - i - count)){
          console.log("In Save Layer Order");
          const layerOrderInfo = {
            towerLayerRelationId: '',
            towerId: this.towerId,
            layerId: this.layersList[i].layerId,
            orderNumber: this.layersList.length - i - count
          };
          layerOrderList.push(layerOrderInfo);
        // }
      }
      else{
        count++;
      }
    }
    console.log(this.layersList);
    console.log(layerOrderList);
    console.log(layerOrderList.toString());
    console.log(JSON.stringify(layerOrderList));
    this.updateLayerOrderToExistingTower(layerOrderList, this.towerId);
  }

  updateLayerOrderToExistingTower(layerOrderInfo, towerId): any {
    this.layersService.updateLayerOrder(layerOrderInfo, towerId)
        .subscribe((result: HttpEvent<any>) => {
          if (result.type === HttpEventType.UploadProgress) {
            // console.log(`Loaded : ${result.loaded}`);
            // console.log(`TOTAL : ${result.total}`);
            const layerSaveProgress = (100 * result.loaded / result.total).toFixed(2);
          }
          if (result.type === HttpEventType.Response) {
              // Here got some response frm saving the layer.. so need to enable the delete button
              this.isDeleteDisable = false;
              if (result.status === 200 || result.status === 201) {
                console.log('Layer order updated', result);
                // this.tryToLoadTower();
              } else {
                console.log('Save map status');
                console.log(result, result.type);
              }
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          this.isDeleteDisable = false;
          console.log('Error while saving layer');
          console.log(error);
        });
  }

  checkIsLayerMaximized(event): void{
    console.log('In checkIsLayerMaximized($event)');
    console.log(event);
    const layer = event.layer;
    const isMaximized = event.maximized;
    if(!isMaximized){
      this.layersList.forEach(layer => {
        if(layer.maximized){
          this.geotowerMaximized = true;
        }
        else{
          this.geotowerMaximized = false;
        }
      });
    }
    else{
      this.geotowerMaximized = isMaximized;
    }
    const layerIndex = event.index;
    // this.layersList.forEach(element => {

    // });
    if (layerIndex + 1 < this.layersList.length){
      console.log('NEXT LAYER FOUND');
      console.log('TO SET CURRENT LAYER HEIGHT BASED ON NEXT LAYER');
      if (!this.layersList[layerIndex + 1].maximized){
        console.log('NEXT LAYER NOT MAXIMIZED');
        this.layersList[layerIndex].height = `${this.layerOptionsHeight * 2}px`; // '80px';
      } else {
        console.log('NEXT LAYER MAXIMIZED');
        this.layersList[layerIndex].height = `${this.layerOptionsHeight}px`; // '40px';
      }
    } else {
      console.log('NEXT LAYER NOT FOUND');
    }

    if (layerIndex - 1 >= 0){
      console.log('PREVIOUS LAYER FOUND');
      if (!this.layersList[layerIndex - 1].maximized){
        console.log('PREVIOUS LAYER NOT MAXIMIZED');
        // this.layersList[layerIndex - 1].height = '40px';
      } else {
        console.log('PREVIOUS LAYER MAXIMIZED');
        if (isMaximized){
          this.layersList[layerIndex - 1].height = `${this.layerOptionsHeight}px`; // '40px';
        } else {
          this.layersList[layerIndex - 1].height = `${this.layerOptionsHeight * 2}px`; // '80px';
        }
      }
    } else{
      console.log('PREVIOUS LAYER NOT FOUND');
    }
  }

  mouseLeave(): void{
    setTimeout(() => {
      this.layersList.forEach(layer => {
        layer.maximized = false;
      });
      this.geotowerMaximized = false;
    }, 8000);
  }

  sortLayersListBasedOnOrderNumber() : any{
    this.layersList.sort((a, b) => 0 - (a.orderNumber > b.orderNumber ? 1 : -1));
  }
  barclicked(event){
    this.dragfeature=event;
    const element = document.getElementById('dragenable');
    console.log(this.dragfeature,"geotower3");
   
    

  }

  ClickingGeoTower(index){
    console.log(index,"GeotowerIndex")
  }
}
