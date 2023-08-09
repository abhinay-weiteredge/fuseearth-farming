import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input,
    SimpleChange, OnChanges, OnDestroy, Renderer2, PipeTransform, Pipe, HostListener, AfterViewInit } from '@angular/core';
// import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { AuthObservableService } from '../Services/authObservableService';
import { GeoNotePadService } from '../Services/geo-notepad.service';
import { Subject } from 'rxjs';
import { CommonService } from '../Services/common.service';
import { FileTypes, FuseEarthSite, SiteParams, SiteType } from './capture-notes/capture-notes.component';
import { GeobaseService } from '../Services/geobase.service';
import { TopicsService } from '../Services/topics.service';
import { FormControl, Validators } from '@angular/forms';
import OlMap from 'ol/Map';
import { BasemapService } from '../basemap/basemap.service';
import { GeoPopupComponent } from '../geopopup/geopopup.component';
import { GeotrayService } from '../geotray/geotray.service';
import Geolocation from 'ol/Geolocation';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GeotowerService } from '../geotower/geotower.service';
import { LayersService } from '../Services/layers.service';
import * as uuid from 'uuid';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { AnalyticsService } from '../Services/analytics.service';
import {createEmpty, extend} from 'ol/extent';


export enum SessionSharingOption{
  UNKNOWN = '',
  EMAIL = 'share-with-email',
  URL = 'share-url',
  DOWNLOAD = 'download'
}

@Pipe({
  name: 'fileType'
})
export class FileTypesCountFilter  implements PipeTransform {
  transform(filesList: any[], type: string): number {
    // if(type=="AllTournaments")
    //     return array;
    const tempFiltered = [];
    // console.log('what is files list error ', filesList);
    if (filesList !== undefined) {
      filesList.forEach(element => {
        if (element.type === type) {
          tempFiltered.push(element);
        }
      });
    }
    return tempFiltered.length;
  }
}


@Component({
  selector: 'app-capture',
  templateUrl: './capture.component.html',
  styleUrls: ['./capture.component.scss']
})
export class CaptureComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  fileTypes = FileTypes;
  savedNotes: any[] = [];
  operation = 'add';
  errorMsg = '';
  // @ViewChild('notes') notes: ElementRef<HTMLInputElement>;
  selectedNote: any = {};
  @Input() showCapture = false;
  @Input() markLocation = false;
  @Input() data: any = {};
  @Input() sessionId;
  @Input() isGuest = true;
  @Input() currentSession: any = {};
  @Input() showExpandedView = '';
  @Output() closeCapture: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadSession: EventEmitter<any> = new EventEmitter<any>();

  @Input() globalObject;
  @Input() viewMode: any = {};
  @Input() userInfo: any = {};
  @Input() userProfileData: any = {};
  // opts: ISlimScrollOptions;
  // scrollEvents: EventEmitter<SlimScrollEvent>;

  positionMarkObserver: Subject<any> = new Subject<any>();
  goingToMarkPosition = false;
  minimizedWindow = false;
  // locationCollected:boolean=false;
  locationData: any[] = [];
  showNotesPicker = false;
  showNotesAndFilePicker = false;
  getCoOrdsForNewNote = false;
  showConfirmDelete = false;
  showNotesPickerForPolygon = false;
  showNotesPickerForLine = false;
  currentFeature: any;
  @ViewChild('captureWindow') captureWindow: ElementRef<HTMLDivElement>;
  @ViewChild(GeoPopupComponent) popupComponent: GeoPopupComponent;
  // @ViewChild('saveTypeSelectCtrl') saveTypeSelectCtrl: ElementRef<HTMLSelectElement>;
  @ViewChild('urlLink') urlLink: ElementRef<HTMLInputElement>;
  // @ViewChild('sessionName') sessionName: ElementRef<HTMLInputElement>;

  showSavingStatus = false;
  showDeletingStatus = false;
  isValidSession = false;
  projects: any[] = [];
  projectSelect: FormControl = new FormControl('');
  places: any[] = [];
  placeSelect: FormControl = new FormControl('');
  topics: any[] = [];
  topicSelect: FormControl = new FormControl('');
  projectId = 0;
  placeId = 0;
  topicId = 0;
  selectedProject: any = {};
  selectedPlace: any = {};
  selectedTopic: any = {};
  private basemap: OlMap;
  captureModes = {
    CAPTURE: 'capture',
    AWARENESS: 'awareness'
  };
  confirmCurrentNotesClosing: any = {};
  tempCreateSiteId: string = String(new Date().getTime());
  mouseDownTimeStamp: number;
  selectedProjectId: number | string;
  selectedPlaceId: number | string;
  selectedTopicId: number | string ;
  sitesDataCollected: boolean;
  currentContextInfo: any = {};
  siteSearchObserver: Subject<any> = new Subject<any>();
  searchName = '';
  searchSiteType: SiteType = SiteType.ALL;
  siteTypeEnum = SiteType;
  @ViewChild('siteSearchInput') siteSearchInput: ElementRef<HTMLInputElement>;

  oldDataRangeSelect: FormControl = new FormControl(10);
  oldDataRanges: any[] = [
    { name: 'Last 10 Days', value: 10 },
    { name: 'Last 20 Days', value: 20 },
    { name: 'Last 30 Days', value: 30 },
    { name: 'Last 60 Days', value: 60 }
  ];

  showSiteMarkerMenu = false;
  showSearchbar = false;
  siteType = this.notePadService.shapeDrawType;
  showSearchOptions = false;
  ownerName: string;
  ownerEmail: string;
  // sessionCategories: any[] = [
  //   { name: 'My Session', value: 'MY_SESSION', default: true},
  //   { name: 'Session shared with me', value: 'SHARED_SESSION', default: false},
  //   { name: 'Public Session', value: 'PUBLIC_SESSION', default: false}
  // ];

  copySelected = false;
  showSessionShareMenu = false;
  towerItemsDataCollected: boolean;
  geoTowerList: any[] = [];
  multipartFiles: any[] = [];
  towerWithLayersList: any[] = [];
  shareSessionToEmail = false;
  copySessionUrl = false;
  userEmail: FormControl = new FormControl('', [Validators.email]);
  sessionNameInput: FormControl = new FormControl('');
  allUserOrOrgEmails: Array<string> = [];
  orgUserEmailsToShow: Array<string> = [];
  link;
  sessionSaveStates = {
    UNKNOWN: 'unknown',
    STARTED: 'started',
    COMPLETED: 'completed',
    FAILED: 'failed'
  };
  sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
  defaultGeobaseInfo: any = {};
  geoSessionsList: any[] = [];
  geoSessionDataColleced: boolean;
  // showRunningSession = false;
  error = '';
  userEmailListString = '';
  selectedUserEmailsToShare: Array<string> = [];
  showSessionOverrideAlert = false;
  showSessionShareAlert = false;
  showSessionSaveAlert = false;
  sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
  sessioSaveProgress: string;
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
  copyToClipboard = '';
  urlCopiedToClipboard = false;

  @ViewChild('selectAllSitesCheckbox') selectAllSitesCheckbox: MatCheckbox;
  @ViewChild('selectAllLayersCheckbox') selectAllLayersCheckbox: MatCheckbox;
  selectedSessionCategory = 'mySession';
  selectedSessionId = 'running';
  sessionCategoryCtrl: FormControl = new FormControl('');
  sessionCtrl: FormControl = new FormControl('');
  defaultSession: any = {};
  selectedSiteStateWhileEdit: any = {};
  sessionShareOptionEnum =  SessionSharingOption;
  selectedSessionSharingOption: SessionSharingOption = SessionSharingOption.UNKNOWN;
  tempUserEmailFormControl: FormControl = new FormControl('', [Validators.email]);
  saveSessionOptionSelectedFrom: SessionSharingOption = SessionSharingOption.UNKNOWN;
  projectsDataCollected = false;
  placesDataCollected = false;
  topicsDataCollected = false;
  currentSiteDataToRefresh: any = {};
  sessionCategories = {
    mySession: 'My Sessions',
    shareWithMe: 'Shared Sessions with Me',
    public: 'Public Sessions',
    '': '',
    null: '',
    undefined: ''
  };
  currSessionsObj: any = {};
  showSessionShareSiteEditAlert = false;

  constructor(
    private authObsr: AuthObservableService, private notePadService: GeoNotePadService,
    private nodePadService: GeoNotePadService, private basemapService: BasemapService,
    private commonService: CommonService, private renderer: Renderer2,
    private geotrayService: GeotrayService, private analytics: AnalyticsService,
    private geotowerService: GeotowerService, private layersService: LayersService,
    private geobaseService: GeobaseService, private topicsService: TopicsService) {
    this.positionMarkObserver.subscribe(res => {
      console.log('POSITION MARKED');
      console.log(res);
      let coords;
      const coordsList = [];
      if (res.from === this.notePadService.shapeDrawType.POLYGON /*'polygon'*/){
        // coords = res['co-ordinates'];
        res['co-ordinates'].forEach(latLngList => {
          console.log(' ???? ', latLngList);
          latLngList.forEach(element => {
            console.log(element);
            // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
            coordsList.push(element[0]);
            coordsList.push(element[1]);
          });
        });
        console.log(coordsList);
        coords = coordsList;
      } else if ( res.from === this.notePadService.shapeDrawType.LINE_STRING ){
        res['co-ordinates'].forEach(latLngList => {
          console.log(latLngList);
          // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
          coordsList.push(latLngList[0]);
          coordsList.push(latLngList[1]);
        });
        console.log(coordsList);
        coords = coordsList;
      } else if (res.from === this.notePadService.shapeDrawType.POINT /*'position'*/){
        // coords = [res['co-ordinates']];
        res['co-ordinates'].forEach(latLngList => {
          console.log(latLngList);
          // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
          coordsList.push(latLngList);
        });
        console.log(coordsList);
        coords = coordsList;
      }

      this.locationData = coords;
      this.tempCreateSiteId = String(new Date().getTime());
      // [latitude] = "locationData[0]"
      // [longitude] = "locationData[1]"
      this.currentFeature = res;
      this.goingToMarkPosition = false;
      console.log(this);
      // this.locationCollected=true;
      // this.saveLatLong(coords);
      if (this.getCoOrdsForNewNote) {
        this.maximizeNotePage();
        this.showNotesAndFilePicker = true;
      }
    });
    this.basemap = this.basemapService.getCurrentBasemap();
    if (this.commonService.isValid(localStorage.getItem('token'))) {
      this.isGuest = false;
    } else {
      this.isGuest = true;
    }
    this.authObsr.subscribeForAuthStatus('CaptureComponent', (authRes, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(authRes.status);
      console.log(msg);
      if (authRes.status === 'success') {
        this.isGuest = false;
        // this.getProjectsList();
        // if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
        //   this.currentSession = this.globalObject.geobase;
        //   this.getSitesListWithItems(this.globalObject.geobase.geopadId);
        // }
        // this.runAllWaitingTasks();
      } else if (authRes.status === 'failed') {
        this.isGuest = true;
        if (this.globalObject.pageType !== 'COVID19') {
          this.closeNotePage();
        }
        this.clearContextInfo();
      }
    });
    this.monitorChangesInSiteSearch();
  }

  @HostListener('window:keyup.esc', ['$event'])
  keyEvent(event: KeyboardEvent): any {
    console.log('esc clicked!! in capture component ', event);
    // if (this.globalObject.pageType !== 'COVID19') {
    //   this.closeNotePage();
    // }
    this.notePadService.removePolygonMarkTools();
  }

  ngOnInit(): any {
    console.log(this);
    /* this.getProjectsList();
    if (this.globalObject !== null && this.globalObject !== '') {
      this.getSitesListWithItems(this.globalObject.session.geopadId);
    } */
    // this.getDefaultGeobase();
    if (this.globalObject.pageType === 'COVID19') {
      this.authObsr.subscribeForRefreshSites('CaptureComponent', (status, msg) => {
        console.log('REFRESH CURRENT SITES');
        console.log(status);
        console.log(msg);
        this.maximizeNotePage();
        this.getCurrentContextSites();
      });
    }
    this.projectSelect.valueChanges.subscribe(res => {
      console.log('PROJECT CHANGED');
      console.log(res);
      if (this.commonService.isValid(res) /*&& res !== 'ALL'*/) {
        this.selectedProjectId = res;
        // this.selectedPlaceId = null;
        // this.selectedTopicId = null;
        this.resetSearchSiteBox();
        const projectIndex = this.projects.findIndex(val => String(val.topicId) === String(res));
        console.log(`Project index : ${projectIndex}`);
        if (projectIndex !== -1){
          this.selectedProject = this.projects[projectIndex];
        }
        // this.savedNotes = [];
        // this.closeAllMarkersAndPolygons();
        this.currentContextInfo = {
          project: this.selectedProject,
          place: this.selectedPlace,
          topic: this.selectedTopic
        };
        this.checkProjectPlaceTopicAndGetSites();
        // this.getPlacesListByProjectId(res);
        // try{
        //   this.getSitesListWithItemsFilterByProjectId(this.globalObject.geobase.geopadId, res);
        // } catch (e){
        //   console.log(e);
        // }
      }
      // else if (res === 'ALL') {
      //   console.log('GET ALL SITES OF ALL PROJECTS WITH CURRENT SELECTIONS');
      //   try{
      //     this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
      //                 this.projectSelect.value, this.placeSelect.value, this.selectedTopicId);
      //   } catch (e){
      //     console.log(e);
      //   }
      // }
    });

    // this.showRunningSession = true;
    this.placeSelect.valueChanges.subscribe(res => {
      console.log('PLACE CHANGED');
      console.log(res);
      if (this.selectedPlaceId !== res){
        this.selectedPlaceId = res;
        // this.selectedTopicId = null;
        this.resetSearchSiteBox();
        const placeIndex = this.places.findIndex(val => String(val.topicId) === String(res));
        console.log(`Place index : ${placeIndex}`);
        if (placeIndex !== -1){
          this.selectedPlace = this.places[placeIndex];
        }
        // if (this.commonService.isValid(res)) {
        //   this.getTopicsListByPlaceId(res);
        // }
        this.currentContextInfo = {
          project: this.selectedProject,
          place: this.selectedPlace,
          topic: this.selectedTopic
        };
        this.checkProjectPlaceTopicAndGetSites();
      }
    });

    this.topicSelect.valueChanges.subscribe(res => {
      console.log('TOPIC CHANGED');
      console.log(res);
      console.log(this.topicSelect.disabled);
      if (this.selectedTopicId !== res ){ // && (!this.topicSelect.disabled)) {
        this.selectedTopicId = res;
        this.resetSearchSiteBox();
        const topicIndex = this.topics.findIndex(val => String(val.topicId) === String(res));
        console.log(`Topic index : ${topicIndex}`);
        if (topicIndex !== -1){
          this.selectedTopic = this.topics[topicIndex];
        }
        this.currentContextInfo = {
          project: this.selectedProject,
          place: this.selectedPlace,
          topic: this.selectedTopic
        };
        this.checkProjectPlaceTopicAndGetSites();
      }
    });


    // FOR ONLY COVID19 PAGE AS OF NOW
    this.oldDataRangeSelect.valueChanges.subscribe(res => {
      console.log('OLD DATA RANGE CHANGED');
      console.log(res);
      this.getCurrentContextSites();
    });

  }

  checkProjectPlaceTopicAndGetSites(): void{
    console.log('In checkProjectPlaceTopicAndGetSites');
    if (this.projectsDataCollected && this.placesDataCollected && this.topicsDataCollected){
      console.log('ALL REQUIRED DATA COLLECTED TO GET SITES...');
      try{
        this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
              this.projectSelect.value, this.placeSelect.value, this.selectedTopicId, this.currentSiteDataToRefresh);
      } catch (e){
        console.log(e);
      }
      this.currentSiteDataToRefresh = {};
    } else {
      console.log('ALL REQUIRED DATA NOT COLLECTED YET TO GET SITES...');
    }
  }
  ngOnDestroy(): any {
    this.closeNotePage();
    this.notePadService.removePolygonMarkTools();
    this.notePadService.clearPolygonDrawingTools();
  }

  ngAfterViewInit(): void{
    if ( this.globalObject.pageType === 'COVID19'){
      setTimeout(() => {
        this.minimizeNotePage();
      }, 1000);
    }
  }

  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    setTimeout(() => {
      // Here adding the Activate Tool for covid only
      if (this.globalObject.pageType === 'COVID19'){
        const toolOptions = {
          title: 'QTB',
          isCtrlClicked: false,
          popupComponent: this.popupComponent,
          isCovidPage: true
        };
        this.geotrayService.activateTool(toolOptions);
        this.basemapService.setMouseIcon('auto');
      }
    }, 5000);
    console.log('IN CAPTURE SCREEN');
    console.log(changes);
    console.log(this);
    if (this.commonService.isValid(changes.data)) {
      if (this.commonService.isValid(changes.data.currentValue)) {
        this.showNotesPicker = true;
      }
    }
    if (this.commonService.isValid(changes.showCapture)) {
      if (!changes.showCapture.currentValue) {
        this.resetAll();
      } else {

        this.analytics.sendPageViewData('geopad', 'Geopad');

        // GET ALL SITES
        // this.getDefaultGeobase();
        this.minimizedWindow = false;
        console.log('what is globalObject in capture component in ngOnCahnge ', this.globalObject);
        if (!this.isGuest){
          this.getProjectsList();
        }
        if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
          this.defaultGeobaseInfo = this.globalObject.geobase;
          this.currentSession = this.globalObject.geobase;
          // this.getSitesListWithItems(this.globalObject.geobase.geopadId);
          // this.getSitesListWithItemsFilterByProjectId(this.globalObject.geobase.geopadId, this.projectId);
          this.getGeoTowerItems(this.globalObject.geobase.towerId);
          if (this.globalObject.sessionShare !== null && this.globalObject.sessionShare !== ''){
            console.log(this.globalObject.sessionShare.recipientUserEmail);
            console.log(this.globalObject.sessionShare.senderUserEmail);
            if (localStorage.getItem('email') === this.globalObject.sessionShare.recipientUserEmail){
              this.selectedSessionCategory = 'shareWithMe';
            } else if (localStorage.getItem('email') === this.globalObject.sessionShare.senderUserEmail){
              this.selectedSessionCategory = 'mySession';
            }
            this.selectedSessionId = this.globalObject.geobase.sessionId;
          }
        }
        // if (this.markLocation) {
        //   this.markLocationOnMap();
        // }
        this.sessionCategoryCtrl.setValue(this.selectedSessionCategory);
        this.getGeobaseListByFilterProcess(this.selectedSessionCategory);
        this.getUserEmailsListByOrg();
      }
    }
    if (this.commonService.isValid(changes.showExpandedView)) {
      if (this.commonService.isValid(changes.showExpandedView.currentValue)) {
        this.maximizeNotePage();
      }
    }
    if (this.commonService.isValid(changes.markLocation)) {
      if (changes.markLocation.currentValue && !this.isGuest && this.isValidSession) {
        this.markLocationOnMap();
      }
    }

    if (this.commonService.isValid(changes.currentSession)) {
      if (changes.currentSession.currentValue) {
        console.log('GOT SESSION INFO');
        console.log(this.currentSession);
        this.ownerName = localStorage.getItem('name');
        this.ownerEmail = localStorage.getItem('email');
        this.sessionSaveCurrentState = this.sessionSaveStates.UNKNOWN;
        if (this.commonService.isValid(this.currentSession.sessionId)) {
          console.log('VALID SESSION');
          this.isValidSession = true;
          if (!changes.currentSession.firstChange) {
            this.getProjectsList();
            if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
              this.currentSession = this.globalObject.geobase;
              // this.getSitesListWithItems(this.globalObject.geobase.geopadId);
            }

            // THIS IS TO LOAD/RELOAD THINGS WHEN SESSION CHANGES
            this.sessionCategoryCtrl.setValue(this.selectedSessionCategory);
            this.getGeobaseListByFilterProcess(this.selectedSessionCategory);
            if (this.showCapture && this.commonService.isValid(this.globalObject.geobase)){
              this.getGeoTowerItems(this.globalObject.geobase.towerId);
            }

          }
          // this.defaultSession = this.currentSession;
        } else{
          console.log('INVALID SESSION');
          this.isValidSession = false;
        }
      }
      if (!this.commonService.isValid(this.defaultSession.sessionId)){
        console.log('DEFAULT VALID SESSION NOT PRESENT. SO, SAVING NEXT VALUE');
        this.defaultSession = this.currentSession;
      }
    }

    if (this.commonService.isValid(changes.viewMode)) {
      if (this.commonService.isValid(changes.viewMode.currentValue)) {
        console.log('VIEW MODE CHANGED');
        console.log(this.viewMode);

        if (this.viewMode.mode === this.captureModes.AWARENESS){
          // // TO CLOSE LAYERS, IF CAPTURE SCREEN IS IN B/W OF ADDING SITE
          this.showOrCloseLocationOnMap({latitudeLongitude: this.locationData}, 'close');

          this.showOrHideAwareness();
        } else if (this.viewMode.mode === this.captureModes.CAPTURE && this.viewMode.from === 'annotate'){
          // this.showNotesPickerForPolygon = true;
          // this.pickLoation('images');
          this.data = 'images';
          // this.goingToMarkPosition = true;
          // this.getCoOrdsForNewNote = true;
          // this.notePadService.drawShapesWithAnnotateTool(this.positionMarkObserver, this.currentContextInfo);
          console.log('IN ANNOTATE');
          this.locationData = this.viewMode.coords;
          this.tempCreateSiteId = String(new Date().getTime());
          this.currentFeature = this.viewMode.features;
          this.goingToMarkPosition = false;
          this.showNotesAndFilePicker = true;
          this.maximizeNotePage();
        }
      }
    }

    if (this.commonService.isValid(changes.isGuest)) {
      // console.log('CHANGE IN GUEST');
      if (this.commonService.isValid(changes.isGuest.currentValue)) {
        // console.log('GUEST VALUE VALID');
        if (changes.isGuest.currentValue) {
          // console.log('YOU ARE A GUEST');
          if ( this.globalObject.pageType === 'COVID19'){
            // console.log('GETTING ALL SITES FOR COVID GUEST PAGE');
            this.oldDataRangeSelect.setValue(10);
            this.ownerName = localStorage.getItem('name');
            this.ownerEmail = localStorage.getItem('email');
            this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
                                                                          'ALL', 'ALL', 'ALL', {}, true);
          }
        }
      }
    }

  }

  showOrHideAwareness(): void{
    console.log('IN showOrHideAwareness');
    if (this.viewMode.mode === this.captureModes.AWARENESS && this.viewMode.show) {
      this.closeNotes('');
      this.closeAllMarkersAndPolygons();
      this.showCapture = true;
      this.getProjectsList();
      if (this.globalObject.geobase !== null && this.globalObject.geobase !== '') {
        this.currentSession = this.globalObject.geobase;
        // this.getSitesListWithItems(this.globalObject.geobase.geopadId);
      }
    } else if (this.viewMode.mode === this.captureModes.AWARENESS && !this.viewMode.show) {
      this.closeNotePage();
      // this.minimizeNotePage();
    } else if (this.viewMode.mode === this.captureModes.CAPTURE) {
      this.closeAllMarkersAndPolygons();
    }
  }

  markLocationOnMap(): any {
    // this.data = 'images';
    this.showNotesPicker = true;
    this.pickLoation('images');
  }

  markPosition(): any {
    this.goingToMarkPosition = true; // !this.goingToMarkPosition;
    if (this.goingToMarkPosition) {
      console.log('SUBSCRIBED FOR MARK MAP');
      // this.notePadService.setIconToSelectLocationInMap(this.positionMarkObserver);
      if (this.showNotesPicker) {
        console.log('Pick a marker');
        this.notePadService.locatePointOrPolygonOnMap(this.notePadService.shapeDrawType.POINT,
                                                      this.positionMarkObserver, this.currentContextInfo);
      } else if (this.showNotesPickerForPolygon) {
        console.log('Pick a Ploygon');
        // this.notePadService.locatePolygonOnMap(this.notePadService.shapeDrawType.POLYGON, this.positionMarkObserver);
        this.notePadService.locatePointOrPolygonOnMap(this.notePadService.shapeDrawType.POLYGON,
                                                      this.positionMarkObserver, this.currentContextInfo);
      } else if (this.showNotesPickerForLine) {
        console.log('Pick a Line');
        // this.notePadService.locatePolygonOnMap(this.notePadService.shapeDrawType.LINE_STRING, this.positionMarkObserver);
        this.notePadService.locatePointOrPolygonOnMap(this.notePadService.shapeDrawType.LINE_STRING,
                                                      this.positionMarkObserver, this.currentContextInfo);
      }
    } else {
      console.log('UN SUBSCRIBED FOR MARK MAP');
      // this.locationCollected=false;
      this.locationData = [];
      // this.notePadService.unSetIconToSelectLocationInMap();
    }
  }
  clearLocation(): any {
    this.locationData = [];
    // this.notePadService.unSetIconToSelectLocationInMap(true);
    this.goingToMarkPosition = false;
    this.removeCurrentFeature();
  }
  // saveNote(notes, from) {
  //   console.log('IN save notes');
  //   console.log(notes);
  //   console.log(this);
  //   this.notePadService.unSetIconToSelectLocationInMap();
  //   // let type='text';
  //   // if(this.locationCollected)
  //   //   type='location';
  //   console.log(this.locationData);
  //   if (this.operation === 'add') {
  //     if (from === 'input') {
  //       if (!this.commonService.isValid(notes.target.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       console.log(notes.target.value);
  //       this.savedNotes.push({
  //         time: new Date().getTime(),
  //         msg: notes.target.value,
  //         locationData: this.locationData,
  //         // type:type
  //       });
  //       notes.target.value = '';
  //     } else {
  //       if (!this.commonService.isValid(notes.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       console.log(notes.value);
  //       this.savedNotes.push({
  //         time: new Date().getTime(),
  //         msg: notes.value,
  //         locationData: this.locationData,
  //         // type:type
  //       });
  //       notes.value = '';
  //     }
  //   } else {
  //     if (from === 'input') {
  //       if (!this.commonService.isValid(notes.target.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       const index = this.savedNotes.findIndex(val => val.time === this.selectedNote.time);
  //       if (index !== -1) {
  //         this.savedNotes[index].msg = notes.target.value;
  //         this.savedNotes[index].locationData = this.locationData;
  //       }
  //       notes.target.value = '';
  //     } else {
  //       if (!this.commonService.isValid(notes.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       const index = this.savedNotes.findIndex(val => val.time === this.selectedNote.time);
  //       if (index !== -1) {
  //         this.savedNotes[index].msg = notes.value;
  //         this.savedNotes[index].locationData = this.locationData;
  //       }
  //       notes.value = '';
  //     }
  //   }
  //   console.log(this.savedNotes);
  //   this.reset();
  // }
  reset(): any {
    this.operation = 'add';
    this.selectedNote = {};
    // this.notes.nativeElement.value = '';
    this.clearLocation();
  }
  showError(msg): any {
    this.errorMsg = msg;
    setTimeout(() => {
      this.errorMsg = '';
    }, 5000);
  }
  // editNotes(e, notes) {
  //   console.log('IN editNotes');
  //   console.log(e);
  //   console.log(notes);
  //   this.operation = 'update';
  //   this.selectedNote = notes;
  //   // this.notes.nativeElement.value = notes.msg;
  //   this.locationData = notes.locationData;
  // }
  // deleteNotes(e, notes) {
  //   console.log('IN deleteNotes');
  //   console.log(e);
  //   console.log(notes);
  //   if (this.commonService.isValid(notes.locationData)) {
  //     this.notePadService.closeMarker(notes.time);
  //   }
  //   const index = this.savedNotes.findIndex(val => val.time === notes.time);
  //   if (index !== -1) {
  //     this.savedNotes.splice(index, 1);
  //   }
  //   this.reset();
  // }
  editNotes(note): any {
    if (this.globalObject.pageType === 'share') {
      this.showSessionShareSiteEditAlert = true;
      // window.alert('You do not have edit rights for this session..');
      return ;
    }
    for (const key in note) {
      if (note.hasOwnProperty(key)) {
        this.selectedSiteStateWhileEdit[key] = note[key];
      }
    }
    this.showOrCloseLocationOnMap(note, 'close');
    try{
      this.currentContextInfo = {
        project: note.project,
        place: note.place,
        topic: note.topic
      };
    } catch (e){
      console.log(e);
    }
    this.selectedNote = note;
    this.operation = 'update';
    this.data = 'images';
    // this.locationData = [note.latitude, note.longitude];
    this.showNotesAndFilePicker = true;
  }
  confirmDelete(note): any {
    if (this.globalObject.pageType === 'share') {
      this.showSessionShareSiteEditAlert = true;
      // window.alert('You do not have edit rights for this session..');
      return ;
    }
    this.selectedNote = note;
    this.showConfirmDelete = true;
    // this.savedNotes.splice(index,1);

  }
  deleteNote(): any {
    if (this.globalObject.pageType === 'share') {
      this.showSessionShareSiteEditAlert = true;
      // window.alert('You do not have edit rights for this session..');
      return ;
    }
    // const index = this.savedNotes.findIndex(val => val.id === this.selectedNote.id );
    // if (index !== -1) {
    //   console.log('INDEX : ', index);
    //   this.savedNotes.splice(index, 1);
    // }
    this.showConfirmDelete = false;
    const note = this.selectedNote;
    console.log('what noe deleting ', note);
    this.showDeletingStatus = true;
    this.showOrCloseLocationOnMap(this.selectedNote, 'close');
    // this.nodePadService.deleteSingleSite(note.observationInstanceId)
    this.nodePadService.deleteRelationGeopadSite(this.globalObject.geobase.geopadId, note.observationInstanceId)
          .subscribe(result => {
            console.log('Deleted Site', result);
            this.showDeletingStatus = false;
            if (!this.commonService.isValid(result)) {
              console.log('Site Deletion Done');
            } else {
              console.log('no Site deleted');
            }
            // this.getProjectsList();
            try{
              this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
                          this.projectSelect.value, this.placeSelect.value, this.selectedTopicId);
            } catch (e){
              console.log(e);
            }
          }, error => {
            console.log('Error while Deleting the Site');
            console.log(error);
            if (error.errorCode === 500) {
            }
            this.showDeletingStatus = false;
          });
  }
  responseOfCurrentNoteCloseRequestFun(decesion): void{
    console.log('In responseOfCurrentNoteCloseRequestFun');
    console.log(decesion);
    if (decesion === 'yes') {
      this.closeNotePage();
    }
    this.confirmCurrentNotesClosing = {};
  }
  checkAndcloseNotePage(): void {
    if (this.showNotesAndFilePicker) {
      // NOTES ADD SCREEN SHOWN
      console.log('NOTES ADD SCREEN SHOWN');
      this.confirmCurrentNotesClosing = { type: 'confirm-close', ts: String(new Date().getTime()) };
    } else {
      // NOTES ADD SCREEN NOT SHOWN
      console.log('NOTES ADD SCREEN NOT SHOWN');
      this.closeNotePage();
    }
  }

  clearContextInfo(): void{
    this.closeAllMarkersAndPolygons();
    this.selectedPlaceId = null;
    this.selectedProjectId = null;
    this.selectedTopicId = null;
    this.selectedProject = {};
    this.selectedPlace = {};
    this.selectedTopic = {};
    this.projectSelect.setValue(null);
    this.placeSelect.setValue(null);
    this.topicSelect.setValue(null);
    this.savedNotes = [];
    this.projects = [];
    this.places = [];
    this.topics = [];
    this.orgUserEmailsToShow = [];
  }
  closeNotePage(): any {
    this.showOrCloseLocationOnMap({latitudeLongitude: this.locationData}, 'close');
    this.closeCapture.emit();
    this.showCapture = false;
    // this.reset();
    this.resetAll();
    this.closeAllMarkersAndPolygons();
    this.savedNotes = [];
    this.minimizedWindow = false;
    this.getCoOrdsForNewNote = false;
    this.showNotesAndFilePicker = false;
    this.data = '';
    this.showSavingStatus = false;
    this.showDeletingStatus = false;
    this.showConfirmDelete = false;
  }
  closeAllMarkersAndPolygons(): void{
    // CLOSE ALL POSITIONS/ POLYGONS ON MAP
    this.savedNotes.forEach(element => {
      // if (element.locationData.length > 0) {
      //   this.notePadService.closeMarker(element.time);
      // }
      this.showOrCloseLocationOnMap(element, 'close');
    });
  }
  minimizeNotePage(): any {
    console.log('IN minimizeNotePage');
    this.renderer.listen(this.captureWindow.nativeElement, 'animationend', (e) => {
      // console.log('ANIMATION ENDED');
      // console.log(e);
      this.minimizedWindow = true;
      const clsList1 = this.captureWindow.nativeElement.classList;
      if (clsList1.contains('captureWinSlideRight')){
        clsList1.remove('captureWinSlideRight');
      }
    }).bind(this);
    const clsList = this.captureWindow.nativeElement.classList;
    if (!clsList.contains('captureWinSlideRight')){
      console.log('not contains slideRight');
      clsList.add('captureWinSlideRight');
    } else {
      console.log('Already contains captureWinSlideRight');
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
    // console.log('IN maximizeNotePage');
    // this.minimizedWindow = false;
    this.renderer.listen(this.captureWindow.nativeElement, 'animationend', (e) => {
      // console.log('ANIMATION ENDED');
      // console.log(e);
      this.minimizedWindow = false;
      const clsList1 = this.captureWindow.nativeElement.classList;
      if (clsList1.contains('captureWinSlideLeft')){
        clsList1.remove('captureWinSlideLeft');
      }
    }).bind(this);
    const clsList = this.captureWindow.nativeElement.classList;
    if (!clsList.contains('captureWinSlideLeft')){
      console.log('not contains slideRight');
      clsList.add('captureWinSlideLeft');
    } else {
      console.log('Already contains captureWinSlideLeft');
    }
  }
  gotoLocation(note): any {
    console.log('IN gotoLocation');
    console.log(note);
    // this.notePadService.addMarker(note.locationData[0], note.locationData[1], note.time);
  }
  showHideNotesPickesWithMyLocation(): any {
    this.userLocation();
    }
  userLocation(): any {
      if (navigator.geolocation) {
        console.log('changed- navigated true ');
        navigator.geolocation.getCurrentPosition(this.updateLocation, this.handleLocationError, { timeout: 100 });
        const geolocation = new Geolocation({
          tracking: true
        });
        geolocation.on('change', (evt) => {
          console.log(geolocation.getPosition());
          this.basemapService.getCurrentBasemap().getView().setCenter(geolocation.getPosition());
          this.basemapService.getCurrentBasemap().getView().setZoom(10);
        });
      } else {
        console.log('Browser is so old');
      }
  }
  updateLocation(positionData): any {
      console.log('changed- user location ');
      const latitude = positionData.coords.latitude;
      const longitude = positionData.coords.longitude;
      console.log(positionData.coords);
      this.basemapService.getCurrentBasemap().getView().setCenter([longitude, latitude]);
      this.basemapService.getCurrentBasemap().getView().setZoom(6);
  }
  handleLocationError(): any {
      console.log('Browser block the location permission!!!');
  }
  showHideNotesPickes(): any {
    this.showNotesPicker = !this.showNotesPicker;
    // if (!this.showNotesPicker) {
    //   this.data = '';
    // }
    if (this.showNotesPicker) {
      this.showNotesPickerForPolygon = false;
      this.showNotesPickerForLine = false;
    }
    this.data = '';
    this.pickLoation('images');
  }
  showHideNotesPickesForPolygon(): any {
    this.showNotesPickerForPolygon = !this.showNotesPickerForPolygon;
    // if (!this.showNotesPickerForPolygon) {
    //   this.data = '';
    // }
    if (this.showNotesPickerForPolygon) {
      this.showNotesPicker = false;
      this.showNotesPickerForLine = false;
    }
    this.data = '';
    this.pickLoation('images');
  }
  showHideNotesPickesForLine(): any {
    this.showNotesPickerForLine = !this.showNotesPickerForLine;
    // if (!this.showNotesPickerForLine) {
    //   this.data = '';
    // }
    if (this.showNotesPickerForLine) {
      this.showNotesPicker = false;
      this.showNotesPickerForPolygon = false;
    }
    this.data = '';
    this.pickLoation('images');
  }
  pickLoation(type): any {
    console.log('IN PICK LOCATION');
    this.data = type;
    // if (this.showNotesPicker) {
    //   console.log('Pick a marker');
    this.markPosition();
    // } else if (this.showNotesPickerForPolygon) {
    //   console.log('Pick a Ploygon');
    // }
    this.getCoOrdsForNewNote = true;
    setTimeout(() => {
      this.minimizeNotePage();
      // this.showNotesAndFilePicker=true;
    }, 500);
  }
  resetAll(): any {
    this.data = '';
    this.showNotesPicker = false;
    this.showNotesPickerForPolygon = false;
    this.showNotesPickerForLine = false;
    this.markLocation = false;
    this.userEmailListString = '';
    this.userEmail = new FormControl('', [Validators.email]);
    // this.shareSessionToEmail = false;
    // this.copySessionUrl = false;
    this.selectedSessionSharingOption = SessionSharingOption.UNKNOWN;
    this.showSessionShareMenu = false;
    this.copySelected = false;
    // this.geoSessionsList = [];
    this.sessionNameInput = new FormControl('');
    this.reset();
    this.projectsDataCollected = false;
    this.placesDataCollected = false;
    this.topicsDataCollected = false;
  }
  closeNotes(e): any {
    console.log(e);
    this.showNotesAndFilePicker = false;
    if (e === 'without-save'){
      console.log('SITE CLOSED WITHOUT SAVING.. RESET PREVIOUS SITE..');
      if (this.selectedSiteStateWhileEdit.visible){
        this.showOrCloseLocationOnMap(this.selectedSiteStateWhileEdit);
      }
      this.selectedSiteStateWhileEdit = {};
    }
    console.log(this.selectedNote);
    console.log(this.selectedNote.visible);
    if (this.selectedNote.visible){
      this.getAllNewSites(this.selectedNote);
    }
    this.resetAll();
    this.removeCurrentFeature();
  }
  getAllNewSites(currentSiteData, refreshProjects = ''): any {
    console.log('getAllNewSites');
    console.log(currentSiteData);
    console.log(this);
    let geopadId = this.currentSession.geopadId;
    if (this.currentSession.geopadId === null) {
      geopadId = 0;
    }
    this.currentSiteDataToRefresh = {};
    if (refreshProjects === 'refresh') {
      this.projectsDataCollected = false;
      this.placesDataCollected = false;
      this.topicsDataCollected = false;
      this.currentSiteDataToRefresh = currentSiteData;
      this.getProjectsList();
    } else{
      this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
                                  this.projectSelect.value, this.placeSelect.value, this.topicSelect.value, currentSiteData);
    }
    this.searchSiteType = SiteType.ALL;
    setTimeout(() => {
      // ADDING DELAY TO SUPPORT REMOVING ANNOTATION BOUNDARY AND OPERATION BUTTONS
      this.viewMode.mode = this.captureModes.CAPTURE;
      this.viewMode.from = 'geopad';
    }, 1000);
    // this.notePadService.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(geopadId, this.projectSelect.value,
    //           this.placeSelect.value, this.topicSelect.value)
    //             .subscribe(result => {
    //               console.log('Got saved notes');
    //               console.log(result);
    //               try{
    //                 if (result.length === 0) {
    //                   this.savedNotes = [];
    //                 }
    //               }catch (e){
    //                 console.log(e);
    //               }
    //               // this.savedNotes = result;
    //               if (!this.commonService.isValid(result)) {
    //                 console.log('No geobaseList present in filter');
    //                 const geopadList = [];
    //                 const fileList = [];
    //                 this.savedNotes = geopadList;
    //               } else {
    //                 const geopadList = [];
    //                 const fileList = [];
    //                 let siteDataToDrawOnMap = null;

    //                 result.forEach(geopad => {
    //                   // geopadList.push(geopad.observationInstance);
    //                   geopad.observationInstance.filesList = geopad.observationItemList;
    //                   console.log('>>>>>> ', geopad.observationItemList);
    //                   console.log('<<<<<< ', geopad.observationInstance.filesList);
    //                   if  (currentSiteData.latitudeLongitude.toString() ===
    //                     geopad.observationInstance.latitudeLongitude.toString()) {
    //                       siteDataToDrawOnMap = geopad.observationInstance;
    //                   }
    //                   geopad.observationInstance.selected = false;
    //                   geopadList.push(geopad.observationInstance);
    //                 });

    //                 console.log('observationItemList added to site as filesList', geopadList);
    //                 geopadList.sort((a, b) => {
    //                   const customFieldA = a.locationName;
    //                   const customFieldB = b.locationName;
    //                   return (customFieldA < customFieldB) ? -1 : (customFieldA > customFieldB) ? 1 : 0;
    //                 });
    //                 this.savedNotes = geopadList;
    //                 // TO DRAW RECENTLY ADDED SITE ON MAP
    //                 if (this.commonService.isValid(siteDataToDrawOnMap)) {
    //                   console.log('TO DRAW RECENTLY ADDED SITE ON MAP');
    //                   this.showOrCloseLocationOnMap(siteDataToDrawOnMap);
    //                 }
    //                 // if (this.viewMode.mode === this.captureModes.AWARENESS) {
    //                 //   this.showAllLocationsForAwareness();
    //                 // } else {
    //                 //   this.closeAllMarkersAndPolygons();
    //                 // }
    //               }
    //             },
    //             error => {
    //               console.log('Error while getting saved notes');
    //               console.log(error);
    //               const geopadList = [];
    //               this.savedNotes = geopadList;
    //             });
    this.showNotesAndFilePicker = false;
    this.resetAll();
  }
  removeCurrentFeature(): any {
    this.notePadService.removeFeatureOnMap(this.currentFeature);
  }

  showSavingStatusFun(event): any {
    this.showSavingStatus = event;
  }
  getDefaultGeobase(): void {
    console.log('checking the default session or not condition');
    this.savedNotes = [];
    let sessionId = 0;
    let isDefault = true;
    if (this.sessionId > 0) {
      sessionId = this.sessionId;
      isDefault = false;
    }
    console.log('is default session or opened new session?? ', this.sessionId, sessionId, isDefault);
    this.geobaseService.getGeobase(sessionId, isDefault)
          .subscribe(geobaseInfo => {
            console.log('Got geobaseInfo info');
            console.log(geobaseInfo);
            if (!this.commonService.isValid(geobaseInfo)) {
              console.log('No geobaseInfo present');
            } else {
              console.log('geobaseInfo present', geobaseInfo, geobaseInfo.sessionId, geobaseInfo.towerId);
              this.currentSession = geobaseInfo;
              this.getProjectsList();
              let geopadId = this.currentSession.geopadId;
              if (this.currentSession.geopadId === null) {
                geopadId = 0;
              }
            }
          }, error => {
            console.log('Error while getting workspace');
            console.log(error);
            if (error.errorCode === 500) {
            }
          });
  }

  // getSitesListWithItems(geopadId): any {
  //   this.notePadService.getSitesListWithItems(geopadId)
  //               .subscribe(result => {
  //                 console.log('Got saved notes');
  //                 console.log(result);
  //                 // this.savedNotes = result;
  //                 if (!this.commonService.isValid(result)) {
  //                   console.log('No geobaseList present in filter');
  //                 } else {
  //                   const geopadList = [];
  //                   const fileList = [];
  //                   result.forEach(geopad => {
  //                     // geopadList.push(geopad.observationInstance);
  //                     geopad.observationInstance.filesList = geopad.observationItemList;
  //                     geopad.observationInstance.selected = false;
  //                     console.log('new object added filesList on fly ', geopad.observationInstance.filesList);
  //                     geopadList.push(geopad.observationInstance);
  //                   });
  //                   console.log('observationItemList added to site as filesList', geopadList);
  //                   geopadList.sort((a, b) => {
  //                     const customFieldA = a.locationName;
  //                     const customFieldB = b.locationName;
  //                     return (customFieldA < customFieldB) ? -1 : (customFieldA > customFieldB) ? 1 : 0;
  //                   });
  //                   this.savedNotes = geopadList;
  //                   if (this.viewMode.mode === this.captureModes.AWARENESS) {
  //                     this.showAllLocationsForAwareness();
  //                   } else {
  //                     this.closeAllMarkersAndPolygons();
  //                   }
  //                 }
  //               },
  //               error => {
  //                 console.log('Error while getting saved notes');
  //                 console.log(error);
  //               });
  // }

  getProjectsList(): any {
    console.log('getting the projects list');
    this.projectSelect.disable();
    this.placeSelect.disable();
    this.topicSelect.disable();
    this.placesDataCollected = false;
    this.topicsDataCollected = false;
    this.projectsDataCollected = false;
    this.getPlacesListByProjectId(1);
    this.getTopicsListByPlaceId(1);
    this.topicsService.getProjectsList(this.globalObject.pageType === 'COVID19' ? 'COVID19' : this.userInfo.type,
                                        this.globalObject.geobase.organizationId)
    .subscribe(projectInfo => {
      this.projectSelect.enable();
      console.log('Got projectInfo info', projectInfo);
      if (!this.commonService.isValid(projectInfo)) {
        console.log('No projectInfo present');
        this.projects = [{name: 'All Projects', topicId: 0}];
        // this.getPlacesListByProjectId(1);
        this.selectedProject = this.projects[0];
        this.projectsDataCollected = true;
        setTimeout(() => {
          this.setDataToFormControl(this.projectSelect, this.selectedProject, this.projects);
        }, 500);
      } else {
        console.log('projectInfo present', projectInfo);
        // if (projectInfo.length > this.projects.length) {
        console.log('SOME CHANGE IN PROJECTS');
        this.projects = [{name: 'All Projects', topicId: 0}].concat(projectInfo);
        // this.projects.push({name: 'All', topicId: 'ALL'});
        if (this.commonService.isValid(this.selectedProjectId) && this.selectedProjectId > 0) {
          const index = this.projects.findIndex(val => Number(val.topicId) === Number(this.selectedProjectId));
          if (index !== -1){
            this.selectedProject = this.projects[index];
          }
          console.log('SELECTED PROJECT : ', this.selectedProject);
        }
        this.projectsDataCollected = true;
        setTimeout(() => {
          this.setDataToFormControl(this.projectSelect, this.selectedProject, this.projects);
        }, 500);
        // } else {
        //   console.log('NO CHANGE IN PROJECTS');
        // }
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
    if (this.globalObject.pageType !== 'COVID19'){
       // this.topicsService.getPlacesListByProjectId(projectId)
       this.topicsService.getTopicsListByTopicType('place')
       .subscribe(placesInfo => {
         this.placeSelect.enable();
         console.log('Got placesInfo info', placesInfo);
         if (!this.commonService.isValid(placesInfo)) {
          console.log('No placesInfo present');
          this.places = [{name: 'All Places', topicId: 0}];
          this.selectedPlace = this.places[0];
          this.placesDataCollected = true;
          setTimeout(() => {
            this.setDataToFormControl(this.placeSelect, this.selectedPlace, this.places);
          }, 500);
          //  this.places = [{
          //   name: 'Southern California',
          //   topicId: 7
          // }];
         } else {
          console.log('placesInfo present', placesInfo);
          this.places = placesInfo;
          this.places = [{name: 'All Places', topicId: 0}].concat(placesInfo);

          if (this.commonService.isValid(this.selectedPlaceId) && this.selectedPlaceId > 0) {
            const placeIndex = this.places.findIndex(val => String(val.topicId) === String(this.selectedPlaceId));
            console.log(`Place index : ${placeIndex}`);
            if (placeIndex !== -1){
              this.selectedPlace = this.places[placeIndex];
            }
          }
      /* this.places = [{
        name: 'Southern California',
        topicId: 7
      }]; */
          // this.selectedPlaceId = null;
          this.placesDataCollected = true;
          setTimeout(() => {
            this.setDataToFormControl(this.placeSelect, this.selectedPlace, this.places);
          }, 500);

      // TO GET SITE ITEMS OF PROJECT
      // try{
      //   this.getSitesListWithItemsFilterByProjectId(this.globalObject.geobase.geopadId, projectId);
      // } catch (e){
      //   console.log(e);
      // }

      //     // this.getTopicsListByPlaceId(placesInfo[0].topicId);
      //     // this.placeId = placesInfo[0].topicId;
         }

       }, error => {
         console.log('Error while getting placesInfo');
         console.log(error);
         if (error.errorCode === 500) {
         }
         this.placeSelect.enable();
       });
    } else {
      this.places = [{
        createdDate: null,
        description: 'Place is world wide',
        name: 'world-wide',
        organizationId: 5,
        parentTopicId: 994,
        status: 'Active',
        topicId: 1010,
        topicUsage: 1,
        updatedDate: null,
      }];
      this.selectedPlaceId = null;
      setTimeout(() => {
        this.setDataToFormControl(this.placeSelect, this.selectedPlace, this.places);
      }, 500);
    }
  }

  getTopicsListByPlaceId(placeId): any {
    console.log('getting the topics list', placeId);
    this.topicSelect.disable();
    if (this.globalObject.pageType !== 'COVID19'){
       // this.topicsService.getTopicsListByPlaceId(placeId)
       this.topicsService.getTopicsListByTopicType('topic')
       .subscribe(topicsInfo => {
          this.topicSelect.enable();
          console.log('Got topicsInfo info', topicsInfo);
          if (!this.commonService.isValid(topicsInfo)) {
            console.log('No topicsInfo present');
            this.topics = [{name: 'All Topics', topicId: 0}];
            this.selectedTopic = this.topics[0];
            this.topicsDataCollected = true;
            setTimeout(() => {
              this.setDataToFormControl(this.topicSelect, this.selectedTopic, this.topics);
            }, 500);
            //  this.topics = [{
            //   name: 'Geo-Engineering',
            //   topicId: 3
            // }];
          } else {
            console.log('topicsInfo present', topicsInfo);
            this.topics = topicsInfo;
            this.topics = [{name: 'All Topics', topicId: 0}].concat(topicsInfo);

            if (this.commonService.isValid(this.selectedTopicId) && this.selectedTopicId > 0) {
              const topicIndex = this.topics.findIndex(val => String(val.topicId) === String(this.selectedTopicId));
              console.log(`Topic index : ${topicIndex}`);
              if (topicIndex !== -1){
                this.selectedTopic = this.topics[topicIndex];
              }
            }

        /* this.topics = [{
            name: 'Geo-Engineering',
            topicId: 3
          }]; */
            // this.selectedTopicId = null;
            this.topicsDataCollected = true;
            setTimeout(() => {
              this.setDataToFormControl(this.topicSelect, this.selectedTopic, this.topics);
            }, 500);
        //     // this.topicId = topicsInfo[0].topicId;
          }
      }, error => {
         console.log('Error while getting topicsInfo');
         console.log(error);
         if (error.errorCode === 500) {
         }
         this.topicSelect.enable();
       });
    } else {
      this.topicsService.getTopicsListByPlaceId(placeId)
            .subscribe(topicsInfo => {
              this.topicSelect.enable();
              console.log('Got topicsInfo info', topicsInfo);
              if (!this.commonService.isValid(topicsInfo)) {
                console.log('No topicsInfo present');
              } else {
                console.log('topicsInfo present', topicsInfo);
                this.topics = [{ name: 'All Topics', topicId: 'ALL' }].concat(topicsInfo);
                // this.topics.push({ name: 'All', topicId: 'ALL' });
                // if (String(this.selectedProjectId) === 'ALL') {
                //   this.selectedTopicId = 'ALL';
                // } else{
                this.selectedTopicId = null;
                // }
                setTimeout(() => {
                  this.setDataToFormControl(this.topicSelect, this.selectedTopic, this.topics);
                }, 500);
                  // this.topicId = topicsInfo[0].topicId;
              }
            }, error => {
              console.log('Error while getting topicsInfo');
              console.log(error);
              if (error.errorCode === 500) {
              }
              this.topicSelect.enable();
            });
    }
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

  showAllLocationsForAwareness(): void{
    console.log('In showAllLocationsForAwareness');
    this.savedNotes.forEach(element => {
      console.log(element);
      // if (element.locationData.length > 0) {
      //   this.notePadService.closeMarker(element.time);
      // }
      this.showOrCloseLocationOnMap(element, 'awareness');
    });
    if (this.viewMode.mode === this.captureModes.AWARENESS){
      this.basemapService.getCurrentBasemap().getView().setZoom(2);
    }
  }

  showOrCloseLocationOnMap(note: any, operation = '', zoomToSite = true): any {
    // console.log('In showLocationOnMap');
    // console.log(note);
    let geometryData: any;
    let isPolygon = false;

    const siteParams = note.siteParams;

    const currentContextInfo: any = {};
    for (const key in this.currentContextInfo) {
      if (Object.hasOwnProperty.call(this.currentContextInfo, key)) {
        currentContextInfo[key] = this.currentContextInfo[key];
      }
    }
    currentContextInfo.site = note;

    if (note.latitudeLongitude.length === 2) {
      geometryData = {
        type: this.notePadService.shapeDrawType.POINT, // 'Point',
        coordinates: [Number(note.latitudeLongitude[0]), Number(note.latitudeLongitude[1])]
      };
    } else if (note.latitudeLongitude.length > 2) {
      if (note.latitudeLongitude.length > 4) {
        // console.log(`LAT : ${note.latitudeLongitude[0]} === ${note.latitudeLongitude[note.latitudeLongitude.length - 2]} `);
        // console.log(`LONG : ${note.latitudeLongitude[1]} === ${note.latitudeLongitude[note.latitudeLongitude.length - 1]} `);
        if (note.latitudeLongitude[0] === note.latitudeLongitude[note.latitudeLongitude.length - 2] &&
            note.latitudeLongitude[1] === note.latitudeLongitude[note.latitudeLongitude.length - 1]) {
            isPolygon = true;
        }
      }
      geometryData = {
        type: isPolygon ? this.notePadService.shapeDrawType.POLYGON : this.notePadService.shapeDrawType.LINE_STRING,
        coordinates: []
      };
      let i = 0;
      const coOrds = [];
      while ( i < note.latitudeLongitude.length ) {
        try{
          const tempArray = [Number(note.latitudeLongitude[i]), Number(note.latitudeLongitude[i + 1])];
          coOrds.push(tempArray);
        } catch (e) {
          console.log(e);
        }
        i = i + 2;
      }
      geometryData.coordinates = isPolygon ? [coOrds] : coOrds;

    }
    const id = this.commonService.isValid(note.observationInstanceId) ? note.observationInstanceId :
              this.tempCreateSiteId; // note.latitudeLongitude.toString();
    // console.log('what is this.currentContextInfo ', this.currentContextInfo);
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: {'' : note.description + '\n' + new Date(note.uiTimestamp).toLocaleString()}
        }]
      },
      name: this.commonService.isValid(note.observationInstanceId) ? `${note.locationName}_${id}` :
                              `observationInstanceId_${id}`
    };

    let layerFound = false;
    let addedLayerObj: any;
    this.basemap.getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        if (layerObj.values_.name === data.name) {
          // this.basemap.removeLayer(layerObj);
          layerFound = true;
          addedLayerObj = layerObj;
        }
      }
    });
    let visible = false;
    if (layerFound) {
      console.log('REMOVING POINT OR POLYGON');
      // this.basemap.removeLayer(addedLayerObj);
      this.notePadService.removeLayerFromMap(this.basemap, data.name);
      visible = false;
    } else if (operation === '' || operation === 'awareness') {
      // ONLY OF OPERATION is '', IT SHOULD WORK IN TOGGLE MODE
      if (note.latitudeLongitude.length === 2) {
        console.log('ADDING POINT');
        this.notePadService.reDrawPointOrPolygonOnMap(this.notePadService.shapeDrawType.POINT,
                                                    data, operation !== 'awareness' && zoomToSite, null, currentContextInfo, siteParams);
        visible = true;
      } else if (note.latitudeLongitude.length > 2) {
        console.log('ADDING POLYGON');
        // this.notePadService.reDrawPolygonInMap(data, true);

        // LINE or PLOYGON is ok here.
        this.notePadService.reDrawPointOrPolygonOnMap(
                              isPolygon ? this.notePadService.shapeDrawType.POLYGON : this.notePadService.shapeDrawType.LINE_STRING,
                              data, operation !== 'awareness' && zoomToSite, null, currentContextInfo, siteParams);
        visible = true;
      }
    }

    const siteIndex = this.savedNotes.findIndex(site => site.observationInstanceId === note.observationInstanceId);
    if (siteIndex !== -1) {
      this.savedNotes[siteIndex].visible = visible;
    }
    // console.log(data);
  }

  viewSiteDetails(note): void{
    console.log('IN viewSiteDetails');
    console.log(note, note.visible);

    const tempNote: any = {};
    for (const key in note) {
      if (note.hasOwnProperty(key)) {
        tempNote[key] = note[key];
      }
    }
    this.selectedNote = tempNote;
    console.log(this);
    console.log(this.selectedNote);
    this.showOrCloseLocationOnMap(note, 'close');

    // this.selectedNote = note;

    this.operation = 'view';
    this.data = 'images';
    // this.locationData = [note.latitude, note.longitude];
    this.showNotesAndFilePicker = true;
  }

  // getSitesListWithItemsFilterByProjectId(geopadId, projectId): any {
  //   console.log('IN getSitesListWithItemsFilterByProjectId');
  //   this.notePadService.getSitesListWithItemsByProjectId(geopadId, projectId)
  //               .subscribe(result => {
  //                 console.log('Got saved notes');
  //                 console.log(result);
  //                 // this.savedNotes = result;
  //                 if (!this.commonService.isValid(result)) {
  //                   console.log('No geobaseList present in filter');
  //                   const geopadList = [];
  //                   const fileList = [];
  //                   this.savedNotes = geopadList;
  //                 } else {
  //                   const geopadList = [];
  //                   const fileList = [];
  //                   result.forEach(geopad => {
  //                     // geopadList.push(geopad.observationInstance);
  //                     geopad.observationInstance.filesList = geopad.observationItemList;
  //                     geopad.observationInstance.selected = false;
  //                     console.log('new object added filesList on fly ', geopad.observationInstance.filesList);
  //                     geopadList.push(geopad.observationInstance);
  //                   });
  //                   console.log('observationItemList added to site as filesList', geopadList);
  //                   geopadList.sort((a, b) => {
  //                     const customFieldA = a.locationName;
  //                     const customFieldB = b.locationName;
  //                     return (customFieldA < customFieldB) ? -1 : (customFieldA > customFieldB) ? 1 : 0;
  //                   });
  //                   this.savedNotes = geopadList;
  //                   if (this.viewMode.mode === this.captureModes.AWARENESS) {
  //                     this.showAllLocationsForAwareness();
  //                   } else {
  //                     this.closeAllMarkersAndPolygons();
  //                   }
  //                 }
  //               },
  //               error => {
  //                 console.log('Error while getting saved notes');
  //                 console.log(error);
  //                 const geopadList = [];
  //                 this.savedNotes = geopadList;
  //               });
  // }

  getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(geopadId, projectId, placeId, topicId,
                                                          currentSiteData: any = {}, isGuest = false): any {
    // this.notePadService.getSitesListWithItemsByProjectId(geopadId, projectId)
    console.log('IN getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId');
    if (this.commonService.isValid(projectId) && this.commonService.isValid(placeId) &&
        this.commonService.isValid(topicId)) {
      this.sitesDataCollected = false;
      this.closeAllMarkersAndPolygons();
      this.savedNotes = [];
      console.log('ALLOWED');
      let lastNoOfDays = 0;
      if (this.globalObject.pageType === 'COVID19'){
        lastNoOfDays = this.oldDataRangeSelect.value;
      }
      // this.notePadService.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(geopadId,
      //       projectId, placeId, topicId, isGuest, lastNoOfDays)
      this.notePadService.getAllSitesMatchedWithString(this.globalObject.geobase.sessionId,
                    geopadId, projectId, placeId, topicId,
                    this.searchName, this.searchSiteType, isGuest, lastNoOfDays)
                .subscribe(result => {
                  console.log('Got saved notes', this.currentSession.showAllSites, this.globalObject.pageType);
                  console.log(result);
                  // this.savedNotes = result;
                  this.mapSiteResponseToSites(result.body);

                  if (this.globalObject.pageType === 'share') {
                    this.currentSession.showAllSites = true;
                  }
                  // SHOWING ALL SITES ON SESSION CHANGE.
                  if (this.currentSession.showAllSites){
                    this.savedNotes.forEach(element => {
                      element.selected = true;
                      this.showOrCloseLocationOnMap(element, '', false);
                    });
                    this.selectAllSitesCheckbox._inputElement.nativeElement.click();
                    this.selectedSitesBBox();
                  } else {
                    const index = this.savedNotes.findIndex(val => String(val.observationInstanceId) ===
                                                                String(currentSiteData.observationInstanceId) ||
                        String(currentSiteData.latitudeLongitude).toString() === val.latitudeLongitude.toString() );
                    if (index !== -1) {
                      console.log('TO DRAW RECENTLY ADDED/ UPDATED SITE ON MAP');
                      this.showOrCloseLocationOnMap(this.savedNotes[index]);
                    }
                  }
                  // ALL ZOOM IN/OUT TO VIEW ALL SITES.

                  this.sitesDataCollected = true;
                },
                error => {
                  console.log('Error while getting saved notes');
                  console.log(error);
                  const geopadList = [];
                  this.savedNotes = geopadList;
                });
    }
  }

  getCurrentContextSites(): void{
    console.log('GETTING CURRENT CONTEXT SITES');
    this.getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(this.globalObject.geobase.geopadId,
      this.projectSelect.value, this.placeSelect.value, this.topicSelect.value);
  }
  resetSearchSiteBox(): void{
    try{
      if (this.siteSearchInput.nativeElement.value.length > 0) {
        this.siteSearchInput.nativeElement.value = '';
        this.searchSiteType = SiteType.ALL;
        this.siteSearchObserver.next({});
      }
    } catch (e){
      console.log(e);
    }
  }

  setSelectedSiteType(siteType: SiteType): void{
    this.searchSiteType = siteType;
    this.siteSearchObserver.next({key: this.searchName, type: this.searchSiteType });
    this.sitesDataCollected = false;
    this.notePadService.getAllSitesMatchedWithString(this.globalObject.geobase.sessionId, this.globalObject.geobase.geopadId,
            this.projectSelect.value, this.placeSelect.value, this.topicSelect.value, this.searchName, this.searchSiteType)
          .subscribe((data: any) => {
            console.log(data);
            this.mapSiteResponseToSites(data.body);
            this.sitesDataCollected = true;
          }, error => {
            console.log('ERROR');
            console.log(error);
          });
  }
  onSiteSearchChanged(event): void{
    console.log('In onSiteSearchChanged');
    console.log('Name', event);
    const searchKey = event.target.value;
    console.log(searchKey);
    if (this.commonService.isValid(searchKey)) {
      console.log('VALID');
      if (searchKey.length > 1){
        console.log(searchKey.length);
        this.searchName = searchKey;
        this.closeAllMarkersAndPolygons();
        this.savedNotes = [];
        this.siteSearchObserver.next({key: searchKey, type: this.searchSiteType});
      } else if (searchKey.length <= 1){
        console.log('LESS : ', searchKey.length);
        this.searchName = '';
        this.siteSearchObserver.next({});
        // this.displayErrorMsg = true;
        // this.dataLoaded = true;
      }
    } else{
      console.log('NOT VALID');
      this.searchName = '';
      this.getCurrentContextSites();
      this.siteSearchObserver.next({});
    }
  }

  monitorChangesInSiteSearch(): void{
    this.siteSearchObserver.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(searchObj => {
        console.log(searchObj);
        const searchKey = searchObj.key;
        const searchSiteType = searchObj.type;
        if (this.commonService.isValid(searchKey)) {
          this.sitesDataCollected = false;
          return this.notePadService.getAllSitesMatchedWithString(this.globalObject.geobase.sessionId,
                                      this.globalObject.geobase.geopadId,
                                      this.projectSelect.value, this.placeSelect.value, this.topicSelect.value,
                                      searchKey, searchSiteType);
        } else {
          return [];
        }
      })
    ).subscribe((data: any) => {
        console.log(data);
        this.mapSiteResponseToSites(data.body);
        this.sitesDataCollected = true;
    }, error => {
      console.log('ERROR');
      console.log(error);
    });
  }

  mapSiteResponseToSites(result, currentSiteData: any = {}): void{
    console.log('IN mapSiteResponseToSites');
    console.log(result, currentSiteData);
    if (!this.commonService.isValid(result)) {
      console.log('No geobaseList present in filter');
      const geopadList = [];
      const fileList = [];
      this.savedNotes = geopadList;
    } else { // if (this.projectSelect.value === projectId && this.placeSelect.value === placeId &&
              // this.topicSelect.value === topicId) {
      const geopadList = [];
      const fileList = [];
      // let siteDataToDrawOnMap = null;
      result.forEach(geopad => {
        // geopadList.push(geopad.observationInstance);
        geopad.observationInstance.filesList = geopad.observationItemList;
        geopad.observationInstance.selected = false;
        geopad.observationInstance.showMoreOptions = false;
        geopad.observationInstance.isExpanded = false;
        geopad.observationInstance.visible = false;

        const note = geopad.observationInstance;
        let type = '';
        if (note.latitudeLongitude.length === 2) {
          type = this.notePadService.shapeDrawType.POINT;
        } else if (note.latitudeLongitude.length > 2) {
          let isPolygon = false;
          if (note.latitudeLongitude.length > 4) {
            // console.log(`LAT : ${note.latitudeLongitude[0]} === ${note.latitudeLongitude[note.latitudeLongitude.length - 2]} `);
            // console.log(`LONG : ${note.latitudeLongitude[1]} === ${note.latitudeLongitude[note.latitudeLongitude.length - 1]} `);
            if (note.latitudeLongitude[0] === note.latitudeLongitude[note.latitudeLongitude.length - 2] &&
                note.latitudeLongitude[1] === note.latitudeLongitude[note.latitudeLongitude.length - 1]) {
                isPolygon = true;
            }
          }
          type = isPolygon ? this.notePadService.shapeDrawType.POLYGON : this.notePadService.shapeDrawType.LINE_STRING;
        }
        geopad.observationInstance.siteType = type;
        // console.log('new object added filesList on fly ', geopad.observationInstance.filesList);
        const observationInstanceTopics: any[] = geopad.observationInstanceTopics || [];
        observationInstanceTopics.forEach(element => {
          // console.log(element);
          // geopad.observationInstance[element.type] = {
          //   name: element.name,
          //   topicId: element.topicId,
          //   description: element.description
          // };
          if (element.type === 'project'){
            geopad.observationInstance.project = {
              name: element.name,
              topicId: element.topicId,
              description: element.description
            };
          } else if (element.type === 'place'){
            geopad.observationInstance.place = {
              name: element.name,
              topicId: element.topicId,
              description: element.description
            };
          } else if (element.type === 'topic'){
            geopad.observationInstance.topic = {
              name: element.name,
              topicId: element.topicId,
              description: element.description
            };
          }
        });
        // if  (String(currentSiteData.latitudeLongitude).toString() ===
        //   geopad.observationInstance.latitudeLongitude.toString()) {
        //     siteDataToDrawOnMap = geopad.observationInstance;
        // }
        const observationInstanceIcons = geopad.observationInstanceIcons;
        let iconObj = {};
        if (this.commonService.isValid(observationInstanceIcons)) {
          iconObj = { name: observationInstanceIcons.name, imgUrl: observationInstanceIcons.url,
            value: observationInstanceIcons.iconType, id: note.observationInstanceIconsId,
            iconCategory: observationInstanceIcons.iconCategory, iconSubCategory: observationInstanceIcons.iconSubCategory,
            iconType: observationInstanceIcons.iconType};
        }
        const siteParams = new SiteParams( iconObj,
          note.iconColour, note.iconLineSize, note.iconRotation,
          '', note.fillColour, note.siteType);
        geopad.observationInstance.siteParams = siteParams;
        geopadList.push(geopad.observationInstance);
      });
      console.log('observationItemList added to site as filesList 1', geopadList);
      geopadList.sort((a, b) => {
        const customFieldA = new Date(a.uiTimestamp) ; // a.locationName;
        const customFieldB = new Date(b.uiTimestamp); // b.locationName;
        return (customFieldA > customFieldB) ? -1 : (customFieldA < customFieldB) ? 1 : 0;
      });
      this.savedNotes = geopadList;
      console.log(this.savedNotes, this.viewMode.mode, this.captureModes.AWARENESS);
      if (this.viewMode.mode === this.captureModes.AWARENESS || this.globalObject.pageType === 'COVID19') {
        this.showAllLocationsForAwareness();
      } else {
        this.closeAllMarkersAndPolygons();
        // if (this.commonService.isValid(siteDataToDrawOnMap)) {
        //   console.log('TO DRAW RECENTLY ADDED SITE ON MAP');
        //   this.showOrCloseLocationOnMap(siteDataToDrawOnMap);
        // }
        // Here New Code calling for BBox for all site
        // this.selectedSitesBBox(this.savedNotes);
      }
    }
  }
  toggleAllSitesSelection(event: MatCheckboxChange): void{
    console.log(event);
    const checked = event.checked;
    console.log(checked);
    this.savedNotes.forEach(note => {
      note.selected = checked;
    });
  }
  checkIsAllSitesSelected(note, event: MatCheckboxChange): void{
    console.log(event);
    note.selected = event.checked;
    let allSelected = true;
    this.savedNotes.forEach(localNote => {
      if (!localNote.selected){
        allSelected = false;
      }
    });
    if (allSelected){
      this.selectAllSitesCheckbox.checked = true;
    } else {
      this.selectAllSitesCheckbox.checked = false;
    }
  }

  isValidProject(): boolean{
    if (this.commonService.isValid(this.projectSelect.value) && this.projectSelect.value !== 'ALL'){
      return true;
    } else {
      return false;
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
  toggleAllLayersSelection(event: MatCheckboxChange): void{
    console.log(event);
    const checked = event.checked;
    console.log(checked);
    this.geoTowerList.forEach(layer => {
      layer.selected = checked;
    });
  }
  checkIsAllLayersSelected(layer, event: MatCheckboxChange): void{
    layer.selected = event.checked;
    let allSelected = true;
    this.geoTowerList.forEach(innerLayer => {
      if (!innerLayer.selected){
        allSelected = false;
      }
    });
    if (allSelected){
      this.selectAllLayersCheckbox.checked = true;
    } else {
      this.selectAllLayersCheckbox.checked = false;
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

  saveSession(): void{
    // this.copySelected = false;
    // this.showSessionOverrideAlert = true;
    if (this.commonService.isValid(this.sessionNameInput.value)){
      this.geobaseService.isGeobaseExist(this.sessionNameInput.value)
            .subscribe(result => {
              console.log('GOT RESPONSE FOR IS GEOBASE EXIST');
              console.log(result);
              if (result){
                console.log('SESSION ALREADY EXIST');
                this.showSessionOverrideAlert = true;
                // this.errorMsg = 'Session name already exists. Please choose a different session name.';
              } else{
                console.log('SESSION NOT EXIST. CONTINUE..');
                this.saveAsNewSession();
                this.copySelected = false;
              }
            },
            error => {
              console.log('ERROR WHILE CHECKING IS GEOBASE EXIST');
              console.log(error);
              this.copySelected = false;
            });
    }
  }

  closeSessionEmailShare(): void{
    this.selectedSessionSharingOption =  this.sessionShareOptionEnum.UNKNOWN;
  }

  closeSessionUrl(): void{
    this.selectedSessionSharingOption =  this.sessionShareOptionEnum.UNKNOWN;
  }

  close(): void{
    this.copySelected = false;
    console.log(this.selectedSessionSharingOption);
    this.selectedSessionSharingOption =  this.sessionShareOptionEnum.UNKNOWN;
    console.log(this.selectedSessionSharingOption);
  }

  selectSharingOption(option: SessionSharingOption): void{
    const sitesCount = this.getCountOfSelectedSites();
    const layersCount = this.getCountOfSelectedLayers();

    if (option === this.sessionShareOptionEnum.DOWNLOAD && sitesCount > 0) {
      console.log('its downloading API calling.. ', this.savedNotes);
      let isSelected =  false;
      const selectedNotesIds = [];
      if (this.savedNotes.length !== 0) {
        this.savedNotes.forEach(note => {
          if (note.selected) {
            isSelected = true;
            selectedNotesIds.push(note.observationInstanceId);
          }
        });
        if (isSelected) {
          console.log('inside download calling donwload API', selectedNotesIds);
          this.geobaseService.getGeobaseDownload(this.sessionId, this.currentSession.geopadId, selectedNotesIds);
          /* .subscribe((result) => {
            console.log('download results ', result);
            console.log(JsonToXML.parse("kml", result));
          }); */
        }
      }
      return;

    } else if (option === this.sessionShareOptionEnum.DOWNLOAD) {
      console.log('No data to convert and download. Please select layers or sites to export');
      // this.errorMsg = 'No data to convert and download. Please select layers or sites to export';
      this.showError('No data to convert and download. Please select layers or sites to export');
      return;
    }
    if (this.selectedSessionId !== 'running' && this.selectedSessionId !== ''){
      this.saveSessionOptionSelectedFrom = option;
      if (sitesCount === 0 && layersCount === 0){
        this.showSessionShareAlert = true;
        return;
      }
      this.selectedSessionSharingOption = option;
      console.log(this.saveSessionOptionSelectedFrom);
      console.log(this);
      if (this.selectedSessionSharingOption === this.sessionShareOptionEnum.URL){
        if (this.selectedSessionCategory === 'mySession'){
          if (this.currentSession.sessionShareList === null || this.currentSession.sessionShareList.length === 0){
            this.selectedSessionSharingOption = this.sessionShareOptionEnum.EMAIL;
          }
          else {
            this.geobaseService.getGeobasesListByType('shareByMe', this.globalObject.geobase.sessionId)
              .subscribe(geobaseList => {
              console.log('Got geobaseList info in filter', geobaseList);
              console.log(this);
              if (this.commonService.isValid(geobaseList)) {
                console.log('geobaseList present');
                if (geobaseList.body.length > 0) {
                  geobaseList.body.forEach(geobase => {
                    console.log(geobase);
                    console.log(this.selectedSessionId);
                    console.log(geobase.session.sessionId);
                    if (Number(this.selectedSessionId) === geobase.session.sessionId){
                      if (geobase.sessionShare != null) {
                        console.log(geobase.sessionShare.url);
                        if (geobase.sessionShare.url.includes(geobase.sessionShare.uuid)){
                          this.urlLink.nativeElement.value = geobase.sessionShare.url.replace('/' + geobase.sessionShare.uuid, '');
                        }
                        else{
                          this.urlLink.nativeElement.value = geobase.sessionShare.url;
                        }
                      }
                    }
                  });
                }
              }
            });
          }
        } else{
          if (this.geoSessionsList != null && this.geoSessionsList.length > 0){
            this.geoSessionsList.forEach(geobase => {
              console.log(geobase);
              console.log(this.selectedSessionId);
              console.log(geobase.sessionId);
              if (Number(this.selectedSessionId) === Number(geobase.sessionId)){
                if (geobase.sessionShare != null) {
                  console.log(geobase.sessionShare.url);
                  console.log(this);
                  setTimeout(() => {
                    if (geobase.sessionShare.url.includes(geobase.sessionShare.uuid)){
                      this.urlLink.nativeElement.value = geobase.sessionShare.url.replace('/' + geobase.sessionShare.uuid, '');
                    }
                    else{
                      this.urlLink.nativeElement.value = geobase.sessionShare.url;
                    }
                  });
                }
              }
            });
          }
        }
      }

      if ((sitesCount > 0 && sitesCount < this.savedNotes.length)
          || (layersCount > 0 && layersCount < this.geoTowerList.length)){
            console.log(sitesCount);
            console.log(layersCount);
            this.showSessionNameInput();
      }
    }
    else {
      this.saveSessionOptionSelectedFrom = option;
      this.showSessionNameInput();
    }
    this.showSessionShareMenu = false;
  }
  // showEmailShare(): void{
  //   if (this.shareSessionToEmail === true){
  //     this.shareSessionToEmail = false;
  //   }
  //   else { this.shareSessionToEmail = true; }
  //   this.copySessionUrl = false;
  // }

  // showSessionUrl(): void{
  //   if (this.copySessionUrl === true){
  //     this.copySessionUrl = false;
  //   }
  //   else { this.copySessionUrl = true; }
  //   this.shareSessionToEmail = false;
  // }

  // downloadSession(): void{

  // }

  getCountOfSelectedSites(): any{
    let sitesCount = 0;
    if (this.savedNotes.length !== 0){
      this.savedNotes.forEach(note => {
        console.log(note.selected);
        if (note.selected){
          sitesCount++;
        }
      });
    }
    return sitesCount;
  }

  getCountOfSelectedLayers(): any{
    let layersCount = 0;
    if (this.geoTowerList.length !== 0){
      this.geoTowerList.forEach(layer => {
        if (layer.selected){
          layersCount++;
        }
      });
    }
    return layersCount;
  }

  getUserEmailsListByOrg(): any {
    this.geobaseService.getUserEmailsListByOrg(this.userInfo.type).subscribe(emailsList => {
      console.log('org have emails list ', emailsList, this.userInfo.type, this.currentSession);
      if (this.commonService.isValid(emailsList) && this.userInfo.type !== 'INDEPENDENT'){
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
    if (this.userEmailListString !== ''){
      this.userEmailListString = this.userEmailListString + email + ',';
    } else {
      this.userEmailListString = email + ',';
    }
    this.userEmail.setValue(this.userEmailListString);
    this.orgUserEmailsToShow = [];
  }

  onUserEmailType(event): void{
    // console.log('onUserEmailType');
    // console.log(event);
    console.log(this.userEmailListString);
    const val: string = event.target.value;
    console.log(val);
    let newVal = [];
    if (val.includes(',')){
      newVal = val.split(',');
      console.log(val);
      console.log(newVal);
      console.log(this.userEmailListString);
      console.log(newVal[newVal.length - 1]);
      console.log(newVal.length);
    }
    else { newVal.push(val); }
    if (this.commonService.isValid(val)){
      // this.orgUserEmailsToShow = this.allUserOrOrgEmails;
      this.orgUserEmailsToShow = this.allUserOrOrgEmails.filter(email => {
        return email.indexOf(newVal[newVal.length - 1].toLowerCase()) !== -1;
      });
    } else {
      // this.resetOrgUsers();
      this.orgUserEmailsToShow = this.allUserOrOrgEmails;
    }
  }

  onRemoveFocusOfUserEmail(event): void{
    // console.log('In onRemoveFocusOfUserEmail');
    // console.log(event);
    // console.log(event.target.value);
    setTimeout(() => {
      this.resetOrgUsers();
    }, 500);
  }

  resetOrgUsers(): void{
    this.orgUserEmailsToShow = [];
  }

  shareSession(): any {
    console.log('IN SHARE SESSION');
    this.errorMsg = '';
    let errorsFound = false;
    this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
    // const saveTypeVal = this.saveTypeSelectCtrl.nativeElement.value;
    this.resetOrgUsers();
    console.log(this.userEmailListString);
    console.log(this.userEmail.value);
    try{
      if (this.userEmail.value !== ''){
        const userEmails = this.userEmail.value.split(',');
        console.log(userEmails);
        if (userEmails.length !== 0){
          for (let i = 0; i < userEmails.length; i++){
            console.log(userEmails[i]);
            this.tempUserEmailFormControl = new FormControl(userEmails[i], Validators.email);
            if (this.commonService.isValid(userEmails[i])){
              if (this.globalObject.pageType === 'share') {
                throw new Error('Shared Session was not allowed to Share session');
              }
              // if (!this.commonService.isValid(userEmails[i])){
              //     throw new Error('Please enter mail to share session');
              //   }
              if (!this.tempUserEmailFormControl.valid){
                throw new Error('Please add or select a valid Email ID');
              }
              if (this.userInfo.type === 'ORG'){
                const userIndex = this.allUserOrOrgEmails.findIndex(email => email === userEmails[i]);
                if (userIndex === -1){
                  throw new Error('Cannot share with a user/email not connected with this organization.');
                }
              } else if (this.userInfo.type === 'INDEPENDENT'){
                const userIndex = this.allUserOrOrgEmails.findIndex(email => email === userEmails[i]);
                if (userIndex !== -1){
                  throw new Error('Email belongs to other organization. Please choose another.');
                }
              }
            }
          }
        }
      }
      else { throw new Error('Please add or select a valid Email ID'); }
    } catch (e) {
      errorsFound = true;
      console.log(e);
      // this.errorMsg = e;
      this.showError(e);
    }
    if (!errorsFound) {
      console.log('ALL GOOD.. PROCEED..');
      this.shareSessionAPI();
      // this.copySessionUrl = true;
      // this.shareSessionToEmail = false;
      this.selectedSessionSharingOption = SessionSharingOption.URL;
    }
  }

  shareSessionAPI(): any {
    console.log('share session clicked...');
    console.log('emails are entered ', this.userEmail.value);
    const emailStr = this.userEmail.value;
    const emailsArray = emailStr.split(',');
    const emailList: any[] = [];
    emailsArray.forEach(email => {
      console.log(email);
      if (this.commonService.isValid(email)){
        if (this.geoSessionsList != null && this.geoSessionsList.length > 0){
          this.geoSessionsList.forEach(geobase => {
            console.log(geobase);
            console.log(this.selectedSessionId);
            console.log(geobase.sessionId);
            if (Number(this.selectedSessionId) === Number(geobase.sessionId)){
              if (geobase.sessionShare != null) {
                if (email === geobase.sessionShare.recipientUserEmail){

                }
                else{
                  emailList.push(email);
                }
              }
              else if (geobase.sessionShareList != null && geobase.sessionShareList.length > 0){
                let count = 0;
                for (let j = 0; j < geobase.sessionShareList.length; j++){
                  if (email !== geobase.sessionShareList[j].recipientUserEmail){
                    count++;
                  }
                }
                console.log(count);
                if (count === geobase.sessionShareList.length){
                  emailList.push(email);
                }
              }
              else{
                emailList.push(email);
              }
            }
          });
        }
        console.log(emailList);

      }
    });
    console.log('final emails list are ', emailList, emailList.length);
    const uuidValue = uuid.v4();
    this.link = 'https://qa.fuse.earth/share/'
                + this.selectedSessionId;
    // this.urlLink.nativeElement.value = 'http://18.144.21.216:4200/share/'
    //         + this.defaultGeobaseInfo.sessionId + '/' + uuid.v4();
    const requestGoebaseShare = {
      userEmailList : emailList,
      url : this.link,
      uuid : uuidValue,
    };
    this.sessionShareCurrentState = this.sessionSaveStates.STARTED;
    if (emailList.length > 0){
      this.geobaseService.createGeobaseShare(requestGoebaseShare, this.selectedSessionId)
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
          this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
        }, 5000);
      });
    }
    else{
      this.selectedSessionSharingOption = SessionSharingOption.URL;
      this.sessionShareCurrentState = this.sessionSaveStates.COMPLETED;
      setTimeout(() => {
        this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
      }, 5000);
      setTimeout(() => {
        this.urlLink.nativeElement.value = this.link;
      });
    }
  }

  getGeobaseListByFilter(selectedFilter: string, autoSelect: boolean = false): any {
    if (!this.isGuest) {
      this.selectedSessionCategory = selectedFilter;
      console.log(this.saveSessionOptionSelectedFrom);
      if (this.saveSessionOptionSelectedFrom === SessionSharingOption.UNKNOWN){
        this.selectedSessionSharingOption = SessionSharingOption.UNKNOWN;
      }
      if (!autoSelect){
        this.selectedSessionId = '';
        this.saveSessionOptionSelectedFrom = SessionSharingOption.UNKNOWN;
      }
      console.log(this.saveSessionOptionSelectedFrom);
      console.log(this);
      this.getGeobaseListByFilterProcess(selectedFilter, autoSelect);
    }
  }

  getGeobaseListByFilterProcess(selectedFilter, autoSelect: boolean = false): any {
    console.log('selecting the geobase list filter ', selectedFilter);
    this.geoSessionsList = [];
    this.geoSessionDataColleced = false;
    console.log(this.globalObject.geobase.sessionId);
    this.geobaseService.getGeobasesListByType(selectedFilter, this.globalObject.geobase.sessionId)
    .subscribe(geobaseList => {
        console.log('Got geobaseList info in filter', geobaseList);
        console.log(this);
      // if (!this.commonService.isValid(geobaseList)) {
      //   console.log('No geobaseList present in filter');
      // } else {
        console.log('geobaseList present');
        console.log(geobaseList.body);
        let tempSessionsList: any[] = [];
        if (geobaseList.body.length > 0) {
          geobaseList.body.forEach(geobase => {
            let uuidValue = null;
            if (geobase.sessionShare != null) {
              uuidValue = geobase.sessionShare.uuid;
            }
            const session: any = geobase.session;
            session.id = session.sessionId;
            session.sessionId = String(session.sessionId);
            session.uuid = session.uuidValue;
            session.type = selectedFilter;
            session.showAllSites = false;
            session.sessionShare = geobase.sessionShare;
            session.sessionShareList = geobase.sessionShareList;
            tempSessionsList.push(session);
            // tempSessionsList.push({ name: geobase.session.name, id: geobase.session.sessionId,
            //   uuid: uuidValue, type: selectedFilter });
            console.log('geobaseList iterating in filter ', tempSessionsList, geobase.session);
          });
        }
        if (selectedFilter === 'mySession'){
          this.defaultSession.sessionId = String(this.defaultSession.sessionId);
          this.defaultSession.id = 'running';
          this.defaultSession.name = 'Running';
          const currentSession: any = {};
          for (const key in this.defaultSession) {
            if (this.defaultSession.hasOwnProperty(key)) {
              currentSession[key] = this.defaultSession[key];
            }
          }
          currentSession.id = 'running';
          currentSession.sessionId = String(currentSession.sessionId);
          currentSession.uuid = null;
          currentSession.type = selectedFilter;
          currentSession.name = 'Running';
          currentSession.showAllSites = false;
          tempSessionsList = [currentSession].concat(tempSessionsList);
        } else {
          tempSessionsList = [].concat(tempSessionsList);
        }
        const index = tempSessionsList.findIndex(val => {
          return String(val.sessionId) === String(this.selectedSessionId) || String(val.id) === String(this.selectedSessionId);
        });
        console.log(tempSessionsList);
        if (index !== -1){
          console.log('FOUND SELECTED SESSIONS');
          this.sessionCtrl.setValue(tempSessionsList[index].id === 'running' ? tempSessionsList[index].id :
                                    this.selectedSessionId); // (this.selectedSessionId); // (tempSessionsList[index].sessionId);
        } else if (tempSessionsList.length > 0){
          console.log('FOUND MORE SESSIONS');
          console.log(tempSessionsList[0]);
          console.log(this.selectedSessionId);
          // if (!this.commonService.isValid(this.selectedSessionId) && selectedFilter === 'mySession'){
          //   console.log('SETTING TO RUNNING');
          //   this.sessionCtrl.setValue('running');
          // } else
          if (this.commonService.isValid(this.selectedSessionId)){
            console.log('SETTING SELETED SESSION');
            this.sessionCtrl.setValue(this.selectedSessionId);
          } else {
            console.log('SETTING TO FIRST ONE');
            this.sessionCtrl.setValue(tempSessionsList[0].sessionId || tempSessionsList[0].id);
          }
        } else {
          console.log('NO SELECTED SESSION');
        }
        this.currSessionsObj = {};
        tempSessionsList.forEach(element => {
          this.currSessionsObj[element.id] = element.name;
        });
        this.geoSessionsList = tempSessionsList;
        console.log(this.geoSessionsList);
        if (this.geoSessionsList.length === 0){
          // set the error message to the error variable
          // throw new Error("No Sessions Present");
        }
      // }
        this.geoSessionDataColleced = true;
        if (this.saveSessionOptionSelectedFrom === this.sessionShareOptionEnum.URL){
          this.selectedSessionSharingOption = this.sessionShareOptionEnum.EMAIL;
        }
        else{
          this.selectedSessionSharingOption = this.saveSessionOptionSelectedFrom;
        }
        console.log(this.saveSessionOptionSelectedFrom);
        console.log(this.selectedSessionSharingOption);
        console.log(autoSelect);
        if (autoSelect && this.commonService.isValid(this.selectedSessionId)){
          this.sessionCategorySelect(this.selectedSessionId, autoSelect);
        }
    }, error => {
      console.log('Error while getting geobaseList in filter');
      console.log(error);
      console.log(error.message);
      this.geoSessionDataColleced = true;
      this.geoSessionsList = [];
      if (error.errorCode === 500) {
      }
    });
  }

  showAllGeobases(): any {
    console.log('In showAllGeobases');
    // this.showGeobaseArea = true;
    this.geoSessionDataColleced = false;
    const includeDefaultGeobase = false;
    this.geoSessionsList = [];
    this.geobaseService.getGeobasesList(includeDefaultGeobase)
    .subscribe(geobaseList => {
      console.log('Got geobaseList info', geobaseList);
      if (!this.commonService.isValid(geobaseList)) {
        console.log('No geobaseList present');
      } else {
        console.log('geobaseList present');
        if (geobaseList.length > 0) {
          geobaseList.forEach(geobase => {
            this.geoSessionsList.push({ name: geobase.name, id: geobase.sessionId,
              uuid: null, type: 'myFiles', showAllSites: false });
            console.log('geobaseList iterating ', this.geoSessionsList, geobase);
          });
        }
      }
      this.currSessionsObj = {};
      this.geoSessionsList.forEach(element => {
        this.currSessionsObj[element.id] = element.name;
      });
      this.geoSessionDataColleced = true;
    }, error => {
      console.log('Error while getting geobaseList');
      console.log(error);
      this.geoSessionDataColleced = true;
      this.geoSessionsList = [];
      if (error.errorCode === 500) {
      }
    });
    /* setTimeout(() => {
      this.geoSessionsList = [];
      for (let i = 0; i <= 20; i++){
        this.geoSessionsList.push({ name: `Geo session ${i}`, id: new Date().getTime() + i });
      }
      this.geoSessionDataColleced = true;
    }, 2000); */
  }

  sessionCategorySelect(sessionId, autoSelect: boolean = false): any{
    console.log(`sessionCategorySelect: ${sessionId}`);
    this.selectedSessionId = String(sessionId);
    console.log(this.saveSessionOptionSelectedFrom);
    if (this.saveSessionOptionSelectedFrom === SessionSharingOption.UNKNOWN){
      this.selectedSessionSharingOption = SessionSharingOption.UNKNOWN;
    }
    if (!autoSelect){
      this.saveSessionOptionSelectedFrom = SessionSharingOption.UNKNOWN;
    }
    console.log(this.saveSessionOptionSelectedFrom);
    this.selectAllSitesCheckbox.checked = false;
    this.errorMsg = '';
    const index = this.geoSessionsList.findIndex(val => String(val.id) === String(sessionId));
    if (index !== -1){
      console.log(sessionId);
      console.log(this.geoSessionsList);
      console.log(this.geoSessionsList[index]);
      if (this.commonService.isValid(this.geoSessionsList[index].sessionId)){

        const dataToEmit: any = {};
        for (const key in this.geoSessionsList[index]) {
          if (this.geoSessionsList[index].hasOwnProperty(key)) {
            dataToEmit[key] = this.geoSessionsList[index][key];
          }
        }
        dataToEmit.showAllSites = true;
        // this.loadSession.emit(this.geoSessionsList[index]);

        this.projectsDataCollected = false;
        this.placesDataCollected = false;
        this.topicsDataCollected = false;
        this.loadSession.emit(dataToEmit);
        // Here adding code for once switching the session applying the BBox to main map
        const geobaseInfo = this.geoSessionsList[index];
        if (geobaseInfo.boundingBox !== null) {
          console.log('Bounding box is ', geobaseInfo.boundingBox);
          this.basemapService.getCurrentBasemap().getView().fit(geobaseInfo.boundingBox.map(Number));
        }
      }
    }
  }

  overrideSession(): any{
    console.log('In Override Session');
    this.showSessionOverrideAlert = false;
    this.copySelected = false;
    // API Call to save session which will first check if session name already exists
    // duplicate session name => show alert Session
    // else save session

    this.saveCurrentSession();
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
      geobaseId: this.selectedSessionId,
      sessionId: this.selectedSessionId,
      organizationId: this.defaultGeobaseInfo.organizationId,
      geopadId: newGeopadId,
      towerId: this.towerWithLayersList[0].tower.towerId,
      boundingBox: this.basemapService.getCurrentBasemap().getView().calculateExtent(this.basemapService.getCurrentBasemap().getSize()),
      status: 'Active',
      isDefault: this.defaultGeobaseInfo.isDefault,
      name: this.sessionNameInput.value,
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
            this.geobaseService.updateDefaultGeobase(geobaseRequest, this.selectedSessionId)
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
                    this.sessionShareCurrentState = this.sessionSaveStates.UNKNOWN;
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
    const newGeopadId = 0;
    // let isGeopadBoxSelected = false;
    // const geoPadIndex = this.currentBoundingBoxItems.findIndex(val => val.value === 'geopad' && val.selected);
    // if (geoPadIndex !== -1){
    //   isGeopadBoxSelected = true;
    //   // newGeopadId = this.defaultGeobaseInfo.geopadId;
    // }
    // console.log('In saveAsNewSession -- checking the geopad selection ', isGeopadBoxSelected);
    const selectedLayers = [];
    const selectedSites = [];
    this.geoTowerList.forEach(layer => {
      if (layer.selected) { selectedLayers.push(layer); }
    });

    this.savedNotes.forEach(geopad => {
      if (geopad.selected) { selectedSites.push(geopad); }
    });

    console.log('selected geopads list ', this.savedNotes, selectedSites);

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
      name: this.sessionNameInput.value,
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
                    this.selectedSessionId = String(response.body);
                    this.getGeobaseListByFilter(this.sessionCategoryCtrl.value, true);
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

  copySessionLinkToClipboard(): void{
    const copyText = this.urlLink.nativeElement;
    if (this.commonService.isValid(copyText.value)) {
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      document.execCommand('copy');
      this.copyToClipboard = 'Session URL copied to clipboard !';
      this.urlCopiedToClipboard = true;
      setTimeout(() => {
        this.copyToClipboard = '';
        this.urlCopiedToClipboard = false;
      }, 5000);
    } else {
      // this.errorMsg = 'Nothing present to copy.';
      this.showError('Nothing present to copy.');
      this.urlCopiedToClipboard = false;
      setTimeout(() => {
        this.errorMsg = '';
      }, 5000);
    }
  }

  makeCopyOfSession(): any{
    const sitesCount = this.getCountOfSelectedSites();
    const layersCount = this.getCountOfSelectedLayers();
    console.log(sitesCount);
    console.log(layersCount);
    if (sitesCount === 0 && layersCount === 0){
        this.showSessionSaveAlert = true;
        return;
      }
      else { this.showSessionNameInput(); }
  }

  showSessionNameInput(): any{
    this.showSessionSaveAlert = false;
    if (this.selectedSessionId === ''){
      // this.errorMsg = 'Please select session to copy.';
      this.showError('Please select session to copy.');
    } else {
      this.copySelected = true;
      this.getGeobaseListByFilterProcess('mySession');
      this.geobaseService.getGeobasesListByType('mySession', this.globalObject.geobase.sessionId)
      .subscribe(geobaseList => {
        console.log('Got geobaseList info in filter', geobaseList);
        console.log('geobaseList present');
        console.log(geobaseList.body);
        let count = 0;
        let dateStr = '';
        const date: Date = new Date();
        dateStr = String(date.getFullYear()).substring(2) + '' + (date.getMonth() + 1) + '' + date.getDate();
        if (geobaseList.body.length > 0) {
          geobaseList.body.forEach(geobase => {
          console.log(geobase);
          if (geobase.session.name.includes(dateStr)){
            count++;
          }
          });
            // FE-userid-211114-<count++>
        }
        const suggestedSesionName = 'FE-' + this.userProfileData.user.userId + '-' + dateStr + '-' + (count + 1);
        this.sessionNameInput = new FormControl(suggestedSesionName);
        this.geoSessionDataColleced = true;
      }, error => {
        console.log('Error while getting geobaseList in filter');
        console.log(error);
      });
    }
  }

  saveSessionWithBoundingBox(): any {
    this.showSessionNameInput();
    this.showSessionShareAlert = false;
    this.showSessionSaveAlert = false;
  }

  selectedSitesBBox(): any {

    /* setTimeout(() => {
      console.log('selectedSitesBBox');
      const featuresOnLayers: Array<any> = [];
      this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
        console.log(layer);
        if (this.commonService.isValid(layer)) {

          // TO IDENTIFY SITE LAYERS ONLY
          if (this.commonService.isValid(layer.values_.geopadCustomData)) {
            featuresOnLayers.push(layer.getSource().getFeatures());
          }
        }
      });

      function flatten(ary, ret = []): Array<any>{
        for (const entry of ary) {
            if (Array.isArray(entry)){
                flatten(entry, ret);
            } else {
                ret.push(entry);
            }
        }
        return ret;
      }

      const extentOfAllFeatures = createEmpty();
      const flatFeatures = flatten(featuresOnLayers);
      flatFeatures.forEach((feature) => {
        extend(extentOfAllFeatures, feature.getGeometry().getExtent());
      });
      console.log(extentOfAllFeatures);
      this.basemapService.getCurrentBasemap().getView().fit(extentOfAllFeatures);
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);

    }, 2000); */
  }
}
