import { Component, OnInit, Output, EventEmitter, Input, ElementRef, ViewChild, Pipe, PipeTransform,
          AfterViewInit, SimpleChange, OnChanges, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/Services/common.service';
import { FirebaseService } from 'src/app/Services/firebase.service';
import { GeoNotePadService } from 'src/app/Services/geo-notepad.service';
import { FormControl } from '@angular/forms';
import { TopicsService } from 'src/app/Services/topics.service';
import OlMap from 'ol/Map';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { Draggable } from '../../../assets/js/Draggable.js';
import { TweenLite } from '../../../assets/js/TweenLite.js';
import { FirebaseUtil } from '../../geobar/util/firebaseUtil';
import { AngularFireStorage } from '@angular/fire/storage';
import { AnyRecordWithTtl } from 'dns';
import Polygon from 'ol/geom/Polygon';
import {transform} from 'ol/proj';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';



const EXIF: any = (window as any).EXIF;

export enum SiteType{
  ALL = 'ALL',
  POINT = 'Point',
  LINE = 'LineString',
  POLYGON = 'Polygon',
  UNKNOWN = ''
}

enum FileFormats {
  URL = 'url',
  FILE = 'file',
  YOUTUBE = 'youtube'
}
export enum FileTypes {
  IMAGES = 'images',
  VIDEOS = 'videos',
  AUDIOS = 'audios',
  NOTES = 'notes',
  SCHETCHES = 'schetches',
  DESCRIPTORS = 'descriptors'
}
export class FileObject {
  name: string;
  format: FileFormats;
  url: string;
  file: File;
  fileExtention: string;
  date: string;
  type: FileTypes;
  caption: string;
  base64Data: any;
  dimension: any;
  id: string;
  gpsAvailable: boolean;
  latitude: string;
  longitude: string;
  observationItemId = 0;
  observationInstanceId = 0;
  size: any;
  constructor(name: string, format: FileFormats, url: string, type: FileTypes, file: File, fileExtention: string, base64Data: any,
              caption: string, dimension: any, date,
              gpsAvailable = false, latitude = '', longitude = '') {
    this.file = file;
    this.fileExtention = fileExtention;
    this.name = name;
    this.format = format;
    this.url = url;
    this.date = date;
    this.type = type;
    this.base64Data = base64Data;
    this.caption = caption;
    this.dimension = dimension;
    this.gpsAvailable = gpsAvailable;
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

export class SiteParams {
  icon: any;
  color: string;
  symbolSize: string;
  rotationAngle: number;
  arrowType: string;
  fillColor: string;
  siteType: SiteType;
  constructor(icon: any, color: string, symbolSize: string, rotationAngle: number,
              arrowType: string, fillColor: string, siteType: SiteType){
    this.icon = icon;
    this.color = color;
    this.symbolSize = symbolSize;
    this.rotationAngle = rotationAngle;
    this.arrowType = arrowType;
    this.fillColor = fillColor;
    this.siteType = siteType;
  }
}

export class FuseEarthSite {
  id: string | number;
  observationInstanceId = null;
  createdDate: string;
  description: string;
  filesList: Array<FileObject>;
  geopadId: number;
  geopadNotes: Array<FileObject>;
  latitudeLongitude: any[];
  latitudeLongitudeToShow: any[];
  locationName: string;
  status: string;
  tags: any[] = [];
  uiTimestamp: string;
  updatedDate: string;
  siteType: SiteType;
  imageFilesList: Array<FileObject>;
  videoFilesList: Array<FileObject>;
  audioFilesList: Array<FileObject>;
  descriptorsFilesList: Array<FileObject>;
  siteParams: SiteParams;
  verticalData: { headers: any[], body: any[]};

  constructor(
    id: string|number, createdDate: string, description: string, filesList: Array<FileObject>, geopadId: number,
    geopadNotes: Array<FileObject>,
    latitudeLongitude: any[], locationName: string, status: string, tags: any[], uiTimestamp: string, updatedDate: string,
    siteType: SiteType, siteParams: SiteParams, verticalData: { headers: any[], body: any[]},
    imageFilesList: Array<FileObject> = [], videoFilesList: Array<FileObject> = [], audioFilesList: Array<FileObject> = [],
    descriptorsFilesList: Array<FileObject> = []) {
      this.id = id;
      this.createdDate = createdDate;
      this.description = description;
      this.filesList = filesList;
      this.geopadId = geopadId;
      this.geopadNotes = geopadNotes;
      this.latitudeLongitude = latitudeLongitude;
      this.locationName = locationName;
      this.status = status;
      this.tags = tags || [];
      this.uiTimestamp = uiTimestamp;
      this.updatedDate = updatedDate;
      this.siteType = siteType;
      this.imageFilesList = imageFilesList;
      this.videoFilesList = videoFilesList;
      this.audioFilesList = audioFilesList;
      this.descriptorsFilesList = descriptorsFilesList;
      this.siteParams = siteParams;
      this.verticalData = verticalData;
  }
}

@Pipe({ name: 'safe' })
export class UrlSafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url): SafeResourceUrl {
    if (url !== '' && url !== undefined && url !== null) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      return '';
    }
  }
}

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const FILE_SIZE_UNITS_LONG = ['Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes', 'Pettabytes', 'Exabytes', 'Zettabytes', 'Yottabytes'];

@Pipe({ name: 'formatFileSize' })
export class FormatFileSizePipe implements PipeTransform {
  transform(sizeInBytes: number): string {
    const units = FILE_SIZE_UNITS;

    if (sizeInBytes === 0){
      return '';
    }

    let power = Math.round(Math.log(sizeInBytes) / Math.log(1024));
    power = Math.min(power, units.length - 1);

    const size = sizeInBytes / Math.pow(1024, power); // size in new units
    const formattedSize = Math.round(size * 100) / 100; // keep up to 2 decimals
    const unit = units[power];

    return formattedSize + '' + unit;
  }
}

@Component({
  selector: 'app-capture-notes',
  templateUrl: './capture-notes.component.html',
  styleUrls: ['./capture-notes.component.scss']
})
export class CaptureNotesComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  // @Input() latitude: string;
  // @Input() longitude: string;
  @Input() selectedProjectId = 0;
  @Input() selectedPlaceId = 0;
  @Input() selectedTopicId = 0;
  @Input() currentContextInfo: any = {};
  @Input() userInfo: any = {};
  @Input() globalObject;
  @Input() locationData: any[] = [];
  @Input() operation = 'add';
  @Input() selectedNote: any = {};
  @Input() isGuest = true;
  @Input() currentSession: any = {};
  @Input() type: FileTypes = FileTypes.IMAGES;
  @Output() closeNotesPicker: EventEmitter<any> = new EventEmitter<any>();
  @Output() capturedData: EventEmitter<any> = new EventEmitter<any>();
  @Output() savingNotes: EventEmitter<any> = new EventEmitter<any>();
  selectedTab: FileTypes;

  allFileTypes = FileTypes;
  allFileFormats = FileFormats;

  imageFilesList: Array<FileObject> = [];
  videoFilesList: Array<FileObject> = [];
  audioFilesList: Array<FileObject> = [];
  notesList: Array<FileObject> = [];
  schetchFilesList: Array<FileObject> = [];
  descriptorsFilesList: Array<FileObject> = [];

  filesList: Array<FileObject> = [];
  showFileUrlCollector = false;
  @ViewChild('siteNameInput') siteNameInput: ElementRef<HTMLInputElement>;
  @ViewChild('fileUrlInput') fileUrlInput: ElementRef<HTMLInputElement>;
  @ViewChild('uploadFileSelector') uploadFileSelector: ElementRef<HTMLInputElement>;
  @ViewChild('notesDescription') notesDescription: ElementRef<HTMLTextAreaElement>;
  @ViewChild('notesProjectName') notesProjectName: ElementRef<HTMLSelectElement>;
  @ViewChild('projectInput') projectInput: ElementRef<HTMLInputElement>;
  @ViewChild('placeInput') placeInput: ElementRef<HTMLInputElement>;
  @ViewChild('topicInput') topicInput: ElementRef<HTMLInputElement>;
  urlValidationError = '';

  sites: Array<FuseEarthSite> = [];
  currentSite: FuseEarthSite;
  showSitesTray = true;
  siteNameCtrl: FormControl = new FormControl('');
  descriptionCtrl: FormControl = new FormControl('');
  siteNotesCtrl: FormControl = new FormControl('');

  acceptFileTypes: any = {
    images: 'image/*',
    videos: 'video/mp4,video/x-m4v,video/*',
    audios: '.mp3,audio/*',
    descriptors: '.xlsx,.xls,.doc, .docx,.ppt, .pptx,.txt,.pdf'
  };

  showConfirmClose = false;
  showTagsContainer = false;
  showLatLongContainer = true;
  // locationTags: Array<string> = [];
  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;

  notesValidationError = '';
  showFileViewer = false;
  selectedFileToView: any;

  private imageUploadAbservable = new Subject<any>();
  private imageUploadAbservableStream$ = this.imageUploadAbservable.asObservable();
  dataToSave: any = {};
  generatedUrlsCount = 0;
  filesToSave: Array<FileObject> = [];
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
  siteRequestReceived: number;
  siteRequestSent: number;
  showLocationTaggedImages: boolean;
  locationTaggedImages: Array<FileObject> = [];
  siteNoteOperation = 'add';
  currentSiteNote: FileObject;
  private basemap: OlMap;

  @Input() confirmCurrentNotesClosing: any = {};
  @Output() responseOfCurrentNoteCloseRequest: EventEmitter<any> = new EventEmitter<any>();
  watchOnPolygonChangesSubs: Subscription;

  @Input() tempCreateSiteId: string = String(new Date().getTime());
  @Input() userProfileData: any = {};
  @Input() viewMode: any = {};
  userRole = '';
  siteTypeEnum = SiteType;

  generalSiteIconsList: any[] = [];
  specialSiteIconsList: any[] = [];
  customSiteIconsList: any[] = [];
  generalSiteSelectedIcon: any = {};
  specialSiteSelectedIcon: any = {};
  customSiteSelectedIcon: any = {};
  rotationAngle: FormControl = new FormControl(0);

  lineSiteThicknessIconsList: any[] = [];
  lineSiteSelectedThicknessIcon: any = {};
  currentSiteIcon: any = {};

  sitePointOrLineColor: FormControl = new FormControl('#000000');
  sitePolygonFillColor: FormControl = new FormControl('#ffffff');
  sitePointSymbolSize: FormControl = new FormControl('4');

  progress: Subject<any> = new Subject<any>();
  showVerticalInfo = false;
  // @ViewChild('annotateLayerOption') annotateLayerOption: ElementRef<HTMLDivElement>;
  // @Output() annotateOpStatus: EventEmitter<string> = new EventEmitter<string>();
  // showAnnotationCancelConfirmScreen = false;
  showSessionShareSiteEditAlert = false;
  initialSiteData: any;
  constructor(public commonService: CommonService, private firebaseService: FirebaseService,
              private basemapService: BasemapService,
              private firestorage: AngularFireStorage,
              private notepadService: GeoNotePadService, private topicsService: TopicsService) {
    this.imageUploadAbservableStream$.subscribe(data => this.uploadStatusEvent(data));
    this.progress.subscribe(prog => {
      console.log('IN PROGRESS');
      console.log(prog);
      // this.setUploadStatusInPercentage(10 + (prog / 2));
    });
  }

  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    console.log('IN CAPTURE NOTE SCREEN');
    console.log(changes);
    console.log(this);
    if (this.commonService.isValid(changes.confirmCurrentNotesClosing)) {
      if (this.commonService.isValid(changes.confirmCurrentNotesClosing.currentValue)) {
        if (this.confirmCurrentNotesClosing.type === 'confirm-close') {
          console.log('CONFIRM ANG CLOSE THE CURRENT SITE');
          document.getElementById('capture-notes-close-btn').click();
        }
      }
    }
  }
  ngOnInit(): any {

    try{
      this.userRole = this.userProfileData.userOrgRolesInfo.roleName;
    } catch (e){
      console.log(e);
    }
    if (this.operation === 'update' || this.operation === 'view') {
      // UPDATE OR VIEW SITE. HERE SELECTED NOTE CAN HAVE THE SITE INFO
      try{
        this.selectedProjectId = this.selectedNote.project.topicId;
      } catch (e){
        console.log(e);
      }

      try{
        this.selectedPlaceId = this.selectedNote.place.topicId;
      } catch (e){
        console.log(e);
      }

      try{
        this.selectedTopicId = this.selectedNote.topic.topicId;
      } catch (e){
        console.log(e);
      }
    } else {
      // ADDING SITE CASE. HERE CONTEXT INFO CONTAINS VALID PROJECT, PLACE, TOPIC IDS
      try{
        this.selectedProjectId = this.currentContextInfo.project.topicId;
        this.selectedPlaceId = this.currentContextInfo.place.topicId;
        this.selectedTopicId = this.currentContextInfo.topic.topicId;
      } catch (e){
        console.log(e);
      }
    }
    this.basemap = this.basemapService.getCurrentBasemap();
    this.currentSession = this.globalObject.geobase;

    let type: SiteType;
    if (this.locationData.length === 2) {
      type = SiteType.POINT;
    } else if (this.locationData.length > 2) {
      let isPolygon = false;
      if (this.locationData.length > 4) {
        if (this.locationData[0] === this.locationData[this.locationData.length - 2] &&
            this.locationData[1] === this.locationData[this.locationData.length - 1]) {
            isPolygon = true;
        }
      }
      type = isPolygon ? SiteType.POLYGON : SiteType.LINE;
    }
    this.currentSite = new FuseEarthSite(1, '', '', [], this.currentSession.geopadId, [], this.locationData, '',
      'Active', [], '', '',  type, null, this.initiateVerticalData());
    // this.currentSite = this.sites[0];
    this.sites = [this.currentSite];
    this.currentSite.latitudeLongitude = this.locationData;
    this.currentSite.latitudeLongitudeToShow = this.getLatLongsToShow(this.locationData);
    this.siteNameCtrl.valueChanges.subscribe(res => {
      this.currentSite.locationName = res;
    });
    this.descriptionCtrl.valueChanges.subscribe(res => {
      this.currentSite.description = res;
    });
    this.siteNotesCtrl.valueChanges.subscribe(res => {
      if (!this.commonService.isValid(res)) {
        this.siteNoteOperation = 'add';
      }
    });
    console.log(this);
    this.selectedTab = this.type;
    this.getProjectsList();
    this.projectSelect.valueChanges.subscribe(res => {
      console.log('PROJECT CHANGED');
      console.log(res);
      if (this.commonService.isValid(res)) {
        // this.getPlacesListByProjectId(res);
      }
    });
    this.placeSelect.valueChanges.subscribe(res => {
      console.log('PLACE CHANGED');
      console.log(res);
      if (this.commonService.isValid(res)) {
        // this.getTopicsListByPlaceId(res);
      }
    });

    // Here Dragabble functionality adding

    Draggable.create('#siteIconRotationAngNeedle', {
      type: 'rotation',
      throwProps: true,
      // bounds: { minRotation: -23, maxRotation: 337 },
      onDrag: (e) => {
        console.log('drag start ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'siteIconRotationAngNeedle') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          // console.log(element);
          // console.log(element._gsTransform);
          let angle = element._gsTransform.rotation;
          // console.log(e, angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          console.log('INVALID TARGET...');
        }
      },
      onDragEnd: (e) => {
        console.log('drag end ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'siteIconRotationAngNeedle') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          let angle = element._gsTransform.rotation;
          console.log(angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          console.log('INVALID TARGET...');
        }
      }
    });
    try{
      this._updateDraggableObj();
    } catch (e){
      console.log(e);
    }


    this.rotationAngle.valueChanges.subscribe(val => {
      console.log('ANGLE CHANGED');
      console.log(val);
      try{
        const globeIconDraggable = Draggable.get('#siteIconRotationAngNeedle');
        TweenLite.set('#siteIconRotationAngNeedle', { rotation: val });
        // globeIconDraggable.update();
      } catch (e){
        console.log(e);
      }

      // REDRAW ICON ON MAP
      this.redrawSiteOnMap();
    });


    /* this.generalSiteSelectedIcon = this.generalSiteIconsList[0];
    this.currentSiteIcon = this.generalSiteIconsList[0];

    this.customSiteSelectedIcon = this.customSiteIconsList[0]; */

    this.sitePointOrLineColor.valueChanges.subscribe(val => {
      console.log('Site point or line color changed');
      console.log(val);
      this.redrawSiteOnMap();
    });

    this.sitePolygonFillColor.valueChanges.subscribe(val => {
      console.log('Site polygon fill color changed');
      console.log(val);
      this.redrawSiteOnMap();
    });

    this.sitePointSymbolSize.valueChanges.subscribe(val => {
      console.log('site point symbol size changed');
      console.log(val);
      this.redrawSiteOnMap();
    });

    this.getTransformedGeometry()
  }

  getTransformedGeometry(){
    var sourceCrs = 'EPSG:4326';
    let geometry:any

// Define the target CRS using a string identifier
var targetCrs = this.basemapService.getCurrentBasemap().getView().getProjection()

if(this.locationData.length === 2){
  geometry = Point

 
}else if (this.locationData.length > 2){
  if(this.locationData.length >4){
    if (this.locationData[0] === this.locationData[this.locationData.length - 2] &&
      this.locationData[1] === this.locationData[this.locationData.length - 1]) {
      geometry = Polygon
  }else if(this.locationData.length===4){
    geometry = LineString
    console.log(geometry,"check the instance...")
  }

  }
}


// Create a new array to hold the transformed coordinates
var transformedCoordinates = [];

// Get the original coordinates from the polygon geometry
const originalCoordinates = this.locationData.map((element, index) => {
  if (index % 2 === 0) {
    // If the index is even, return a new array with the current
    // element and the next element in the original array
    return [element, this.locationData[index + 1]];
  }
});

//console.log(originalCoordinate,"poly coords")

// Loop through the original coordinates and transform them
// using the ol.proj.transform method
for (var i = 0; i < originalCoordinates.length; i++) {
  var originalCoordinate = originalCoordinates[i];
  var transformedCoordinate = transform(originalCoordinate, sourceCrs, targetCrs);
  transformedCoordinates.push(transformedCoordinate);
}

// Create a new geometry using the transformed coordinates
var transformedgeometry = new geometry(transformedCoordinates);
return transformedgeometry

}

  private _setRotation(rotationValue): any {
    console.log('IN SET ROTATION');
    console.log(rotationValue);
    // this.basemapService.isOrientationEvent = true;
    // this.basemapService.getCurrentBasemap().getView().setRotation(Math.PI / 180 * rotationValue);
    // this.basemapService.isOrientationEvent = false;
    this.rotationAngle.setValue(rotationValue);
  }
  uploadCustomIcon(): any {
    console.log('custom calling');
    // Here need to upload custom icon code
    document.getElementById('selectedIcon').click();
  }

  selectSiteIcon(iconType, siteType: SiteType, siteIcon): void{
    if (iconType === 'general'){
      this.generalSiteSelectedIcon = siteIcon;
    } else if (iconType === 'special'){
      this.specialSiteSelectedIcon = siteIcon;
    } else if (iconType === 'custom'){
      this.customSiteSelectedIcon = siteIcon;
    } else if (iconType === 'thickness'){
      this.lineSiteSelectedThicknessIcon = siteIcon;
      this.sitePointSymbolSize.setValue(siteIcon.value);
    }

    if (iconType !== 'thickness'){
      this.currentSiteIcon = siteIcon;
    }

    // REDRAW ICON ON MAP
    this.redrawSiteOnMap();
  }

  redrawSiteOnMap(): void{
    console.log('REDRAWING SITE ON MAP');
    this.sites.forEach(site => {
      site.siteParams = this.getCurrentSiteParams();
    });
    this.updateSiteStyleOnMap(this.currentSite);
  }
  getCurrentSiteParams(): SiteParams{
    const icon = this.currentSiteIcon;
    const color = this.sitePointOrLineColor.value;
    let symbolSize = '';
    let rotationAngle: number;
    let arrowType = 'NONE';
    // let thickness: any = {};
    let fillColor = '';

    if (this.currentSite.siteType === SiteType.POINT){
      symbolSize = this.sitePointSymbolSize.value;
      rotationAngle = this.rotationAngle.value;
    } else{
      arrowType = 'NONE';
      // thickness = '';
      symbolSize = this.sitePointSymbolSize.value;
    }

    if (this.currentSite.siteType === SiteType.POLYGON){
      fillColor = this.sitePolygonFillColor.value;
    }
    const siteParams = new SiteParams(icon, color, symbolSize, rotationAngle,
      arrowType, fillColor, this.currentSite.siteType);
    console.log(siteParams);
    return siteParams;
  }
  ngOnDestroy(): void{
    this.clearPolygonDrawingTools();
    if (this.commonService.isValid(this.watchOnPolygonChangesSubs)) {
      this.watchOnPolygonChangesSubs.unsubscribe();
    }
  }
  clearPolygonDrawingTools(): void{
    this.notepadService.clearPolygonDrawingTools();
  }

  updatePolygonOnChanges(watchOnPolygonChanges: Subject<any>): void{
    this.watchOnPolygonChangesSubs = watchOnPolygonChanges.subscribe(polygonChanged => {
      console.log('POLYGON CHANGED');
      console.log(polygonChanged);
      let coords;
      const coordsList = [];
      let siteType: SiteType;
      if (polygonChanged.from === this.notepadService.shapeDrawType.POLYGON /*'polygon'*/){
        // coords = res['co-ordinates'];
        polygonChanged['co-ordinates'].forEach(latLngList => {
          console.log(' ???? ', latLngList);
          latLngList.forEach(element => {
            console.log(element);
            // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
            coordsList.push(element[0]);
            coordsList.push(element[1]);
          });
        });
        siteType = SiteType.POLYGON;
        console.log(coordsList);
        coords = coordsList;
      } else if ( polygonChanged.from === this.notepadService.shapeDrawType.LINE_STRING ){
        polygonChanged['co-ordinates'].forEach(latLngList => {
          console.log(latLngList);
          // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
          coordsList.push(latLngList[0]);
          coordsList.push(latLngList[1]);
        });
        console.log(coordsList);
        coords = coordsList;
        siteType = SiteType.LINE;
      } else if (polygonChanged.from === this.notepadService.shapeDrawType.POINT /*'position'*/){
        // coords = [res['co-ordinates']];
        polygonChanged['co-ordinates'].forEach(latLngList => {
          console.log(latLngList);
          // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
          coordsList.push(latLngList);
        });
        console.log(coordsList);
        coords = coordsList;
        siteType = SiteType.POINT;
      }
      this.locationData = coords;
      this.currentSite.siteType = siteType;
      this.currentSite.latitudeLongitude = this.locationData;
      this.currentSite.latitudeLongitudeToShow = this.getLatLongsToShow(this.locationData);
    });
  }
  getLatLongsToShow(locationData: Array<string>): Array<string> {
    console.log('In latitudeLongitude');
    console.log(locationData);
    const tempData: Array<string> = [];
    for (let index = 0; index < locationData.length; index = index + 2 ) {
      console.log(index);
      console.log(locationData[index]);
      console.log(locationData[index + 1]);
      try{
        tempData.push(Number(locationData[index + 1]).toFixed(2).toString());
      } catch (e) { console.log(e); }
      try{
        tempData.push(Number(locationData[index]).toFixed(2).toString());
      } catch (e) { console.log(e); }
    }
    console.log('end');
    return tempData;
  }
  initiateVerticalData(): any{
    return { headers: [{name: '', id: new Date().getTime(), order: 0}], body: []};
  }
  ngAfterViewInit(): any {
    if (this.operation === 'update' || this.operation === 'view') {
      

      const existSiteParams: SiteParams = this.selectedNote.siteParams;
      this.currentSiteIcon = existSiteParams.icon;
      this.sitePointOrLineColor.setValue(existSiteParams.color);

      if (this.commonService.isValid(existSiteParams.icon)){
        if (existSiteParams.icon.iconCategory === 'General') {
          this.generalSiteSelectedIcon = existSiteParams.icon;
        } else if (existSiteParams.icon.iconCategory === 'Special') {
          this.specialSiteSelectedIcon = existSiteParams.icon;
        }  else if (existSiteParams.icon.iconCategory === 'Custom') {
          this.customSiteIconsList = existSiteParams.icon;
        }
      }

      this.sitePointSymbolSize.setValue(existSiteParams.symbolSize);
      if (this.selectedNote.siteType === SiteType.POINT){
        this.rotationAngle.setValue(existSiteParams.rotationAngle);
      } else{
        // arrowType = 'NONE';
        // thickness = this.lineSiteSelectedThicknessIcon;
      }

      if (this.selectedNote.siteType === SiteType.POLYGON){
        this.sitePolygonFillColor.setValue(existSiteParams.fillColor);
      }

      this.currentSite =  new FuseEarthSite(this.selectedNote.observationInstanceId, this.selectedNote.createdDate,
                          this.selectedNote.description, this.selectedNote.filesList, this.selectedNote.geopadId,
                          /*this.selectedNote.geopadNotes*/ [], this.selectedNote.latitudeLongitude, this.selectedNote.locationName,
                          this.selectedNote.status, this.selectedNote.tags, this.selectedNote.uiTimestamp, this.selectedNote.updatedDate,
                          this.selectedNote.siteType, null, this.initiateVerticalData());

      this.currentSite.siteParams = this.getCurrentSiteParams();
      // this.currentSite.imageFilesList = this.selectedNote.filesList.filter(val => val.type === FileTypes.IMAGES);
      this.currentSite.observationInstanceId = this.selectedNote.observationInstanceId;
      const imagesList: any[] = this.selectedNote.filesList.filter(val => val.type === FileTypes.IMAGES);

      imagesList.forEach(element => {
        const url = element.url;
        const urlWithFileName = url.substr(0, url.lastIndexOf('?'));
        const extension = urlWithFileName.substring(urlWithFileName.lastIndexOf('.'));
        const img = new Image();

// createdDate: null
// notes: []
// status: "Active"
// updatedDate: null
        img.onload = (imgLoadEvent) => {
          const loadedImage: any = imgLoadEvent.currentTarget;
          const width = loadedImage.width;
          const height = loadedImage.height;
          const dimension = { width, height };
          const fileObj: FileObject = new FileObject('', FileFormats.URL, url, FileTypes.IMAGES,
                                      null, extension.substring(extension.lastIndexOf('.') + 1), null, element.caption,
                                      dimension, element.updatedDate);
          fileObj.observationItemId = element.observationItemId;
          fileObj.observationInstanceId = element.observationInstanceId;
          fileObj.size = element.size;
          this.currentSite.imageFilesList.push(fileObj);
        };
        img.src = url;
      });


      this.currentSite.videoFilesList = this.getFilesFromList(this.selectedNote.filesList, FileTypes.VIDEOS);
      this.currentSite.audioFilesList = this.getFilesFromList(this.selectedNote.filesList, FileTypes.AUDIOS);
      this.currentSite.descriptorsFilesList = this.getFilesFromList(this.selectedNote.filesList, FileTypes.DESCRIPTORS);
      this.currentSite.geopadNotes = this.getFilesFromList(this.selectedNote.filesList, FileTypes.NOTES);
      this.siteNameCtrl.setValue(this.currentSite.locationName);
      this.descriptionCtrl.setValue(this.currentSite.description);
      this.locationData = this.selectedNote.latitudeLongitude;
      this.currentSite.latitudeLongitudeToShow = this.getLatLongsToShow(this.locationData);
      this.currentSite.verticalData = this.commonService.isValid(this.selectedNote.verticalData) ?
                                JSON.parse(this.selectedNote.verticalData) : { headers: [], body: []};
      console.log(JSON.parse(this.selectedNote.verticalData));
      this.sites = [this.currentSite];
    }


    console.log('GETTING SITE ICONS FOR DROPDOWNS');
    console.log(this.currentSite.siteType === SiteType.POINT);
    console.log(this.currentSite.siteType, SiteType.POINT);
    if (this.currentSite.siteType === SiteType.POINT){
      // Here calling the general-point dropdown API
      this.getSiteIconsDropDown('General', SiteType.POINT);
      this.getSiteIconsDropDown('Special', SiteType.POINT);
      this.getSiteIconsDropDown('Custom', SiteType.POINT);
      console.log('this.generalSiteIconsList ', this.generalSiteIconsList);
    } else if (this.currentSite.siteType === SiteType.LINE){
      this.getSiteIconsDropDown('General', SiteType.LINE);
      this.getSiteIconsDropDown('Special', SiteType.LINE);
      // this.getSiteIconsDropDown('Custom', SiteType.LINE);
    } else if (this.currentSite.siteType === SiteType.POLYGON){
      this.getSiteIconsDropDown('General', SiteType.POLYGON);
    }

    if (this.currentSite.siteType === SiteType.LINE || this.currentSite.siteType === SiteType.POLYGON){
      this.lineSiteThicknessIconsList = [
        { name: '1 px', imgUrl: '/assets/svgs/geopad/siteinfo/one_px.svg', value: '1'},
        { name: '2 px', imgUrl: '/assets/svgs/geopad/siteinfo/two_px.svg', value: '2'},
        { name: '4 px', imgUrl: '/assets/svgs/geopad/siteinfo/four_px.svg', value: '4'},
        { name: '8 px', imgUrl: '/assets/svgs/geopad/siteinfo/eight_px.svg', value: '8'},
        { name: '10 px', imgUrl: '/assets/svgs/geopad/siteinfo/ten_px.svg', value: '10'}
      ];
      if (this.operation === 'add'){
        this.lineSiteSelectedThicknessIcon = this.lineSiteThicknessIconsList[0];
      } else {
        const index = this.lineSiteThicknessIconsList.findIndex(val => val.value === this.currentSite.siteParams.symbolSize);
        if (index !== -1){
          this.lineSiteSelectedThicknessIcon = this.lineSiteThicknessIconsList[index];
        } else {
          this.lineSiteSelectedThicknessIcon = this.lineSiteThicknessIconsList[0];
        }
      }
    }


    if (this.operation === 'view') {
      this.showOrCloseLocationOnMap(this.currentSite, 'zoom');
    } else{
      const watchOnPolygonChanges: Subject<any> = new Subject<any>();
      this.updatePolygonOnChanges(watchOnPolygonChanges);
      setTimeout(() => {
        this.showOrCloseLocationOnMap(this.currentSite, 'zoom', watchOnPolygonChanges);
      }, 500);
    }

  }

  getFilesFromList(filesList: any[], type: string): Array<FileObject> {
    const tempList: any[] = filesList.filter(val => val.type === type);
    const retList: Array<FileObject> = [];
    tempList.forEach(element => {
      const url = element.url;
      const urlWithFileName = url.substr(0, url.lastIndexOf('?'));
      const extension = urlWithFileName.substring(urlWithFileName.lastIndexOf('.'));
      const fileObj: FileObject = new FileObject('', FileFormats.URL, url, type as FileTypes,
                                    null, extension.substring(extension.lastIndexOf('.') + 1), null, element.caption,
                                    // {});
                                    {}, element.updatedDate);
      fileObj.observationItemId = element.observationItemId;
      fileObj.observationInstanceId = element.observationInstanceId;
      fileObj.size = element.size;
      retList.push(fileObj);
    });
    return retList;
  }

  pickFiles(type: FileTypes): any {
    this.selectedTab = type;
    this.showFileUrlCollector = false;
    this.urlValidationError = '';
    this.showFileViewer = false;
  }
  addUrl(): any {
    this.urlValidationError = '';
    this.showFileUrlCollector = !this.showFileUrlCollector;
  }
  uploadFile(): any {
    this.uploadFileSelector.nativeElement.click();
  }
  toggleTagsContainer(): any {
    this.showTagsContainer = !this.showTagsContainer ;
    if (this.showTagsContainer) {
      setTimeout(() => {
        this.tagInput.nativeElement.focus();
      }, 500);
    }
  }
  addNewTag(): any {
    const tag = this.tagInput.nativeElement.value;
    if (this.commonService.isValid(tag)) {
      // this.locationTags.push(tag);
      this.currentSite.tags.push(tag);
    }
    this.tagInput.nativeElement.value = '';
  }

  removeTag(i): any {
    // this.locationTags.splice(i, 1);
    this.currentSite.tags.splice(i, 1);
  }
  getYoutubeEmbedUrl(url): any {
    let retUrl = '';
    if (url.includes('embed')) {
      retUrl = url.trim();
    } else {
      retUrl = 'https://www.youtube.com/embed/' + this.getYoutubeVideoId(url);
    }
    return retUrl;
  }
  getYoutubeVideoId(url): any {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? match[2]
      : null;
  }
  closeNotesPickerFun(decision): any {
    let errorFound = false;
    if (decision === 'yes') {
      if (this.operation !== 'view') {
        errorFound = this.isErrorsFoundWhileValidatingSiteInfo();
        if (!errorFound) {
          console.log('Valid site info found. So, saving site before closing');
          this.saveNotes();
          setTimeout(() => {
            this.sites.forEach(site => {
              this.showOrCloseLocationOnMap(site, 'close');
            });
            this.closeNotesPicker.emit();
          }, 2000);
        } else {
          console.log('Valid site info not found.');
          this.showConfirmClose = false;
        }
      } else {
        this.sites.forEach(site => {
          this.showOrCloseLocationOnMap(site, 'close');
        });
        this.closeNotesPicker.emit();
      }
    } else if (decision === 'no') {
      // this.showConfirmClose = false;
      this.sites.forEach(site => {
        this.showOrCloseLocationOnMap(site, 'close');
      });
      this.closeNotesPicker.emit('without-save');
    }
    if (this.confirmCurrentNotesClosing.type === 'confirm-close' && !errorFound) {
      console.log('IT WAS A REQ FROM CLOSE COMPONENT');
      this.responseOfCurrentNoteCloseRequest.emit(decision);
      this.confirmCurrentNotesClosing = {};
    } else {
      console.log('Errors found. Staying in same page..');
    }
  }

  checkChangesAndClose(): void{
    if ( JSON.stringify(this.initialSiteData) === JSON.stringify(this.currentSite)){
      console.log('SAME DATA');
      this.closeNotesPickerFun('no');
    } else {
      console.log('SOME CHANGE IN DATA');
      this.showConfirmClose = true;
    }
  }

  showCurrentSiteLocation(site): void{

    // CLOSINIG PREVIOUS SITE
    this.showOrCloseLocationOnMap(this.currentSite, 'close');

    //  SETTING NEW SITE TO ACTIVE SITE
    this.currentSite = site;

    // DRAWING AND ZOOMING TO NEW SITE LOCATION ON MAP
    const watchOnPolygonChanges: Subject<any> = new Subject<any>();
    this.watchOnPolygonChangesSubs.unsubscribe();
    this.updatePolygonOnChanges(watchOnPolygonChanges);
    this.showOrCloseLocationOnMap(site, 'zoom', watchOnPolygonChanges);
    // setTimeout(() => {
    // }, 500);
  }
  viewFileInViewer(file, index, totalLength): any {
    this.selectedFileToView = file;
    let leftAvailable = false;
    let rightAvailable = false;
    if (index > 0) {
      leftAvailable = true;
    }
    if (index === 0) {
      leftAvailable = false;
    }
    if ((totalLength - 1) > index) {
      rightAvailable = true;
    }
    if ((totalLength - 1) === index) {
      rightAvailable = false;
    }
    this.selectedFileToView.leftAvailable = leftAvailable;
    this.selectedFileToView.rightAvailable = rightAvailable;
    this.selectedFileToView.index = index;
    this.showFileViewer = true;
  }
  getPreviousFile(): any {
    if (this.selectedTab === FileTypes.IMAGES) {
      const file = this.currentSite.imageFilesList[this.selectedFileToView.index - 1];
      this.viewFileInViewer(file, this.selectedFileToView.index - 1, this.currentSite.imageFilesList.length);
    } else if (this.selectedTab === FileTypes.VIDEOS) {
      const file = this.currentSite.videoFilesList[this.selectedFileToView.index - 1];
      this.viewFileInViewer(file, this.selectedFileToView.index - 1, this.currentSite.videoFilesList.length);
    } else if (this.selectedTab === FileTypes.AUDIOS) {
      const file = this.currentSite.audioFilesList[this.selectedFileToView.index - 1];
      this.viewFileInViewer(file, this.selectedFileToView.index - 1, this.currentSite.audioFilesList.length);
    }
  }
  getNextFile(): any {
    if (this.selectedTab === FileTypes.IMAGES) {
      const file = this.currentSite.imageFilesList[this.selectedFileToView.index + 1];
      this.viewFileInViewer(file, this.selectedFileToView.index + 1, this.currentSite.imageFilesList.length);
    } else if (this.selectedTab === FileTypes.VIDEOS) {
      const file = this.currentSite.videoFilesList[this.selectedFileToView.index + 1];
      this.viewFileInViewer(file, this.selectedFileToView.index + 1, this.currentSite.videoFilesList.length);
    } else if (this.selectedTab === FileTypes.AUDIOS) {
      const file = this.currentSite.audioFilesList[this.selectedFileToView.index + 1];
      this.viewFileInViewer(file, this.selectedFileToView.index + 1, this.currentSite.audioFilesList.length);
    }
  }

  saveSiteNote(): any {
    console.log('In saveSiteNote');
    console.log(this.siteNotesCtrl.value);
    const siteNote = this.siteNotesCtrl.value;
    let fileObj: FileObject;
    if (this.siteNoteOperation === 'add') {
      // fileObj = new FileObject('', FileFormats.URL, '', this.selectedTab, null, '', null, siteNote, {});
      fileObj = new FileObject('', FileFormats.URL, '', this.selectedTab, null, '', null, siteNote, {}, new Date().toISOString);
      this.storeFileObjectInList(fileObj);
    } else if (this.siteNoteOperation === 'update') {
      // fileObj = new FileObject('', FileFormats.URL, '', this.selectedTab, null, '', null, siteNote, {});
      const notesIndex = this.currentSite.geopadNotes.findIndex(val => val.id === this.currentSiteNote.id);
      if (notesIndex !== -1) {
        const tempObj: FileObject = this.currentSite.geopadNotes[notesIndex];
        tempObj.caption = siteNote;
      }
    }
    this.siteNotesCtrl.reset();
    this.siteNoteOperation = 'add';
  }
  editSiteNote(fileObj: FileObject): void {
    this.siteNotesCtrl.setValue(fileObj.caption);
    this.currentSiteNote = fileObj;
    this.siteNoteOperation = 'update';
  }
  removeSiteNote(index): void {
    this.currentSite.geopadNotes.splice(index, 1);
  }
  fileSelected(event): any {
    console.log('fileSelected');
    console.log(event);
    const selectedFiles: FileList = event.target.files;
    this.locationTaggedImages = [];
    console.log(selectedFiles);
    const tempList: Array<File> = [];
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < selectedFiles.length; index++) {
      tempList.push(selectedFiles[index]);
    }
    event.target.value = '';
    let filesListCount = 0;
    let loadedFilesCount = 0;
    tempList.forEach( (file: File) => {
        console.log(URL.createObjectURL(file));
        const base64Data: any = URL.createObjectURL(file);
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        if (this.selectedTab === FileTypes.IMAGES) {
            const fr   = new FileReader(); // to read file contents
            fr.onloadend = (e) => {
              console.log(e);
              const exif = EXIF.readFromBinaryFile(e.target.result);
              console.log(exif);
              let gpsAvailable = false;
              let latitude; let longitude;
              if (exif && this.operation === 'add'){
                const gpsLatitude = this.getIfExist(exif, 'GPSLatitude');
                const gpsLatitudeRef = this.getIfExist(exif, 'GPSLatitudeRef');
                const gpsLongitude = this.getIfExist(exif, 'GPSLongitude');
                const gpsLongitudeRef = this.getIfExist(exif, 'GPSLongitudeRef');

                if (gpsLatitude && gpsLatitudeRef && gpsLongitude && gpsLongitudeRef ) {
                  gpsAvailable = true;
                  latitude = this.convertToDegress(gpsLatitude); // exif.latitude;
                  longitude = this.convertToDegress(gpsLongitude); // exif.longitude;
                  console.log(latitude);
                  console.log(longitude);
                  if (gpsLatitudeRef !== 'N') {
                    latitude = 0 - latitude;
                  }
                  if (gpsLongitudeRef !== 'E'){
                      longitude = 0 - longitude;
                  }
                }
              }

              const img = new Image();
              img.onload = (imgLoadEvent) => {
                console.log(imgLoadEvent);
                const loadedImage: any = imgLoadEvent.currentTarget;
                const width = loadedImage.width;
                const height = loadedImage.height;
                const dimension = { width, height };
                const fileObj: FileObject = new FileObject(file.name, FileFormats.FILE, '', this.selectedTab,
                file, extension.substring(extension.lastIndexOf('.') + 1), base64Data, file.name, dimension, new Date().toISOString(),
                gpsAvailable, latitude, longitude);
                fileObj.size = file.size;
                // this.storeFileObjectInList(fileObj);
                console.log(width);
                console.log(height);
                console.log(file.size);
                // IF LOCATION TAGGED FOUND, MOVE TO TAGGED IMAGES. OTHER WISE, JUST PUSH TO CURRENT SITE
                gpsAvailable ? this.locationTaggedImages.push(fileObj) : this.storeFileObjectInList(fileObj);

                loadedFilesCount++;
                if (filesListCount === loadedFilesCount) {
                  // CHECK FOR LOCATION TAGGED IMAGES
                  console.log('LOADED ALL IMAGES OF SITE');
                  let locationTagFound = false;
                  this.locationTaggedImages.forEach((element: FileObject) => {
                    if (element.gpsAvailable) {
                      locationTagFound = true;
                    }
                  });
                  if (locationTagFound) {
                    console.log('LOCATION TAGGED IMAGES FOUND. SHOWING POPUP TO SPIT SITES');
                    this.showLocationTaggedImages = true;
                  } else {
                    // ADD ALL IMAGE FILES TO CURRENT SITE. WHICH MAY BE ANY SITE
                    console.log('LOCATION TAGGED IMAGES NOT FOUND. ADDING ALL FILES TO CURRENT SITE');
                    this.locationTaggedImages.forEach((element: FileObject) => {
                      this.storeFileObjectInList(element);
                    });
                  }
                } else {
                  console.log('LOADING IMAGES OF STIE');
                }
              };
              img.src = base64Data;
            };
            fr.readAsArrayBuffer(file);
            filesListCount++;
        } else {
            const fileObj: FileObject = new FileObject(file.name, FileFormats.FILE, '', this.selectedTab, file,
                                                extension.substring(extension.lastIndexOf('.') + 1), base64Data,
                                                file.name, {}, new Date().toISOString);
            fileObj.size = file.size;
            this.storeFileObjectInList(fileObj);
        }
    });
    console.log(this);
  }

  getIfExist(data, key): any {
    if (this.commonService.isValid(data[key])){
      return data[key];
    } else{
      return undefined;
    }
  }
  convertToDegress(value): number {
    // console.log(value);
    // """Helper function to convert the GPS coordinates stored in the EXIF to degress in float format"""
    const d0 = value[0].numerator; // [0];
    const d1 = value[0].denominator; // [1];
    const d = d0 / d1;
    // console.log(`Degs : ${d0}, ${d1}, ${d}`);
    const m0 = value[1].numerator; // [0];
    const m1 = value[1].denominator; // [1];
    const m = m0 / m1;
    // console.log(`Mins : ${m0}, ${m1}, ${m}`);
    const s0 = value[2].numerator; // [0];
    const s1 = value[2].denominator; // [1];
    const s = s0 / s1;
    // console.log(`Secs : ${s0}, ${s1}, ${s}`);

    return d + (m / 60.0) + (s / 3600.0);
  }
  addUrlToNotes(): any {
    const url = this.fileUrlInput.nativeElement.value;
    console.log(url);
    this.urlValidationError = '';
    let errorFound = false;
    let extension = '';
    try {
      if (!this.commonService.isValidURL(url)) {
        throw new Error('Invalid URL.');
      }
      const urlWithFileName = url.substr(0, url.lastIndexOf('?'));
      if (url.lastIndexOf('?') === -1) {
        extension = url.substring(url.lastIndexOf('.'));
      } else {
        extension = urlWithFileName.substring(urlWithFileName.lastIndexOf('.'));
      }
      let validExtensions = [];
      if (this.selectedTab === FileTypes.IMAGES) {
        validExtensions = ['.jpg', '.png'];
      } else if (this.selectedTab === FileTypes.VIDEOS) {
        validExtensions = ['.mp4', '.avi', '.mkv'];
      } else if (this.selectedTab === FileTypes.AUDIOS) {
        validExtensions = ['.mp3'];
      } else if (this.selectedTab === FileTypes.DESCRIPTORS) {
        validExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.pdf'];
      }
      const index = validExtensions.findIndex(val => val === extension);
      if (this.selectedTab === FileTypes.VIDEOS && !url.includes('youtube') && !url.includes('youtu') && index === -1) {
          throw new Error('Url invalid. Valid format are <b>' + validExtensions.toString() + '</b>');
      } else if (this.selectedTab !== FileTypes.VIDEOS && index === -1) {
          throw new Error('Url invalid. Valid format are <b>' + validExtensions.toString() + '</b>');
      }
    } catch (e) {
      errorFound = true;
      this.urlValidationError = e;
      setTimeout(() => {
        this.urlValidationError = '';
      }, 5000);
    }
    if (!errorFound) {
      const fileName = '';
      if (this.selectedTab === FileTypes.IMAGES) {
        const img = new Image();
        img.onload = (imgLoadEvent) => {
          const loadedImage: any = imgLoadEvent.currentTarget;
          const width = loadedImage.width;
          const height = loadedImage.height;
          const dimension = { width, height };
          const fileObj: FileObject = new FileObject(fileName, FileFormats.URL, url, this.selectedTab,
                                                      null, extension.substring(extension.lastIndexOf('.') + 1), null, '', dimension, '');
          this.storeFileObjectInList(fileObj);
        };
        img.src = url;
      } else if (this.selectedTab === FileTypes.VIDEOS) {
        let format = FileFormats.URL;
        if (this.selectedTab === FileTypes.VIDEOS && (url.includes('youtube') || url.includes('youtu')) ) {
            format = FileFormats.YOUTUBE;
        }
        const fileObj: FileObject = new FileObject(fileName, format, url, this.selectedTab, null,
                                                extension.substring(extension.lastIndexOf('.') + 1), null, '', {}, '');
        this.storeFileObjectInList(fileObj);
      } else {
        const fileObj: FileObject = new FileObject(fileName, FileFormats.URL, url, this.selectedTab, null,
                                                extension.substring(extension.lastIndexOf('.') + 1), null, '', {}, '');
        this.storeFileObjectInList(fileObj);
      }
      this.showFileUrlCollector = false;
      console.log(this);
    }
  }

  removeSite(site, i): any {
    this.sites.splice(i, 1);
    if (site.id === this.currentSite.id){
      this.showOrCloseLocationOnMap(site, 'close');
      this.currentSite = this.sites[0];
      this.siteNameCtrl.setValue(this.currentSite.locationName);
      this.descriptionCtrl.setValue(this.currentSite.description);
      this.showOrCloseLocationOnMap(this.currentSite, 'zoom');
    }
  }
  createNewSiteWithTaggedImg(tagImg: FileObject, i): any {
    console.log('In createNewSiteWithTaggedImg');
    console.log(tagImg, i);
    

    // CHECKING IF ANY SITES EXIST WITH SAME LOCATION
    const index = this.sites.findIndex(element => {
                    console.log(`${element.latitudeLongitude.toString()} === ${[Number(tagImg.longitude), Number(tagImg.latitude)].toString()}`);
                    if ( element.latitudeLongitude.toString() === [Number(tagImg.longitude), Number(tagImg.latitude)].toString() ){
                      return true;
                    } else {
                      return false;
                    }
                  });
    console.log(index);
    if (index === -1) {
      const tempSite: FuseEarthSite =
          new FuseEarthSite(this.sites.length + 1, new Date().toISOString(), '', [], this.currentSession.geopadId,
            [], [Number(tagImg.longitude), Number(tagImg.latitude)], `Geotag location ${this.sites.length}`, 'Active', [],
            new Date().toISOString(), new Date().toISOString(), SiteType.POINT, this.getCurrentSiteParams(),
            this.initiateVerticalData());
      tempSite.imageFilesList.push(tagImg);
      tempSite.latitudeLongitudeToShow = this.getLatLongsToShow([String(tagImg.longitude), String(tagImg.latitude)]);
      this.sites.push(tempSite);
    } else {
      this.sites[index].imageFilesList.push(tagImg);
    }

    // SETTING DEFAULT LOCATION NAME FOR SITES, IF NOT EXIST
    // this.sites.forEach(element => {
    //   if (!this.commonService.isValid(element.locationName)){
    //     element.locationName = `Site Name ${element.id}`;
    //   }
    // });
    for ( let siteIndex = 0; siteIndex < this.sites.length; siteIndex++){
      if (siteIndex === 0) {
        if (!this.commonService.isValid(this.sites[siteIndex].locationName)){
          this.sites[siteIndex].locationName = `User Location`;
        }
      } else {
        if (!this.commonService.isValid(this.sites[siteIndex].locationName)){
          this.sites[siteIndex].locationName = `Geotag location ${this.sites[siteIndex].id}`;
        }
      }
    }

    // IF SITE NAME FEILD NOT FILLED, FILLING WITH SITE LOCATION NAME
    if (!this.commonService.isValid(this.siteNameCtrl.value)){
      this.siteNameCtrl.setValue(this.currentSite.locationName);
    }

    this.locationTaggedImages.splice(i, 1);
    if (this.locationTaggedImages.length === 0) {
      this.showLocationTaggedImages = false;
    }
    this.sites.forEach(site => {
      site.siteParams = this.getCurrentSiteParams();
    });
    console.log(this);
  }
  addTaggedImgToCurrentSite(tagImg, i): any {
    console.log('In addTaggedImgToCurrentSite');
    console.log(tagImg, i);
    this.currentSite.imageFilesList.push(tagImg);
    this.locationTaggedImages.splice(i, 1);
    if (this.locationTaggedImages.length === 0) {
      this.showLocationTaggedImages = false;
    }
    console.log(this);
  }
  storeFileObjectInList(fileObj: FileObject): any {
    if (this.selectedTab === FileTypes.IMAGES) {
      this.currentSite.imageFilesList.push(fileObj);
      let gpsAvailable = false;
      this.currentSite.imageFilesList.forEach((tempObj: FileObject) => {
        if (tempObj.gpsAvailable) {
          gpsAvailable = true;
        }
      });
      // this.currentSite.hasGpsInFiles = gpsAvailable;

    } else if (this.selectedTab === FileTypes.VIDEOS) {
      this.currentSite.videoFilesList.push(fileObj);
    } else if (this.selectedTab === FileTypes.AUDIOS) {
      this.currentSite.audioFilesList.push(fileObj);
    } else if (this.selectedTab === FileTypes.NOTES) {
      this.currentSite.geopadNotes.push(fileObj);
    } /*else if (this.selectedTab === FileTypes.SCHETCHES) {
      this.currentSite.schetchFilesList.push(fileObj);
    }*/ else if (this.selectedTab === FileTypes.DESCRIPTORS) {
      this.currentSite.descriptorsFilesList.push(fileObj);
    }
  }
  removeFile(i): any {
    if (this.selectedTab === FileTypes.IMAGES) {
      this.currentSite.imageFilesList.splice(i, 1);
      let gpsAvailable = false;
      this.currentSite.imageFilesList.forEach((tempObj: FileObject) => {
        if (tempObj.gpsAvailable) {
          gpsAvailable = true;
        }
      });
      // this.currentSite.hasGpsInFiles = gpsAvailable;
    } else if (this.selectedTab === FileTypes.VIDEOS) {
      this.currentSite.videoFilesList.splice(i, 1);
    } else if (this.selectedTab === FileTypes.AUDIOS) {
      this.currentSite.audioFilesList.splice(i, 1);
    } else if (this.selectedTab === FileTypes.NOTES) {
      this.currentSite.geopadNotes.splice(i, 1);
    } /*else if (this.selectedTab === FileTypes.SCHETCHES) {
      this.currentSite.schetchFilesList.splice(i, 1);
    }*/ else if (this.selectedTab === FileTypes.DESCRIPTORS) {
      this.currentSite.descriptorsFilesList.splice(i, 1);
    }
  }

  isErrorsFoundWhileValidatingSiteInfo(): boolean{
    let errorFound = false;
    this.notesValidationError = '';
    // this.dataToSave = {};
    console.log(this);
    // const notesDescription = this.notesDescription.nativeElement.value;
    // const project = this.projectSelect.value;
    let project = '';
    if (this.userInfo.type === 'INDEPENDENT' || (this.userInfo.type !== 'INDEPENDENT' && this.userRole === 'USER_ADMIN')) {
      project = (this.projectInput.nativeElement.value).trim();
    } else {
      project = this.projectSelect.value;
    }
    // const place = this.placeSelect.value;
    // const topic = this.topicSelect.value;
    let place = '';
    if (this.userInfo.type === 'INDEPENDENT' || (this.userInfo.type !== 'INDEPENDENT' && this.userRole === 'USER_ADMIN')) {
      place = (this.placeInput.nativeElement.value).trim();
    } else {
      place = this.placeSelect.value;
    }
    let topic = '';
    if (this.userInfo.type === 'INDEPENDENT' || (this.userInfo.type !== 'INDEPENDENT' && this.userRole === 'USER_ADMIN')) {
      topic = (this.topicInput.nativeElement.value).trim();
    } else {
      topic = this.topicSelect.value;
    }
    const sites: any[] = this.sites;
    try {
      if (!this.commonService.isValid(this.locationData)) {
        throw new Error('Please select a location');
      }/* else if (!this.commonService.isValid(notesDescription)) {
        throw new Error('Please enter notes');
      }*/
      for (let key = 0; key < sites.length; key++) {
        if (!this.commonService.isValid(sites[key].locationName)){
          const title: any = sites.length > 1 ? key + 1 : '';
          throw new Error(`Please enter name of site ${title}`);
        } else {
          console.log('VALID SITE');
        }
        if (!this.commonService.isValid(sites[key].description)){
          const title: any = sites.length > 1 ? key + 1 : '';
          throw new Error(`Please enter description for site ${title}`);
        } else {
          console.log('VALID DESC FOR SITE');
        }
      }
      if (!this.commonService.isValid(project)) {
        throw new Error('Please select project');
      } else if (!this.commonService.isValid(place)) {
        throw new Error('Please select place');
      } else if (!this.commonService.isValid(topic)) {
        throw new Error('Please select topic');
      }

    } catch (e) {
      console.log(e);
      errorFound = true;
      this.notesValidationError = e;
      setTimeout(() => {
        this.notesValidationError = '';
      }, 5000);
    }
    return errorFound;
  }
  saveNotes(): any {
    if (this.isGuest) {
      window.alert('Please login to do this...');
      return ;
    }
    if (this.globalObject.pageType === 'share') {
      this.showSessionShareSiteEditAlert = true;
      // window.alert('You do not have edit rights for this session..');
      return ;
    }
    const errorFound = this.isErrorsFoundWhileValidatingSiteInfo();
    const sites: any[] = this.sites;

    if (!errorFound){
      if (!this.commonService.isValid(this.currentSession.geopadId)){
        this.currentSession.geopadId = 0;
      }
      this.siteRequestSent = 0;
      this.siteRequestReceived = 0;
      sites.forEach(site => {
        console.log('Saving site :', site);
        this.siteRequestSent++;
        this.saveNotesOfaSite(site);
      });
      // } else {
      //   window.alert('Geopad id not found.');
      // }
    }
  }
  saveNotesOfaSite(currentSite): any {

    currentSite.dataToSave = {};
    console.log(this);
    const notesDescription = currentSite.description; // this.notesDescription.nativeElement.value;

    let projectId = '';
    let placeId = '';
    let topicId = '';

    if (this.userInfo.type === 'INDEPENDENT' || (this.userInfo.type !== 'INDEPENDENT' && this.userRole === 'USER_ADMIN')) {
      console.log('IT IS INDEPENDENT USER OR ORG ADMIN');
      const project = (this.projectInput.nativeElement.value).trim();
      const projectIndex = this.projects.findIndex(val => val.name === project);
      if (projectIndex !== -1){
        projectId = this.projects[projectIndex].topicId;
      }

      const place = (this.placeInput.nativeElement.value).trim();
      const placeIndex = this.places.findIndex(val => val.name === place);
      if (placeIndex !== -1){
        placeId = this.places[placeIndex].topicId;
      }
      // placeId = this.placeSelect.value;

      const topic = (this.topicInput.nativeElement.value).trim();
      const topicIndex = this.topics.findIndex(val => val.name === topic);
      if (topicIndex !== -1){
        topicId = this.topics[topicIndex].topicId;
      }
      // topicId = this.topicSelect.value;
    } else {
      console.log('IT IS ORG NON ADMIN');
      projectId =  this.projectSelect.value;
      placeId = this.placeSelect.value;
      topicId = this.topicSelect.value;
    }

    const siteNameInput = currentSite.locationName;

    // MERGING ALL FILES TO SINGLE ARRAY TO GENERATE URLS
    currentSite.filesList = [];
    currentSite.filesList = currentSite.filesList.concat(
      currentSite.imageFilesList, currentSite.videoFilesList, currentSite.audioFilesList,
      currentSite.descriptorsFilesList, currentSite.geopadNotes
    );

    currentSite.filesList = currentSite.filesList; // .filter(val => val.observationItemId === 0);

    const data: any = {
      observationInstanceId: currentSite.observationInstanceId,
      locationName: siteNameInput,
      description: notesDescription,
      geopadId: this.currentSession.geopadId,
      geopadNotes: '',
      uiTimestamp: new Date().toISOString(),
      tags: currentSite.tags, // this.locationTags,
      status: 'Active',
      projectId, // project, // 1,
      topicId, // topic, // 3,
      placeId, // place, // 7,
      latitudeLongitude: currentSite.latitudeLongitude,
      siteType: currentSite.siteType,
      iconColour: '',
      fillColour: '',
      iconLineSize: '',
      iconRotation: 0,
      fillColourOpacity: 4,
      obseravationInstanceIconsId: null,
      verticalData: this.commonService.isValid(currentSite.verticalData) ? JSON.stringify(currentSite.verticalData) : null
    };

    const siteParams: SiteParams = currentSite.siteParams;
    if (this.commonService.isValid(siteParams)){
      if (currentSite.siteType === SiteType.POINT){
        data.iconColour = siteParams.color;
        data.iconLineSize = siteParams.symbolSize;
        data.iconRotation = siteParams.rotationAngle;
        data.fillColourOpacity = 4;
        if (this.commonService.isValid(siteParams.icon)){
          data.obseravationInstanceIconsId = siteParams.icon.id;
        }
      } else {
        data.iconColour = siteParams.color;
        data.fillColour = siteParams.fillColor;
        data.iconLineSize = siteParams.symbolSize;
        data.iconRotation = siteParams.rotationAngle;
        data.fillColourOpacity = 4;
        if (this.commonService.isValid(siteParams.icon)){
          data.obseravationInstanceIconsId = siteParams.icon.id;
        }
      }
    }

    // data.placeId = 7;
    // data.topicId = 3;

    console.log(data);
    console.log(currentSite);
    /* if (!this.commonService.isValid(data.projectId)){
      // window.alert('Project Id not found');
      this.savingNotes.emit(true);
      const projectData: any = {
        organizationId: 1,
        name: this.projectInput.nativeElement.value,
        description: '',
        parentTopicId: 0,
        topicUsage: 1,
        status: 'Active'
      };
      this.topicsService.saveNewProjectForOrg(projectData)
            .subscribe(projectRes => {
              console.log('NEW PROJECT CREATED');
              console.log(projectRes);
              data.projectId = projectRes.body;
              this.saveNoteWithProject(currentSite, data);
              this.getProjectsList();
            },
            error => {
              console.log('ERROR WHILE CREATING NEW PROJECT');
              console.log(error);
              let msg = 'New project creation failed. Please try again.';
              if (this.commonService.isValid(error)){
                if (this.commonService.isValid(error.error)){
                  msg = error.error.message || msg;
                }
              }
              this.notesValidationError = msg;
              this.savingNotes.emit(false);
            });
    } else {
      this.saveNoteWithProject(currentSite, data);
    } */
    this.processProjectSaving(currentSite, data);

  }

  processProjectSaving(currentSite, data): void{
    if (!this.commonService.isValid(data.projectId)){
      this.savingNotes.emit(true);
      const projectData: any = this.prepareObjectOfTopics((this.projectInput.nativeElement.value).trim(), 'project');
      // this.topicsService.saveNewProjectForOrg(projectData)
      this.topicsService.saveTopics(projectData)
            .subscribe(projectRes => {
              console.log('NEW PROJECT CREATED');
              console.log(projectRes);
              data.projectId = projectRes.body;
              // this.saveNoteWithProject(currentSite, data);
              this.processPlaceSaving(currentSite, data);
              this.getProjectsList();
            },
            error => {
              console.log('ERROR WHILE CREATING NEW PROJECT');
              console.log(error);
              let msg = 'New project creation failed. Please try again.';
              if (this.commonService.isValid(error)){
                if (this.commonService.isValid(error.error)){
                  msg = error.error.message || msg;
                }
              }
              this.notesValidationError = msg;
              setTimeout(() => {
                this.notesValidationError = '';
              }, 5000);
              this.savingNotes.emit(false);
            });
    } else {
      // this.saveNoteWithProject(currentSite, data);
      this.processPlaceSaving(currentSite, data);
    }
  }
  processPlaceSaving(currentSite, data): void{
    // here we need call place have new entered name?
    if (!this.commonService.isValid(data.placeId)){
      const placeData: any = this.prepareObjectOfTopics((this.placeInput.nativeElement.value).trim(), 'place');
      placeData.parentTopicId = data.projectId;
      this.topicsService.saveTopics(placeData)
        .subscribe(placeRes => {
          console.log('NEW Place CREATED', placeRes);
          data.placeId = placeRes.body;
          this.processTopicSaving(currentSite, data);
      }, error => {
        console.log('ERROR WHILE CREATING NEW PROJECT');
        console.log(error);
        let msg = 'New place creation failed. Please try again.';
        if (this.commonService.isValid(error)){
          if (this.commonService.isValid(error.error)){
            msg = error.error.message || msg;
          }
        }
        this.notesValidationError = msg;
        setTimeout(() => {
          this.notesValidationError = '';
        }, 5000);
        this.savingNotes.emit(false);
      });
    } else {
      // this.saveNoteWithProject(currentSite, data);
      this.processTopicSaving(currentSite, data);
    }
  }

  processTopicSaving(currentSite, data): void{
    // here we need call Topic have new entered name?
    if (!this.commonService.isValid(data.topicId)){
      const topicData: any = this.prepareObjectOfTopics((this.topicInput.nativeElement.value).trim(), 'topic');
      topicData.parentTopicId = data.placeId;
      this.topicsService.saveTopics(topicData)
        .subscribe(topicRes => {
          console.log('NEW Topic CREATED', topicRes);
          data.topicId = topicRes.body;
          this.saveNoteWithProject(currentSite, data);
      }, error => {
        console.log('ERROR WHILE CREATING NEW Topic');
        console.log(error);
        let msg = 'New Topic creation failed. Please try again.';
        if (this.commonService.isValid(error)){
          if (this.commonService.isValid(error.error)){
            msg = error.error.message || msg;
          }
        }
        this.notesValidationError = msg;
        setTimeout(() => {
          this.notesValidationError = '';
        }, 5000);
        this.savingNotes.emit(false);
      });
    } else {
      this.saveNoteWithProject(currentSite, data);
    }
  }

  prepareObjectOfTopics(topicName, topicType): any{
    return {
      organizationId: this.currentSession.organizationId,
      name: topicName,
      description: '',
      parentTopicId: 0,
      topicUsage: 1,
      status: 'Active',
      userId: this.userProfileData.user.userId,
      topicType
    };
  }

  saveNoteWithProject(currentSite, data): void{
    currentSite.dataToSave = data;


    // GETTING FILES LIST, THAT NEEDS TO BE UPLOADED
    let index = 0;
    currentSite.filesToSave = [];
    currentSite.filesList.forEach((element: FileObject) => {
      element.id = `${String(new Date().getTime())}_${index++}`;
      if (element.format === FileFormats.URL){
        console.log('IT IS AN IMAGE URL');
      } else if (element.format === FileFormats.FILE){
        console.log('IT IS FILE OBJECT');
        console.log(element);
        currentSite.filesToSave.push(element);
      }
    });


    // GENERATE URLS AND SAVE SITES
    currentSite.generatedUrlsCount = 0;
    console.log('Files to save', currentSite.filesToSave);
    console.log(currentSite);

    this.savingNotes.emit(true);
    if (currentSite.filesToSave.length > 0) {
      // UPLOAD FILES TO FIREBASE
      console.log('SAVE FILES FIRST AND DO LATER');
      currentSite.filesToSave.forEach((element: FileObject) => {
        console.log(element);
        this.firebaseService.uploadFileAndGetURL(element.file, element.type, element.id, currentSite.id,
          'geopad', this.imageUploadAbservable);
        // UPLOAD WILL BE RECEIVED IN uploadStatusEvent FUNCTION
      });
    } else {
      // SAVE NOTES DIRECTLY..
      console.log('SAVING NOTE DIRECTLY...');
      currentSite.dataToSave.observationItemInfoList = currentSite.filesList;
      if (this.operation === 'add') {
        this.callSaveNotes(currentSite);
      } else if (this.operation === 'update') {
        this.callUpdateNotes(currentSite);
      }
    }

  }

  uploadStatusEvent(data: any): any {
    // GET UPLOADED FILE URLs AND SAVE NOTES
    console.log('IN on event');
    console.log(data);

    // GETTING CURRENT SITE INFO
    const siteIndex = this.sites.findIndex(val => val.id === data.siteId);
    let currentSite: any = {};
    if (siteIndex !== -1) {
      currentSite = this.sites[siteIndex];
    }

    // STORING FILE URL OF CURRENT SITE
    if (data.status === 'completed' || data.status === 'error') {
      currentSite.generatedUrlsCount++;
      const index = currentSite.filesToSave.findIndex((val: FileObject) => val.id === data.id);
      if (index !== -1) {
        currentSite.filesToSave[index].url = data.url;
      }
    }

    // CHECKING IF ALL URLs GENERATED
    if (currentSite.generatedUrlsCount === currentSite.filesToSave.length) {
      console.log('ALL FILES ARE UPLOADED...');
      currentSite.filesToSave.forEach(element => {
        const index = currentSite.filesList.findIndex((val: FileObject) => val.id === element.id);
        if (index !== -1) {
          currentSite.filesList[index] = element;
        }
      });
      currentSite.filesList.forEach((element: FileObject) => {
        element.format  = FileFormats.URL;
        element.file = null;
        element.base64Data = null;
      });
      console.log(currentSite.filesList);
      currentSite.dataToSave.observationItemInfoList = currentSite.filesList;
      if (this.operation === 'add') {
        this.callSaveNotes(currentSite);
      } else if (this.operation === 'update') {
        this.callUpdateNotes(currentSite);
      }

    } else {
      console.log('FILES UPLOAD IS GOING ON...');
    }
    console.log(this.filesToSave);

  }

  callSaveNotes(currentSite): any {
    // CAll API HERE TO SAVE NOTES
    // setTimeout(() => {
    //   this.capturedData.emit(this.dataToSave);
    //   this.savingNotes.emit(false);
    // }, 300);
    console.log('In callSaveNotes');
    console.log(currentSite);
    if (currentSite.dataToSave.obseravationInstanceIconsId === null) {
      currentSite.dataToSave.obseravationInstanceIconsId = 0;
      const msg = `Please Select at lest one drop down from Type of Site`;
      this.notesValidationError = msg;
      setTimeout(() => {
        this.notesValidationError = '';
      }, 5000);
      this.savingNotes.emit(false);
      this.siteRequestReceived++;
      if (this.siteRequestSent === this.siteRequestReceived){
        this.savingNotes.emit(false);
      }
      return;
    }
    this.notepadService.saveSingleSite(currentSite.dataToSave, this.currentSession.geopadId)
        .subscribe(result => {
          console.log(result);
          this.siteRequestReceived++;
          if (this.siteRequestSent === this.siteRequestReceived){
            this.capturedData.emit(currentSite);
            this.savingNotes.emit(false);
            this.sites.forEach(site => {
              this.showOrCloseLocationOnMap(site, 'close');
            });
          }
        },
        error => {
          console.log('Error while saving notes');
          console.log(error);
          let msg = `Error while saving site ${currentSite.dataToSave.locationName}`;
          if (this.commonService.isValid(error)){
            if (this.commonService.isValid(error.error)){
              msg = error.error.message || msg;
            }
          }
          this.notesValidationError = msg;
          setTimeout(() => {
            this.notesValidationError = '';
          }, 5000);
          this.savingNotes.emit(false);
          this.siteRequestReceived++;
          if (this.siteRequestSent === this.siteRequestReceived){
            this.savingNotes.emit(false);
          }
        });
  }

  callUpdateNotes(currentSite): any {

    console.log('In callUpdateNotes');
    console.log(currentSite);
    this.notepadService.updateSingleSite(currentSite.dataToSave, this.currentSession.geopadId, this.currentSite.id)
        .subscribe(result => {
          console.log(result);
          this.siteRequestReceived++;
          console.log(`Sent: ${this.siteRequestSent}, Recv: ${this.siteRequestReceived}`);
          if (this.siteRequestSent === this.siteRequestReceived) {
            this.capturedData.emit(currentSite);
            this.savingNotes.emit(false);
            this.sites.forEach(site => {
              this.showOrCloseLocationOnMap(site, 'close');
            });
          }
        },
        error => {
          console.log('Error while saving notes');
          console.log(error);
          let msg = `Error while saving site ${currentSite.dataToSave.locationName}`;
          if (this.commonService.isValid(error)){
            if (this.commonService.isValid(error.error)){
              msg = error.error.message || msg;
            }
          }
          this.notesValidationError = msg;
          setTimeout(() => {
            this.notesValidationError = '';
          }, 5000);
          this.savingNotes.emit(false);
          this.siteRequestReceived++;
          if (this.siteRequestSent === this.siteRequestReceived){
            this.savingNotes.emit(false);
          }
        });
  }

  getProjectsList(): any {
    console.log('getting the projects list');
    this.projectSelect.disable();
    this.placeSelect.disable();
    this.topicSelect.disable();
    this.getPlacesListByProjectId(1);
    this.getTopicsListByPlaceId(1);
    this.topicsService.getProjectsList(this.globalObject.pageType === 'COVID19' ? 'COVID19' : this.userInfo.type,
                                      this.globalObject.geobase.organizationId)
    .subscribe(projectInfo => {
      if (this.operation !== 'view') {
        this.projectSelect.enable();
      }
      console.log('Got projectInfo info', projectInfo);
      if (!this.commonService.isValid(projectInfo)) {
        console.log('No projectInfo present');
        // this.getPlacesListByProjectId(1);
      } else {
        console.log('projectInfo present', projectInfo);
        // this.projects = projectInfo;
        this.projects = [{name: '', topicId: ''}].concat(projectInfo);
        if (this.commonService.isValid(this.selectedProjectId) && this.selectedProjectId > 0) {
          const index = this.projects.findIndex(val => Number(val.topicId) === Number(this.selectedProjectId));
          if (index !== -1){
            this.selectedProject = this.projects[index];
          }
          console.log('SELECTED PROJECT : ', this.selectedProject);
        }
        setTimeout(() => {
          this.setDataToFormControl(this.projectSelect, this.projectInput, this.selectedProject, this.projects);
        }, 500);
        // this.getPlacesListByProjectId(projectInfo[0].topicId);
        // this.projectId = projectInfo[0].topicId;
      }
    }, error => {
      console.log('Error while getting projectInfo');
      console.log(error);
      if (error.errorCode === 500) {
      }
      if (this.operation !== 'view') {
        this.projectSelect.enable();
      }
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
        if (this.operation !== 'view') {
          this.placeSelect.enable();
        }
        console.log('Got placesInfo info', placesInfo);
        if (!this.commonService.isValid(placesInfo)) {
          console.log('No placesInfo present');
          // this.places = [{
          //   name: 'Southern California',
          //   topicId: 7
          // }];
        } else {
        console.log('placesInfo present', placesInfo);
        this.places = [{name: '', topicId: ''}].concat(placesInfo);
      // this.places = placesInfo;

      /* this.places = [{
          name: 'Southern California',
          topicId: 7
      }]; */
        if (this.commonService.isValid(this.selectedPlaceId) && this.selectedPlaceId > 0) {
        const index = this.places.findIndex(val => Number(val.topicId) === Number(this.selectedPlaceId));
        if (index !== -1){
          this.selectedPlace = this.places[index];
        }
        console.log('SELECTED PROJECT : ', this.selectedPlace);
      }
        setTimeout(() => {
        this.setDataToFormControl(this.placeSelect, this.placeInput, this.selectedPlace, this.places);
      }, 500);

          // this.getTopicsListByPlaceId(placesInfo[0].topicId);
          // this.placeId = placesInfo[0].topicId;
      }
      }, error => {
        console.log('Error while getting placesInfo');
        console.log(error);
        if (error.errorCode === 500) {
        }
        if (this.operation !== 'view') {
          this.placeSelect.enable();
         }
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
      if (this.commonService.isValid(this.selectedPlaceId) && this.selectedPlaceId > 0) {
        const index = this.places.findIndex(val => Number(val.topicId) === Number(this.selectedPlaceId));
        if (index !== -1){
          this.selectedPlace = this.places[index];
        }
        console.log('SELECTED PROJECT : ', this.selectedPlace);
      }
      setTimeout(() => {
        this.setDataToFormControl(this.placeSelect, this.placeInput, this.selectedPlace, this.places);
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
         if (this.operation !== 'view') {
           this.topicSelect.enable();
         }
         console.log('Got topicsInfo info', topicsInfo);
         if (!this.commonService.isValid(topicsInfo)) {
           console.log('No topicsInfo present');
          //  this.topics = [{
          //   name: 'Geo-Engineering',
          //   topicId: 3
          //   }];
         } else {
           console.log('topicsInfo present', topicsInfo);
           this.topics = [{name: '', topicId: ''}].concat(topicsInfo);
      //     this.topics = topicsInfo;
      /* this.topics = [{
          name: 'Geo-Engineering',
          topicId: 3
        }]; */
           if (this.commonService.isValid(this.selectedTopicId) && this.selectedTopicId > 0) {
        const index = this.topics.findIndex(val => Number(val.topicId) === Number(this.selectedTopicId));
        if (index !== -1){
          this.selectedTopic = this.topics[index];
        }
        console.log('SELECTED PROJECT : ', this.selectedTopic);
      }
           setTimeout(() => {
        this.setDataToFormControl(this.topicSelect, this.topicInput, this.selectedTopic, this.topics);
      }, 500);
      //     // this.topicId = topicsInfo[0].topicId;
         }
       }, error => {
         console.log('Error while getting topicsInfo');
         console.log(error);
         if (error.errorCode === 500) {
         }
         if (this.operation !== 'view') {
           this.topicSelect.enable();
         }
       });
    } else {
      this.topicsService.getTopicsListByPlaceId(placeId)
            .subscribe(topicsInfo => {
              if (this.operation !== 'view') {
                this.topicSelect.enable();
              }
              console.log('Got topicsInfo info', topicsInfo);
              if (!this.commonService.isValid(topicsInfo)) {
                console.log('No topicsInfo present');
              } else {
                console.log('topicsInfo present', topicsInfo);
                // this.topics = topicsInfo;
                this.topics = [{name: '', topicId: ''}].concat(topicsInfo);
                if (this.commonService.isValid(this.selectedTopicId) && this.selectedTopicId > 0) {
                  const index = this.topics.findIndex(val => Number(val.topicId) === Number(this.selectedTopicId));
                  if (index !== -1){
                    this.selectedTopic = this.topics[index];
                  }
                  console.log('SELECTED PROJECT : ', this.selectedTopic);
                }
                setTimeout(() => {
                  this.setDataToFormControl(this.topicSelect, this.topicInput, this.selectedTopic, this.topics);
                }, 500);
                // this.topicId = topicsInfo[0].topicId;
              }
            }, error => {
              console.log('Error while getting topicsInfo');
              console.log(error);
              if (error.errorCode === 500) {
              }
              if (this.operation !== 'view') {
                this.topicSelect.enable();
              }
            });
    }

  }

  setDataToFormControl(formCtrl: FormControl, inputEle: ElementRef<HTMLInputElement>, selectedObj: any, allListArr: any[]): any {
    let topicId;
    let topicName;
    try{
      if (this.commonService.isValid(selectedObj)) {
        if (this.commonService.isValid(selectedObj.topicId)) {
          topicId = selectedObj.topicId;
          topicName = selectedObj.name;
        } else {
          topicId = allListArr[0].topicId;
          topicName = allListArr[0].name;
        }
      } else{
        topicId = allListArr[0].topicId;
        topicName = allListArr[0].name;
      }
    } catch (e){
      topicId = '';
      topicName = '';
    }
    formCtrl.setValue(topicId);
    if (inputEle) {
      inputEle.nativeElement.value = topicName;
    }
  }

  updateSiteStyleOnMap(note: FuseEarthSite): any{
    const id = this.commonService.isValid(note.observationInstanceId) ? note.observationInstanceId :
               this.tempCreateSiteId; // note.latitudeLongitude.toString();
    const name = `observationInstanceId_${id}`;

    let layerFound = false;
    let addedLayerObj: any;
    this.basemap.getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        if (layerObj.values_.name === name) {
          layerFound = true;
          addedLayerObj = layerObj;
        }
      }
    });
    if (layerFound) {
      console.log('REDRAWING POINT OR POLYGON');
      this.notepadService.updateSiteStyle(addedLayerObj, note.siteParams);
    }
  }
  showOrCloseLocationOnMap(note: FuseEarthSite, operation = '', watchOnPolygonChanges = null): any {
    console.log('In showLocationOnMap, OP: ', operation);
    console.log(note);
    console.log(this);
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
        type: this.notepadService.shapeDrawType.POINT, // 'Point',
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
        type: isPolygon ? this.notepadService.shapeDrawType.POLYGON : this.notepadService.shapeDrawType.LINE_STRING,
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
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: null
        }]
      },
      name: /*`${note.locationName}_${id}` /*/ `observationInstanceId_${id}`
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
    if (layerFound) {
      console.log('REMOVING POINT OR POLYGON');
      // this.basemap.removeLayer(addedLayerObj);
      this.notepadService.removeLayerFromMap(this.basemap, data.name);

    } else if (operation === '' || operation === 'zoom') {
      // ONLY OF OPERATION is '', IT SHOULD WORK IN TOGGLE MODE
      if (note.latitudeLongitude.length === 2) {
        console.log('ADDING POINT');
        this.notepadService.reDrawPointOrPolygonOnMap(this.notepadService.shapeDrawType.POINT, data,
                operation === 'zoom', watchOnPolygonChanges, currentContextInfo, siteParams);
      } else if (note.latitudeLongitude.length > 2) {
        console.log('ADDING POLYGON');
        // this.notePadService.reDrawPolygonInMap(data, true);

        // LINE or PLOYGON is ok here.
        this.notepadService.reDrawPointOrPolygonOnMap(
                isPolygon ? this.notepadService.shapeDrawType.POLYGON : this.notepadService.shapeDrawType.LINE_STRING,
                data, operation === 'zoom', watchOnPolygonChanges, currentContextInfo, siteParams);
      }
    }

    // console.log(data);
  }


  setValueForInputFromSelect(event, inputFrom: string, listItems: any[]): void{
    // setTimeout(() => {
      console.log(event);
      // console.log(inputEle);
      const val = event.target.value;
      let nameToSet = '';
      const index = listItems.findIndex(item => String(item.topicId) === String(val));
      if (index !== -1){
        nameToSet = listItems[index].name;
      }
      // inputEle.nativeElement.value = nameToSet;
      try{
        if (inputFrom === 'project') {
          this.projectInput.nativeElement.value = nameToSet;
        } else if (inputFrom === 'place') {
          this.placeInput.nativeElement.value = nameToSet;
        } else if (inputFrom === 'topic') {
          this.topicInput.nativeElement.value = nameToSet;
        }
      } catch (e){

      }
    // }, 2000);
  }

  downloadFile(file: FileObject): void{
    window.open(file.url, '_blank');
    // this.notepadService.downloadFile(file.url, file.name)
    //       .subscribe(res => {
    //         console.log('Download complete...');
    //         console.log(res);
    //         if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    //           // To IE or Edge browser, using msSaveorOpenBlob method to download file.
    //           window.navigator.msSaveOrOpenBlob(res.data, res.filename);
    //         } else {
    //           const url = window.URL.createObjectURL(res.data);
    //           const a = document.createElement('a');
    //           document.body.appendChild(a);
    //           a.setAttribute('style', 'display: none');
    //           a.href = url;
    //           a.download = res.filename;
    //           a.click();
    //           window.URL.revokeObjectURL(url);
    //           a.remove();
    //         }
    //       }, error => {
    //         console.log('Download failed...');
    //         console.log(error);
    //       });
  }
  getSiteIconsDropDown(iconCategory, iconSubCategory): any {
    this.notepadService.getSiteIconInfo(iconCategory, iconSubCategory)
    .subscribe (generalSiteIcons => {
      console.log('Got SiteIcons info', iconCategory, iconSubCategory, generalSiteIcons);
      if (!this.commonService.isValid(generalSiteIcons)) {
        console.log('No SiteIcons present');
      } else {
        console.log('SiteIcons present', generalSiteIcons);
        if (generalSiteIcons.length > 0) {
          generalSiteIcons.forEach(iconInfo => {
            console.log('iconInfo ', iconInfo, iconInfo.name, iconCategory);
            const rowData = {name: iconInfo.name, imgUrl: iconInfo.url, value: iconInfo.iconType,
              id: iconInfo.observationInstanceIconsId,
              iconCategory: iconInfo.iconCategory, iconSubCategory: iconInfo.iconSubCategory, iconType: iconInfo.iconType };
            if (iconCategory === 'General') {
              this.generalSiteIconsList.push(rowData);
            } else if (iconCategory === 'Special') {
              this.specialSiteIconsList.push({ name: iconInfo.name, imgUrl: iconInfo.url,
                      value: iconInfo.iconType, id: iconInfo.observationInstanceIconsId,
                      iconCategory: iconInfo.iconCategory, iconSubCategory: iconInfo.iconSubCategory, iconType: iconInfo.iconType});
            }  else if (iconCategory === 'Custom') {
              this.customSiteIconsList.push({ name: iconInfo.name, imgUrl: iconInfo.url,
                      value: iconInfo.iconType, id: iconInfo.observationInstanceIconsId,
                      iconCategory: iconInfo.iconCategory, iconSubCategory: iconInfo.iconSubCategory, iconType: iconInfo.iconType});
            }
          });
          console.log('iconInfo output', this.generalSiteIconsList, iconCategory);
          if (this.operation === 'add' || !this.commonService.isValid(this.generalSiteSelectedIcon) ||
            (this.operation === 'update' && !this.commonService.isValid(this.currentSite.siteParams.icon.id)) ) {
            this.generalSiteSelectedIcon = this.generalSiteIconsList[0];
            this.currentSiteIcon = this.generalSiteIconsList[0];
            this.selectSiteIcon('general', this.currentSite.siteType === this.siteTypeEnum.POINT ?
                                  this.siteTypeEnum.POINT : this.siteTypeEnum.LINE, this.generalSiteSelectedIcon);
          }
          if (this.customSiteIconsList.length > 0 &&
              (this.operation === 'add' || !this.commonService.isValid(this.customSiteSelectedIcon.imgUrl)) ) {
            this.customSiteSelectedIcon = this.customSiteIconsList[0];
          }
          if (this.specialSiteIconsList.length > 0 &&
              (this.operation === 'add' || !this.commonService.isValid(this.specialSiteSelectedIcon.imgUrl)) ) {
            this.specialSiteSelectedIcon = this.specialSiteIconsList[0];
          }
        }
      }
      this.initialSiteData = this.commonService.getObjectClone(this.currentSite);
    }, error => {
      console.log('Error while getting generalSiteIcons');
      console.log(error);
      if (error.errorCode === 500) {
      }
    });
    console.log('this.generalSiteIconsList ', this.generalSiteIconsList);
  }

  onCustomPointIconUpload(event): any {
    if (event.target.files.length > 0) {
      // Here need to add validation for uploading icon
      const convertedSize = (event.target.files[0].size / (1024 * 1024)).toFixed(1);
      if (Number(convertedSize) > 1) {
      const msg = `Icon size should be less than 1 MB`;
      this.notesValidationError = msg;
      setTimeout(() => {
        this.notesValidationError = '';
      }, 5000);
      return;
      }
      const returnData = {
        inputFiles: event.target.files[0],
        filetype: 'site_icons/custom',
        fileName: event.target.files[0].name,
        firebaseUrl: '',
        metadata: ''
      };
      console.log(event.target.files);
      const firebaseUtil = new FirebaseUtil(this.firestorage);
      firebaseUtil.firebaseUtilCallback = (firebaseFileURL) => {
        returnData.firebaseUrl = firebaseFileURL;
        console.log('getting firebase downlodable url ', returnData);
        const customIconInfo = {
          iconCategory: 'Custom',
          iconSubCategory: 'Point',
          iconType: 'Custom',
          name: returnData.fileName,
          url: firebaseFileURL,
          organizationId: this.currentSession.organizationId,
          userId: this.userProfileData.user.userId,
          status: 'ACTIVE'
        };
        this.notepadService.saveCustomSiteIconInfo(customIconInfo)
        .subscribe(result => {
          console.log(result);
          this.getSiteIconsDropDown('Custom', SiteType.POINT);
        },
        error => {
          console.log('Error while saving custom icons');
          console.log(error);
          let msg = `Error while saving custom site icon`;
          if (this.commonService.isValid(error)){
            if (this.commonService.isValid(error.error)){
              msg = error.error.message || msg;
            }
          }
          this.notesValidationError = msg;
          setTimeout(() => {
            this.notesValidationError = '';
          }, 5000);
        });
      };
      firebaseUtil.getFirebaseFileURL(returnData.inputFiles, returnData.filetype, returnData.metadata, this.progress);

    }
  }
  setDefaultPosition(event): any {
    this._updateDraggableObj();
    this._setRotation(0);
    this.redrawSiteOnMap();

  }

  private _updateDraggableObj(): any {
    Draggable.create('#siteIconRotationAngNeedle', {
      type: 'rotation',
      throwProps: true,
      // bounds: { minRotation: -23, maxRotation: 337 },
      onDrag: (e) => {
        console.log('drag start ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'siteIconRotationAngNeedle') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          // console.log(element);
          // console.log(element._gsTransform);
          let angle = element._gsTransform.rotation;
          // console.log(e, angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          console.log('INVALID TARGET...');
        }
      },
      onDragEnd: (e) => {
        console.log('drag end ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'siteIconRotationAngNeedle') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          let angle = element._gsTransform.rotation;
          console.log(angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          console.log('INVALID TARGET...');
        }
      }
    });
    const globeIconDraggable = Draggable.get('#siteIconRotationAngNeedle');
    TweenLite.set('#siteIconRotationAngNeedle', { rotation: 0 });
    globeIconDraggable.update();
  }

  addNewColumn(direction): void{
    console.log('addNewColumn', direction);
    const id = new Date().getTime();
    if (direction === 'left'){
      this.currentSite.verticalData.headers = [{name: '', id, order: null}].concat(this.currentSite.verticalData.headers);
    } else if (direction === 'right'){
      this.currentSite.verticalData.headers.push({name: '', id, order: null});
    }
    this.setOrderForVerticalInfoHeaders();
  }
  removeColumn(index): void{
    console.log('removeColumn');
    let fieldName = '';
    // if (direction === 'left'){
    //   if (this.currentSite.verticalData.headers.length > 0){
    //     fieldName = this.currentSite.verticalData.headers[index].id; // .name;
    //     this.currentSite.verticalData.headers.splice(index, 1);
    //   }
    // } else if (direction === 'right'){
    if (this.currentSite.verticalData.headers.length > 0){
      fieldName = this.currentSite.verticalData.headers[index].id; // .name;
      this.currentSite.verticalData.headers.splice(index, 1);
    }
    // }
    this.setOrderForVerticalInfoHeaders();
    this.currentSite.verticalData.body.forEach(element => {
      try{
        delete element[fieldName];
      } catch (e){
        console.log(e);
      }
    });
  }
  setOrderForVerticalInfoHeaders(): void{
    this.currentSite.verticalData.headers.forEach((element, index) => {
      element.order = index;
    });
    console.log(this.currentSite.verticalData);
  }
  addRow(): void{
    console.log('addRow');
    const row: any = {};
    this.currentSite.verticalData.headers.forEach((element, index) => {
      // row[element.name] = '';
      row[element.id] = '';
    });
    this.currentSite.verticalData.body.push(row);
    console.log(this.currentSite.verticalData);
  }
  removeRow(index): void{
    console.log('removeRow');
    if (this.currentSite.verticalData.body.length > 0){
      this.currentSite.verticalData.body.splice(index, 1);
    }
    console.log(this.currentSite.verticalData);
  }
  
}
