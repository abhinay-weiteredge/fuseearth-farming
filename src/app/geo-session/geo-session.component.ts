import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChange, ViewChild } from '@angular/core';
import { GeotowerService } from '../geotower/geotower.service';
import { CommonService } from '../Services/common.service';
import { LayersService } from '../Services/layers.service';
import { GeobaseService } from '../Services/geobase.service';
import { TopicsService } from '../Services/topics.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { GeoNotePadService } from '../Services/geo-notepad.service';
import { BasemapService } from '../basemap/basemap.service';
import * as uuid from 'uuid';
import { Router } from '@angular/router';

@Component({
  selector: 'app-geo-session',
  templateUrl: './geo-session.component.html',
  styleUrls: ['./geo-session.component.scss']
})
export class GeoSessionComponent implements OnInit, OnChanges {

  @Input() userInfo: any = {};
  @Input() globalObject;
  @Input() showGeoSession = false;
  @Input() sessionId;
  @Input() sessionUuid;
  @Input() currentSession;
  @Input() showExpandedView = '';
  @Output() closeGeoSession: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('geoSessionWindow') geoSessionWindow: ElementRef<HTMLDivElement>;
  @ViewChild('sessionName') sessionName: ElementRef<HTMLInputElement>;
  // @ViewChild('emailIdsToShare') emailIdsToShare: ElementRef<HTMLInputElement>;
  @ViewChild('saveTypeSelectCtrl') saveTypeSelectCtrl: ElementRef<HTMLSelectElement>;
  @ViewChild('urlLink') urlLink: ElementRef<HTMLInputElement>;
  minimizedWindow: boolean;
  ownerEmail: string;
  ownerName: string;
  boundingBoxTypes: any[] = [
    { name: 'Default (Current Extent)', value: 'default' },
    /* { name: 'Global', value: 'global' },
    { name: 'Geotower', value: 'geotower' },
    { name: 'Geopad', value: 'geopad' },
    { name: 'All', value: 'all' }, */
  ];
  boundingBoxItems: any = {
    default: [{name: 'Geopad', value: 'geopad'}, {name: 'Geotower', value: 'geotower'}],
    global: [{name: 'Geopad', value: 'geopad'}, {name: 'Geotower', value: 'geotower'}],
    geotower: [{name: 'Geotower', value: 'geotower'}],
    geopad: [{name: 'Geopad', value: 'geopad'}],
    all: [{name: 'Geopad', value: 'geopad'}, {name: 'Geotower', value: 'geotower'}]
  };

  currentBoundingBoxItems: any[] = this.boundingBoxItems.default;
  @ViewChild('boundingBoxSelectCtrl') boundingBoxSelectCtrl: ElementRef<HTMLSelectElement>;

  geoTowerList: any[] = [];
  geoPadItemsList: any[] = [];
  errorMsg = '';
  copyToClipboard = '';
  defaultGeobaseInfo: any = {};
  towerWithLayersList = [];
  multipartFiles: any[] = [];
  projects: any[] = [];
  projectSelect: FormControl = new FormControl('');
  places: any[] = [];
  placeSelect: FormControl = new FormControl('');
  topics: any[] = [];
  topicSelect: FormControl = new FormControl('');
  projectId = 0;
  placeId = 0;
  topicId = 0;
  sessionDataCollected: boolean;
  towerItemsDataCollected = false;
  sessioSaveProgress: string;
  sessionSaveStates = {
    UNKNOWN: 'unknown',
    STARTED: 'started',
    COMPLETED: 'completed',
    FAILED: 'failed'
  };
  sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
  selectedProject: any = {};
  selectedPlace: any = {};
  selectedTopic: any = {};
  link;
  sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
  userEmail: FormControl = new FormControl('', [Validators.email]);
  allUserOrOrgEmails: Array<string> = [];
  orgUserEmailsToShow: Array<string> = [];
  mouseDownTimeStamp: number;
  constructor(
    private renderer: Renderer2, private commonService: CommonService, private router: Router,
    private geotowerService: GeotowerService, private layersService: LayersService,
    private geobaseService: GeobaseService, private topicsService: TopicsService,
    private notePadService: GeoNotePadService, private basemapService: BasemapService) {
      const url = this.router.url;
      console.log(url);
      if (url.includes('session')){
        console.log('SESSION PAGE');
      } else if (url.includes('share')){
        console.log('SHARE PAGE');
      } else{
        console.log('DEFAULT PAGE');
      }
    }

  ngOnInit(): void {
    console.log('what is globalObject in geo-session component ', this.globalObject);
    this.projectSelect.valueChanges.subscribe(res => {
      console.log('PROJECT CHANGED');
      console.log(res);
      if (this.commonService.isValid(res)) {
        this.getPlacesListByProjectId(res);
        // this.getGeoPadItems(this.globalObject.geobase.geopadId);
      }
    });
    this.placeSelect.valueChanges.subscribe(res => {
      console.log('PLACE CHANGED');
      console.log(res);
      if (this.commonService.isValid(res)) {
        this.getTopicsListByPlaceId(res);
      }
    });
  }

  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    console.log('IN GEOSESSION CHANGES');
    console.log(changes);
    if (this.commonService.isValid(changes.showGeoSession)) {
      if (this.commonService.isValid(changes.showGeoSession.currentValue) && changes.showGeoSession.currentValue) {
        console.log('IN SHOW GEO SESSION');
        // if (this.userInfo.type === 'ORG') {
        this.getUserEmailsListByOrg();
        // }
        this.ownerName = localStorage.getItem('name');
        this.ownerEmail = localStorage.getItem('email');
        this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
        // this.getDefaultGeobase(true);
        // this.boundingBoxSelectCtrl.nativeElement.value = 'default';
        console.log('what is globalObject in geo-session component ngOnChange ', this.globalObject);
        if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
            this.sessionDataCollected = true;
            this.defaultGeobaseInfo = this.globalObject.geobase;
            this.towerItemsDataCollected = true;
            console.log('what is sessionName element here ', this.sessionName);
            setTimeout(() => {
              this.getProjectsList();
              console.log('what is sessionName element here after 500ms ', this.sessionName);
              this.sessionName.nativeElement.value = this.globalObject.geobase.name;
              this.getGeoTowerItems(this.globalObject.geobase.towerId);
              this.getTopicsListBySessionId(this.globalObject.geobase.sessionId);
              this.getGeoPadItems(this.globalObject.geobase.geopadId);
              /* this.link = uuid.v4();
              this.urlLink.nativeElement.value = 'http://18.144.21.216:4200/share/'
              + this.defaultGeobaseInfo.sessionId + '/' + this.link; */
            }, 500);
        }
      } else {
        this.minimizedWindow = false;
      }
    }
    if (this.commonService.isValid(changes.showExpandedView)) {
      if (this.commonService.isValid(changes.showExpandedView.currentValue)) {
        this.maximizeNotePage();
      }
    }

  }

  getDefaultGeobase(firstLoad = false): void {
    console.log('checking the default session or not condition');
    let sessionId = 0;
    let isDefault = true;
    if (this.sessionId > 0) {
      sessionId = this.sessionId;
      isDefault = false;
    }
    console.log('is default session or opened new session?? ', this.sessionId, sessionId, isDefault);
    this.sessionDataCollected = false;
    this.geobaseService.getGeobase(sessionId, isDefault)
          .subscribe(geobaseInfo => {
            console.log('Got geobaseInfo info');
            console.log(geobaseInfo);
            if (!this.commonService.isValid(geobaseInfo)) {
              console.log('No geobaseInfo present');
              this.towerWithLayersList[0] = {};
              this.towerWithLayersList[0].listOfLayers = [];
              this.towerItemsDataCollected = true;
              if (firstLoad){
                this.getProjectsList();
              }
            } else {
              console.log('geobaseInfo present', geobaseInfo, geobaseInfo.sessionId, geobaseInfo.towerId);
              this.defaultGeobaseInfo = geobaseInfo;
              this.sessionName.nativeElement.value = geobaseInfo.name;
              this.getGeoTowerItems(geobaseInfo.towerId);
              if (firstLoad) {
                this.getTopicsListBySessionId(geobaseInfo.sessionId);
              }
              this.getGeoPadItems(geobaseInfo.geopadId);
            }
            this.sessionDataCollected = true;
            /* this.link = uuid.v4();
            this.urlLink.nativeElement.value = 'http://18.144.21.216:4200/share/'
            + this.defaultGeobaseInfo.sessionId + '/' + this.link; */
          }, error => {
            console.log('Error while getting workspace');
            console.log(error);
            if (error.errorCode === 500) {
            }
            this.sessionDataCollected = true;
          });
  }

  getTopicsListBySessionId(sessionId): any {
    let topicList: any = [];
    this.topicsService.getTopicsListBySessionId(sessionId)
      .subscribe(respTopicList => {
        console.log('got the topics list which are selected ', respTopicList);
        if (!this.commonService.isValid(respTopicList)) {
          console.log('No topicList present');
        } else {
          console.log(' topicList present');
          topicList = respTopicList;
          topicList.forEach(topic => {
            if (topic.parentTopicId === 0) {
              this.topicId = topic.topicId;
            }
          });
          topicList.sort((a, b) => {
            const customFieldA = a.topicId;
            const customFieldB = b.topicId;
            return (customFieldA < customFieldB) ? -1 : (customFieldA > customFieldB) ? 1 : 0;
          });
          if (topicList.length > 0) {
            this.selectedProject = topicList[0];
          }
          if (topicList.length > 1) {
            this.selectedPlace = topicList[1];
          }
          if (topicList.length > 2) {
            this.selectedTopic = topicList[2];
          }
        }
        this.getProjectsList();
      }, error => {
        console.log('Error while fetching the topics by sessionId', error);
        this.getProjectsList();
      });
  }
  getLatestData(item, event): any {
    console.log(item);
    console.log(event);
    console.log(event.target.checked);
    if (item.value === 'geotower' && event.target.checked) {
      this.getGeoTowerItems(this.defaultGeobaseInfo.towerId);
    }
    if (item.value === 'geopad' && event.target.checked) {
      // GET GEOPAD DETAILS..
      this.getGeoPadItems(this.defaultGeobaseInfo.geopadId);
    }
  }
  creatingRequestLayerInfo(layerData): any {
    let fileTypeName = layerData.layerObj.fileType;
    fileTypeName = fileTypeName.substring(fileTypeName.indexOf('.') + 1);
    console.log('what is fileTypeName ', fileTypeName);
    const layerObj = {
      layerId: 0,
      name: layerData.layerObj.name,
      organizationId: 1,
      type: fileTypeName,
      metadata: '',
      towerId: '',
      status: 'Active',
      owner: 0,
      url: '',
      workspaceName: '',
      datastoreName: '',
      details: '',
    };
    if (layerData.layerObj.fileType === '.zip') {
      if (layerData.layerObj.zipfile instanceof File) {
        // here zip file request json creation
        // Here adding the medatadata i.e. extent of this shap file
        layerObj.details = layerData.layerObj.zipfile.name;
        this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
          if (layerData.layerObj.name === currentLayer.values_.name) {
            const extentValue = currentLayer.values_.source.getExtent();
            console.log('adding extent value for zip shap files ', extentValue);
            layerObj.metadata = JSON.stringify(extentValue);
          }
        });
        return layerObj;
      } else {
        // its unzipped file(single shp,dbf,prj files uploaded)
        this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
          if (layerData.layerObj.name === currentLayer.values_.name) {
            const extentValue = currentLayer.values_.source.getExtent();
            console.log('adding extent value for zip shap files ', extentValue);
            layerObj.metadata = JSON.stringify(extentValue);
          }
        });
        return layerObj;
      }
    } else {
      // here jpeg, kml..files json creation
      layerObj.metadata = JSON.stringify(layerData.layerObj.metadata);
      layerObj.url = layerData.layerObj.firebaseUrl;
      return layerObj;
    }
  }
  getGeoTowerItems(towerId): any {
      this.towerItemsDataCollected = false;
      console.log('In getGeoTowerItems');
      this.geoTowerList = [];
      this.multipartFiles = [];
      this.geotowerService.clientObjList.forEach((clientObj, indexValue) => {
        console.log(clientObj);
        clientObj.selected = false;
        const index = this.geoTowerList.findIndex(val => val.name === clientObj.name && val.timestamp === clientObj.timestamp);
        console.log('what is index here ', index);
        if (index === -1) {
          /* const clientLayerObj = {
          file: '',
          layerId : null,
          organizationId : 1,
          fileType : clientObj.fileType,
          metadataInfo : '',
          name : clientObj.name,
          fileOrderId: indexValue
        }; */
          const clientLayerObj = {
            layerObj: clientObj,
          };
          const layerInfo = this.creatingRequestLayerInfo(clientLayerObj);
          if (this.commonService.isValid(clientObj.zipfile)) {
            clientObj.zipfile.fileOrderId = indexValue;
            clientObj.zipfile.fileName = layerInfo.name;
          } else {
            clientObj.zipfile =  new File([new Blob()], layerInfo.name, {lastModified: new Date().getTime()});
          }
          this.geoTowerList.push(layerInfo);
          this.multipartFiles.push(clientObj.zipfile);
        }
      });
      console.log(this);
      console.log(this.geoTowerList);
      // Here will getAllLayers call API
      console.log('In getUserWorkSpace');
      if (this.commonService.isValid(towerId)) {
        this.layersService.getTowerIncludeLayers(towerId, true)
          .subscribe(towerIncludeLayersRes => {
            console.log('Got towerIncludeLayersRes info', towerIncludeLayersRes);
            if (!this.commonService.isValid(towerIncludeLayersRes)) {
              console.log('No workspace present');
            } else {
              console.log('Workspace present');
              const layerList = towerIncludeLayersRes[0].listOfLayers;
              this.towerWithLayersList = towerIncludeLayersRes;
              if (layerList.length > 0) {
                layerList.forEach(layerObj => {
                  layerObj.active = false;
                  layerObj.selected = false;
                  layerObj.previewLayer = false;
                  layerObj.isServer = true;
                  layerObj.selected = false;
                  const index = this.geoTowerList.findIndex(val => val.name === layerObj.name && val.timestamp === layerObj.timestamp);
                  if (index === -1) {
                    this.geoTowerList.push(layerObj);
                  }
                });
              }
            }
            this.towerWithLayersList[0].listOfLayers = this.geoTowerList;
            this.towerItemsDataCollected = true;
            console.log(this.towerWithLayersList);
            console.log(this);
          }, error => {
            console.log('Error while getting workspace');
            console.log(error);
            if (error.errorCode === 500) {
            }
            this.towerWithLayersList[0].listOfLayers = this.geoTowerList;
            this.towerItemsDataCollected = true;
          });
      } else{
        this.towerWithLayersList[0].listOfLayers = this.geoTowerList;
        this.towerItemsDataCollected = true;
      }

  }
  getGeoPadItems(geopadId): any {
    this.geoPadItemsList = [];
    console.log('getting the geopad items', geopadId, this.projectSelect, this.projectId, this.projectSelect.value);
    if (geopadId == null) {
      geopadId = 0;
    }
    // this.notePadService.getSitesList(geopadId)
    this.notePadService.getSitesListWithItemsByProjectId(geopadId, this.projectSelect.value)
      .subscribe(result => {
        console.log('Got saved notes');
        console.log(result);
        const geopadSites = [];
        if (result.length > 0) {
          result.forEach(site => {
            geopadSites.push(site.observationInstance);
          });
          this.geoPadItemsList = geopadSites;
        }
        // this.geoPadItemsList = result;
      },
      error => {
        console.log('Error while getting saved notes');
        console.log(error);
      });
  }

  closeNotePage(): any {
    this.closeGeoSession.emit();
    this.showGeoSession = false;
    this.minimizedWindow = false;
  }
  minimizeNotePage(): any {
    console.log('IN minimizeNotePage');
    this.renderer.listen(this.geoSessionWindow.nativeElement, 'animationend', (e) => {
      // console.log('ANIMATION ENDED');
      // console.log(e);
      this.minimizedWindow = true;
      const clsList1 = this.geoSessionWindow.nativeElement.classList;
      if (clsList1.contains('geoSessionWinSlideRight')){
        clsList1.remove('geoSessionWinSlideRight');
      }
    }).bind(this);
    const clsList = this.geoSessionWindow.nativeElement.classList;
    if (!clsList.contains('geoSessionWinSlideRight')){
      console.log('not contains slideRight');
      clsList.add('geoSessionWinSlideRight');
    } else {
      console.log('Already contains geoSessionWinSlideRight');
    }
  }

  mouseDownOnSession(): void{
    // console.log('In mouseDownOnSession');
    // console.log(new Date().toISOString());
    this.mouseDownTimeStamp = new Date().getTime();
  }
  mouseUpOnSession(): void{
    // console.log('In mouseUpOnSession');
    // console.log(new Date().toISOString());
    if (new Date().getTime() - this.mouseDownTimeStamp < 500) {
      this.maximizeNotePage();
    } else {
      console.log('DRAG EVENT');
    }
  }
  maximizeNotePage(): any {
    // this.getDefaultGeobase();
    this.renderer.listen(this.geoSessionWindow.nativeElement, 'animationend', (e) => {
      this.minimizedWindow = false;
      const clsList1 = this.geoSessionWindow.nativeElement.classList;
      if (clsList1.contains('geoSessionWinSlideLeft')){
        clsList1.remove('geoSessionWinSlideLeft');
      }
    }).bind(this);
    const clsList = this.geoSessionWindow.nativeElement.classList;
    if (!clsList.contains('geoSessionWinSlideLeft')){
      console.log('not contains slideRight');
      clsList.add('geoSessionWinSlideLeft');
    } else {
      console.log('Already contains geoSessionWinSlideLeft');
    }
  }
  boundingBoxChanged(event): any {
    console.log('In boundingBoxChanged');
    console.log(event);
    console.log(event.target.value);
    this.currentBoundingBoxItems = this.boundingBoxItems[event.target.value];
    this.currentBoundingBoxItems.forEach(element => {
      element.selected = false;
    });
  }

  getSessionDataWithId(sessionId): any {
    // CALL API HERE TO GET SESSION COMPLETE INFO
    console.log('IN getSessionDataWithId : ' + sessionId);
    this.ownerName = localStorage.getItem('name');
    this.ownerEmail = localStorage.getItem('email');
    this.showGeoSession = true;
    setTimeout(() => {
      if (this.minimizedWindow) {
        console.log('WINDOW MINIMIZED. SETTING MAX...');
        this.minimizedWindow = false;
      }
      this.sessionName.nativeElement.value = sessionId;
    }, 1000);

  }

  saveTypeChanged(event): any {
    console.log('saveTypeChanged($event)');
    console.log(event);
    console.log(event.target.value);
    if (event.target.value === 'over-write') {
      this.currentBoundingBoxItems.forEach(element => {
        element.selected = false;
      });
    }
  }

  saveSession(): any {
    console.log('In saveSession');
    this.errorMsg = '';
    let errorsFound = false;
    const saveTypeVal = this.saveTypeSelectCtrl.nativeElement.value;
    try{
      if (this.globalObject.pageType === 'share') {
        throw new Error('Shared Session was not allowed to SAVE');
      }
      if (this.sessionName.nativeElement.value === ''){
        throw new Error('Please enter valid session name');
      }
      const index = this.currentBoundingBoxItems.findIndex(val => val.selected);
      if (index === -1 && saveTypeVal === 'create-new'){
        throw new Error('Please choose atleast one item');
      }
      console.log(this.currentBoundingBoxItems);
      let isLayerBoxSelected = false;
      const towerIndex = this.currentBoundingBoxItems.findIndex(val => val.value === 'geotower' && val.selected);
      if (towerIndex !== -1){
        isLayerBoxSelected = true;
      }
      let isGeopadBoxSelected = false;
      const geoPadIndex = this.currentBoundingBoxItems.findIndex(val => val.value === 'geopad' && val.selected);
      if (geoPadIndex !== -1){
        isGeopadBoxSelected = true;
      }
      const layerIndex = this.geoTowerList.findIndex(val => val.selected);
      if (isLayerBoxSelected && (layerIndex === -1 || this.geoTowerList.length === 0) ){
        throw new Error('Please select atleast one layer to save session');
      }
      if (this.projectSelect.value === '' || this.placeSelect.value === '' || this.topicSelect.value === '') {
        console.log('drop down still loading..');
        throw new Error('Please select project/place/topic and save session');
      }

      const geoPadItemIndex = this.geoPadItemsList.findIndex(val => val.selected);
      if (isGeopadBoxSelected && (geoPadItemIndex === -1 || this.geoPadItemsList.length === 0) ){
        throw new Error('Please select atleast one Site to save session');
      }
      // THIS CAN VALIDATED FOR SHARING
      // if (this.emailIdsToShare.nativeElement.value === '') {
      //   console.log('Please enter mail to share session');
      // }
    } catch (e) {
      errorsFound = true;
      console.log(e);
      this.errorMsg = e;
      setTimeout(() => {
        this.errorMsg = "";
      }, 5000);
    }
    if (!errorsFound) {
      if (saveTypeVal === 'create-new') {
        console.log('Save as new session');
        this.saveAsNewSession();
      } else if (saveTypeVal === 'over-write') {
        console.log('Save current session');
        this.saveCurrentSession();
      }
    }
  }
  saveCurrentSession(): any {
    console.log('In saveCurrentSession');
    const selectedLayers = [];
    this.geoTowerList.forEach(layer => {
      // if (layer.layerId === 0) { selectedLayers.push(layer); }
      console.log('what is layer here ', this.towerWithLayersList[0].tower, layer, this.multipartFiles);
      if (layer.layerId === 0) {
        if (layer.type === 'zip') {
          // here saving zip files directly by towerID
          const layerInfo = layer;
          layerInfo.workspaceName = this.towerWithLayersList[0].tower.name;
          layerInfo.datastoreName = 'datastore_' + this.towerWithLayersList[0].tower.name;
          layerInfo.towerId = this.towerWithLayersList[0].tower.towerId;
          this.multipartFiles.forEach(zipFile => {
            if (zipFile.fileName !== undefined) {
              if (zipFile.fileName === layer.name) {
                // layer.type = '.zip';
                // this.saveLayerToExistingTower(zipFile, layerInfo, layerInfo.towerId);
                selectedLayers.push(layer);
              }
            }
          });
        } else {
          selectedLayers.push(layer);
        }
      }
    });
    let newGeopadId = this.defaultGeobaseInfo.geopadId;
    if (this.defaultGeobaseInfo.geopadId == null) {
      newGeopadId = 0;
    }
    console.log(' total selected files ', selectedLayers);
    console.log('Proceed to save/update session');
    const geobaseRequest = {
      geobaseId: this.defaultGeobaseInfo.sessionId,
      sessionId: this.defaultGeobaseInfo.sessionId,
      organizationId: this.defaultGeobaseInfo.organizationId,
      geopadId: newGeopadId,
      towerId: this.towerWithLayersList[0].tower.towerId,
      boundingBox: this.basemapService.getCurrentBasemap().getView().calculateExtent(this.basemapService.getCurrentBasemap().getSize()),
      status: 'Active',
      isDefault: this.defaultGeobaseInfo.isDefault,
      name: this.sessionName.nativeElement.value,
      projectId: this.projectSelect.value, // this.projectId,
      placeId: this.placeSelect.value, // this.placeId,
      topicId: this.topicSelect.value, // this.topicId,
    };
    const towerLayerInfo = {
      towerInfo: this.towerWithLayersList[0].tower,
      layerInfoList: selectedLayers, // this.towerWithLayersList[0].listOfLayers,
    };
    console.log(towerLayerInfo);
    console.log(geobaseRequest);
    // here changes are saving the multiple layers first then save the geobase only
    console.log('saving the multiple layers first ', towerLayerInfo);
    this.sessionSaveCurrentState = this.sessionSaveStates.STARTED;
    this.layersService.saveMultipleLayers(towerLayerInfo, this.multipartFiles)
      .subscribe((results: HttpEvent<any>) => {
        console.log(results);
        console.log(results.type);
        if (results.type === HttpEventType.UploadProgress) {
          console.log(`Loaded : ${results.loaded}`);
          console.log(`TOTAL : ${results.total}`);
          // 100 * event.loaded / event.total
          this.sessioSaveProgress = (100 * results.loaded / results.total).toFixed(2);
        }
        if (results.type === HttpEventType.Response) {
          console.log('GOT SAVED RESPONSE');
          console.log('after saving the multiple layers results ', results);
          if (!this.commonService.isValid(results)) {
            console.log('error in save multiple layers');
          } else {
            console.log('saved successfully.. call the geobase info save/update geobase');
            geobaseRequest.towerId = results.body;
            console.log('sending the request of geobase info with layers ', geobaseRequest);
            this.geobaseService.updateDefaultGeobase(geobaseRequest, this.defaultGeobaseInfo.sessionId)
                .subscribe(reponse => {
                  console.log('saved/updated  geobase response', reponse);
                  if (!this.commonService.isValid(reponse)) {
                    console.log('not valid response in saved/update geobase');
                  } else {
                    console.log('successfully saved/updated geobase');
                    // refresh or close the geobase popup window
                    // this.closeNotePage();
                    selectedLayers.forEach((selectedLayer) => {
                      this.geotowerService.clientObjList.forEach((obj, index) => {
                        if (obj.name === selectedLayer.name) {
                          this.geotowerService.clientObjList.splice(index, 1);
                        }
                      });
                      this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
                        if (currentLayer !== undefined) {
                          if (selectedLayer.name === currentLayer.values_.name) {
                            console.log('removing the vector layer from map');
                            this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
                          }
                        }
                      });
                    });
                    this.geotowerService.deleteEventTowerRefresh();
                  }
                  this.sessionSaveCurrentState = this.sessionSaveStates.COMPLETED;
                  setTimeout(() => {
                    this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
                    this.sessioSaveProgress = '-1';
                  }, 5000);
                }, error => {
                  console.log('Error while saving/updating the geobase');
                  console.log(error);
                  if (error.errorCode === 500) {
                  }
                  this.sessionSaveCurrentState = this.sessionSaveStates.FAILED;
                  setTimeout(() => {
                    this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
                  }, 5000);
                });
            }
        }
      }, error => {
        console.log('Error while saving multiple layers');
        console.log(error);
        if (error.errorCode === 500) {
        }
        this.sessionSaveCurrentState = this.sessionSaveStates.FAILED;
        setTimeout(() => {
          this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
        }, 5000);
      });

  }

  saveAsNewSession(): any {
    // TODO - need to write common code for this
    console.log('In saveAsNewSession');
    let newGeopadId = 0;
    let isGeopadBoxSelected = false;
    const geoPadIndex = this.currentBoundingBoxItems.findIndex(val => val.value === 'geopad' && val.selected);
    if (geoPadIndex !== -1){
      isGeopadBoxSelected = true;
      // newGeopadId = this.defaultGeobaseInfo.geopadId;
    }
    console.log('In saveAsNewSession -- checking the geopad selection ', isGeopadBoxSelected);
    const selectedLayers = [];
    const selectedSites = [];
    this.geoTowerList.forEach(layer => {
      if (layer.selected) { selectedLayers.push(layer); }
    });

    this.geoPadItemsList.forEach(geopad => {
      if (geopad.selected) { selectedSites.push(geopad); }
    });

    console.log('selected geopads list ', this.geoPadItemsList, selectedSites);

    const geopadObservationInstanceInfoJson = {
      geopadInfo: {
        geopadId: 0,
        name: 'geopad_'
      },
      observationInstanceInfoList: selectedSites
    };

    console.log('Proceed to saveAs session');
    const geobaseRequest = {
      sessionId: 0,
      organizationId: 1,
      geopadId: newGeopadId,
      towerId: this.towerWithLayersList[0].tower.towerId,
      boundingBox: this.basemapService.getCurrentBasemap().getView().calculateExtent(this.basemapService.getCurrentBasemap().getSize()),
      status: 'Active',
      isDefault: false,
      name: this.sessionName.nativeElement.value,
      projectId: this.projectSelect.value, // this.projectId,
      placeId: this.placeSelect.value, // this.placeId,
      topicId: this.topicSelect.value, // this.topicId,
      geopadObservationInstanceInfo: geopadObservationInstanceInfoJson,
    };
    const towerLayerInfo = {
      towerInfo: {
        towerId: 0,
        name: 'tower_'
      },
      layerInfoList: selectedLayers, // this.towerWithLayersList[0].listOfLayers,
    };
    console.log(towerLayerInfo);
    console.log(geobaseRequest);
    // here changes are saving the multiple layers first then save the geobase only
    console.log('saving the multiple layers first ', towerLayerInfo);
    this.sessionSaveCurrentState = this.sessionSaveStates.STARTED;
    this.layersService.saveMultipleLayers(towerLayerInfo, this.multipartFiles)
      .subscribe((results: HttpEvent<any>) => {
          console.log(results);
          console.log(results.type);
          if (results.type === HttpEventType.UploadProgress) {
            console.log(`Loaded : ${results.loaded}`);
            console.log(`TOTAL : ${results.total}`);
            this.sessioSaveProgress = (100 * results.loaded / results.total).toFixed(2);
          }
          if (results.type === HttpEventType.Response) {
            console.log('GOT SAVED RESPONSE');
            console.log('after saving the multiple layers results ', results);
            if (!this.commonService.isValid(results)) {
              console.log('error in save multiple layers');
            } else {
              console.log('saved successfully.. call the geobase info saveAs new geobase');
              geobaseRequest.towerId = results.body;
              console.log('sending the request of saveAs geobase info ', geobaseRequest);
              this.geobaseService.createNewGeobase(geobaseRequest)
                  .subscribe(response => {
                    console.log('saved As new geobase response', response);
                    if (!this.commonService.isValid(response)) {
                      console.log('not valid response in savedAs geobase');
                    } else {
                      console.log('successfully savedAs geobase');
                      // refresh or close the geobase popup window
                      // this.closeNotePage();
                    }
                    this.sessionSaveCurrentState = this.sessionSaveStates.COMPLETED;
                    setTimeout(() => {
                      this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
                      this.sessioSaveProgress = '-1';
                    }, 5000);
                  }, error => {
                    console.log('Error while saving as new geobase');
                    console.log(error);
                    if (error.errorCode === 500) {
                    }
                    this.sessionSaveCurrentState = this.sessionSaveStates.FAILED;
                    setTimeout(() => {
                      this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
                    }, 5000);
                  });
          }
        }
      }, error => {
        console.log('Error while saving multiple layers');
        console.log(error);
        if (error.errorCode === 500) {
        }
        this.sessionSaveCurrentState = this.sessionSaveStates.FAILED;
        setTimeout(() => {
          this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
        }, 5000);
      });

  }

  getProjectsList(): any {
    console.log('getting the projects list');
    this.projectSelect.disable();
    this.placeSelect.disable();
    this.topicSelect.disable();
    this.topicsService.getProjectsList(this.userInfo.type)
    .subscribe(projectInfo => {
      this.projectSelect.enable();
      console.log('Got projectInfo info', projectInfo);
      if (!this.commonService.isValid(projectInfo)) {
        console.log('No projectInfo present');
      } else {
        console.log('projectInfo present', projectInfo);
        this.projects = projectInfo;
        setTimeout(() => {
          this.setDataToFormControl(this.projectSelect, this.selectedProject, this.projects);
        }, 500);
        // this.getPlacesListByProjectId(projectInfo[0].topicId);
        // this.projectId = projectInfo[0].topicId;
      }
    }, error => {
      console.log('Error while getting projectInfo');
      console.log(error);
      if (error.errorCode === 500) {
      }
      this.projectSelect.enable();
    });
  }

  getPlacesListByProjectId(projectId): any {
    console.log('getting the places list', projectId);
    this.placeSelect.disable();
    this.topicSelect.disable();
    // this.topicsService.getPlacesListByProjectId(projectId)
    // .subscribe(placesInfo => {
    //   this.placeSelect.enable();
    //   console.log('Got placesInfo info', placesInfo);
    //   if (!this.commonService.isValid(placesInfo)) {
    //     console.log('No placesInfo present');
    //   } else {
    //     console.log('placesInfo present', placesInfo);
    //     this.places = placesInfo;
    this.places = [{
      name: 'Southern California',
      topicId: 7
    }];
    setTimeout(() => {
      this.setDataToFormControl(this.placeSelect, this.selectedPlace, this.places);
    }, 500);
    //     // this.getTopicsListByPlaceId(placesInfo[0].topicId);
    //     // this.placeId = placesInfo[0].topicId;
    //   }
    // }, error => {
    //   console.log('Error while getting placesInfo');
    //   console.log(error);
    //   if (error.errorCode === 500) {
    //   }
    //   this.placeSelect.enable();
    // });
  }

  getTopicsListByPlaceId(placeId): any {
    console.log('getting the topics list', placeId);
    this.topicSelect.disable();
    // this.topicsService.getTopicsListByPlaceId(placeId)
    // .subscribe(topicsInfo => {
    //   this.topicSelect.enable();
    //   console.log('Got topicsInfo info', topicsInfo);
    //   if (!this.commonService.isValid(topicsInfo)) {
    //     console.log('No topicsInfo present');
    //   } else {
    //     console.log('topicsInfo present', topicsInfo);
    //     this.topics = topicsInfo;
    this.topics = [
      {
        name: 'Geo-Engineering',
        topicId: 3
      }
    ];
    setTimeout(() => {
      this.setDataToFormControl(this.topicSelect, this.selectedTopic, this.topics);
    }, 500);
    //     // this.topicId = topicsInfo[0].topicId;
    //   }
    // }, error => {
    //   console.log('Error while getting topicsInfo');
    //   console.log(error);
    //   if (error.errorCode === 500) {
    //   }
    //   this.topicSelect.enable();
    // });
  }

  setDataToFormControl(formCtrl: FormControl, selectedObj: any, allListArr: any[]): any {
    let topicId;
    try{
      if (this.commonService.isValid(selectedObj)) {
        if (this.commonService.isValid(selectedObj.topicId)) {
          topicId = selectedObj.topicId;
        } else {
          topicId = allListArr[0].topicId;
        }
      } else{
        topicId = allListArr[0].topicId;
      }
    } catch (e){
      topicId = '';
    }
    formCtrl.setValue(topicId);
  }

  shareSession(): any {
    this.errorMsg = '';
    let errorsFound = false;
    this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
    const saveTypeVal = this.saveTypeSelectCtrl.nativeElement.value;
    this.resetOrgUsers();
    try{
      if (this.globalObject.pageType === 'share') {
        throw new Error('Shared Session was not allowed to Share session');
      }
      if (!this.commonService.isValid(this.userEmail.value)){
        throw new Error('Please enter mail to share session');
      }
      if (!this.userEmail.valid){
        throw new Error('Please enter valid mail to share session');
      }
      if (this.userInfo.type === 'ORG'){
        const userIndex = this.allUserOrOrgEmails.findIndex(email => email === this.userEmail.value);
        if (userIndex === -1){
          throw new Error('Cannot share with a user/email not connected with this organization.');
        }
      } else if (this.userInfo.type === 'INDEPENDENT'){
        const userIndex = this.allUserOrOrgEmails.findIndex(email => email === this.userEmail.value);
        if (userIndex !== -1){
          throw new Error('Email belongs to other organization. Please choose another.');
        }
      }
    } catch (e) {
      errorsFound = true;
      console.log(e);
      this.errorMsg = e;
      setTimeout(() => {
        this.errorMsg = "";
      }, 5000);
    }
    if (!errorsFound) {
      console.log('ALL GOOD.. PROCEED..');
      this.shareSessionAPI();
    }
  }

  shareSessionAPI(): any {
    console.log('share session clicked...');
    console.log('emails are entered ', this.userEmail.value);
    const emailStr = this.userEmail.value;
    const emailsArray = emailStr.split(',');
    const emailList: any[] = [];
    emailsArray.forEach(email => {
      emailList.push(email);
    });
    console.log('final emails list are ', emailList, emailsArray.length);
    const uuidValue = uuid.v4();
    this.link = 'https://qa.fuse.earth/share/'
                + this.defaultGeobaseInfo.sessionId + '/' + uuidValue;
    // this.urlLink.nativeElement.value = 'http://18.144.21.216:4200/share/'
    //         + this.defaultGeobaseInfo.sessionId + '/' + uuid.v4();
    const requestGoebaseShare = {
      userEmailList : emailList,
      url : this.link,
      uuid : uuidValue,
    };
    this.sessionShareCurrentState = this.sessionSaveStates.STARTED;
    this.geobaseService.createGeobaseShare(requestGoebaseShare, this.defaultGeobaseInfo.sessionId)
    .subscribe(result => {
      console.log('Got geoshare replay info', result);
      this.sessionShareCurrentState = this.sessionSaveStates.COMPLETED;
      this.urlLink.nativeElement.value = this.link;
      setTimeout(() => {
        this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
      }, 5000);
      if (!this.commonService.isValid(result)) {
        console.log('No session share');
      } else {
        console.log('session share saving', result);
      }
    }, error => {
      console.log('Error while saving session share ');
      console.log(error);
      if (error.errorCode === 500) {
      }
      this.sessionShareCurrentState = this.sessionSaveStates.FAILED;
      setTimeout(() => {
        this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
      }, 5000);
    });
  }

  copySessionLinkToClipboard(): void{
    const copyText = this.urlLink.nativeElement;
    if (this.commonService.isValid(copyText.value)) {
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      document.execCommand('copy');
      this.copyToClipboard = 'Url copied.';
      setTimeout(() => {
        this.copyToClipboard = '';
      }, 5000);
    } else {
      this.errorMsg = 'Nothing present to copy.';
      setTimeout(() => {
        this.errorMsg = '';
      }, 5000);
    }
  }
  saveLayerToExistingTower(file, layerInfo, towerId): any {
    console.log('saving the layer here ', file, layerInfo, towerId);
    this.layersService.saveLayerToExistingTower(file, layerInfo, towerId)
        .subscribe((result: HttpEvent<any>) => {
          if (result.type === HttpEventType.UploadProgress) {
            // console.log(`Loaded : ${result.loaded}`);
            // console.log(`TOTAL : ${result.total}`);
            const layerSaveProgress = (100 * result.loaded / result.total).toFixed(2);
          }
          if (result.type === HttpEventType.Response) {
              // Here got some response frm saving the layer.. so need to enable the delete button
              // this.isDeleteDisable = false;
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
                this.geotowerService.deleteEventTowerRefresh();
                /* this.activateGeotower();
                setTimeout(() => {
                  this.activateGeotower();
                }, 500); */
              } else {
                console.log('Save map status');
                console.log(result, result.type);
              }
          }
        }, error => {
          // Here got some response frm saving the layer.. so need to enable the delete button
          // this.isDeleteDisable = false;
          console.log('Error while saving layer');
          console.log(error);
        });
  }

  getUserEmailsListByOrg(): any {
    this.geobaseService.getUserEmailsListByOrg(this.userInfo.type).subscribe(emailsList => {
      console.log('org have emails list ', emailsList);
      if (this.commonService.isValid(emailsList)){
        this.allUserOrOrgEmails = emailsList;
      } else {
        this.allUserOrOrgEmails = [];
      }
      this.orgUserEmailsToShow = [];
    }, error => {
      console.log('Error while getting org user emails');
      console.log(error);
      this.allUserOrOrgEmails = [];
      this.orgUserEmailsToShow = [];
    });
  }
  setSharingUserEmail(email): void{
    this.userEmail.setValue(email);
    this.orgUserEmailsToShow = [];
  }
  resetOrgUsers(): void{
    this.orgUserEmailsToShow = [];
  }
  onRemoveFocusOfUserEmail(event): void{
    // console.log('In onRemoveFocusOfUserEmail');
    // console.log(event);
    // console.log(event.target.value);
    setTimeout(() => {
      this.resetOrgUsers();
    }, 500);
  }

  onUserEmailType(event): void{
    // console.log('onUserEmailType');
    // console.log(event);
    const val: string = event.target.value;
    if (this.commonService.isValid(val)){
      // this.orgUserEmailsToShow = this.allUserOrOrgEmails;
      this.orgUserEmailsToShow = this.allUserOrOrgEmails.filter(email => {
        return email.indexOf(val.toLowerCase()) !== -1;
      });
    } else {
      // this.resetOrgUsers();
      this.orgUserEmailsToShow = this.allUserOrOrgEmails;
    }
  }
}
