import { Component, HostListener, ViewChild, ElementRef, Output, EventEmitter, Input, SimpleChange, OnChanges, AfterViewInit, Renderer2 } from '@angular/core';
import { GeotrayService } from './geotray.service';
import { BasemapService } from '../basemap/basemap.service';
import { GeoPopupComponent } from '../geopopup/geopopup.component';
import { AuthObservableService } from '../Services/authObservableService';
import { CommonService } from '../Services/common.service';
import { AnalyticsService } from '../Services/analytics.service';
import { environment } from 'src/environments/environment';
import { GeotrayMenuComponent } from './geotray-menu/geotray-menu.component';
import {MatExpansionModule} from '@angular/material/expansion';
import * as XLSX from 'xlsx';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {fromLonLat} from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Circle } from 'ol/style';
import $ from 'jquery';
import GeoJSON from 'ol/format/GeoJSON';
import CircleStyle from 'ol/style/Circle';
import { GeobarService } from '../geobar/geobar.service';
import { GeobarComponent } from '../geobar/geobar.component';
import { Router } from '@angular/router';
import { GeobaseService } from '../Services/geobase.service';
import { GeotowerService } from '../geotower/geotower.service';
import { GeoNotePadService } from '../Services/geo-notepad.service';
import { TopicsService } from '../Services/topics.service';
import { CloudFileSelectorComponent } from '../cloud-file-selector/cloud-file-selector.component';
import { Observable } from 'rxjs';
const AWS: any = (window as any).AWS;
@Component({
  selector: 'app-geotray',
  templateUrl: './geotray.component.html',
  styleUrls: ['./geotray.component.scss']
})

export class GeotrayComponent implements OnChanges, AfterViewInit {
  parentFunction(data){
    console.warn(data,"datazzzzzzzzzzzzzzzzzz")
  }
  valueEmittedFromChildComponent: boolean;
  parentEventHandlerFunction(valueEmitted){
      this.valueEmittedFromChildComponent = valueEmitted;
  }
  panelOpenState = false;
  @ViewChild('geotrayHolder') geotrayHolder: ElementRef;
  @ViewChild(GeoPopupComponent) popupComponent: GeoPopupComponent;
  // @Output() remarkClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() showGeopadWindow: EventEmitter<any> = new EventEmitter<any>();
  @Output() show: EventEmitter<any> = new EventEmitter<any>();
  @Output() showGeoSessionWindow: EventEmitter<any> = new EventEmitter<any>();
  @Input() closeNotepad: string;
  @Input() closeGeoSession: string;
  @ViewChild(GeotrayMenuComponent) predefinedClicked : GeotrayMenuComponent;
  receiveMessage(){
    this.predefinedClicked= this.predefinedClicked.predefinedVisibility;
    console.log(this.predefinedClicked,"is visible?/////")
  }
  _isGeotrayActive = false;
  draggable = true;
  private _wingColor = '#FFFFFF';
  private _features: string[] = [
    'GTB',
    'QTB',
    'VTB',
    // 'RTB',
    // 'STB',
    'ATB',
    // 'PTB'
    'GPTB',
    'vicinity'
  ];
  public wings = this._getWings();
  public gutter = {
    top: 90,
  };
  public startAngles = {
    topLeft: -90,
  };
  public options = {
    radius: '70',
    onlyIcons: true,
    offset: '5',
    buttonWidth: '50',
    wingIconSize: '23',
    angle: '60',
    buttonCrossImgSize: '3%',
    buttonBackgroundColor: '#FFFFFF',
    buttonFontColor: '#FFFFFF',
    wingFontColor: 'black'
  };
  resetAllWings: string;

  @Input() isGuest = true;
  afterLoginOperations: any[] = [];
  showTooltip = true;
@Input() predefinedVisibility;
@Output() sendPredefindToPrototypeClick: EventEmitter<any> = new EventEmitter<any>();
onPropertiesClicked = false;
onPredefinedClicked = false;
onClassifiedClicked = false;
onBlendedClicked = false;
onCollocatedClicked = false;
onExtendedClicked = false;
onslopeClicked = false;
onAEDSClicked = false;
onbufferClicked = false;

Colors = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
s3: any;
albumBucketName = 'test-gallery1';
amazonS3BucketName = 'test-gallery1';
  constructor(
    private basemapService: BasemapService, private authObsr: AuthObservableService,
    private geotrayService: GeotrayService, private commonService: CommonService,
    private analytics: AnalyticsService, private geobarService: GeobarService,
    private renderer: Renderer2, private router: Router, 
    private geoTowerService: GeotowerService, private geobaseService: GeobaseService, 
    private notePadService: GeoNotePadService, private topicsService: TopicsService) {
      AWS.config.region = 'ap-southeast-1'; // Region
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: 'ap-southeast-1:cff13619-42b1-48c7-a470-459b66795b3c',
      });
      this.s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {Bucket: this.albumBucketName}
      });
    if (this.commonService.isValid(localStorage.getItem('token'))) {
      this.isGuest = false;
    } else {
      this.isGuest = true;
    }
    this.authObsr.subscribeForAuthStatus('GeotowerComponent', (authRes, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(authRes);
      console.log(msg);
      if (authRes.status === 'success') {
        this.isGuest = false;
        this.closeTooltip();
        // this.runAllWaitingTasks();
        // this.activateGeoTray(null);
      } else if (authRes.status === 'failed') {
        this.isGuest = true;
        this._isGeotrayActive = false;
      }
      if (!this.isGuest) {
        console.log('RUN WAITING TASKS');
        this.runAllWaitingTasks();
      } else {
        console.log('CLEARING ALL');
        this.afterLoginOperations = [];
      }
    });
  }

  @HostListener('window:keyup.esc', ['$event'])
  escapeKeyPressed(event: KeyboardEvent) {
    console.log('esc clicked, geotray', event);
    this.resetAllWings = String(new Date());
    this.geotrayService.dectivateTools();
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    
    console.log(changes);
    if (this.commonService.isValid(changes.closeNotepad)) {
      if (!changes.closeNotepad.firstChange) {
        this.resetAllWings = String(new Date());
        this.geotrayService.dectivateTools();
      }
    }
    if (this.commonService.isValid(changes.closeGeoSession)) {
      if (!changes.closeGeoSession.firstChange) {
        this.resetAllWings = String(new Date());
        this.geotrayService.dectivateTools();
      }
    }
  }

  ngAfterViewInit(): void{
    this.closeTooltip();
  }

  private _getWings() {
    const wings = [];
    this._features.forEach(feature => {
      wings.push({
        title: feature,
        color: this._wingColor,
        selected: false,
        icon: { name: `/assets/right-colored-svg/${feature}.svg` },
        tooltip: this.getTooltipText(feature),
        tooltipclass: this.getTooltipTextClass(feature),
        placement: this.getTooltipPlacement(feature)
      });
    });
    return wings;
  }

  private getTooltipPlacement(wingName) {
    if (wingName === 'GTB') {
      return 'right';
    } else if (wingName === 'QTB') {
      return 'above';
    } else if (wingName === 'VTB') {
      return 'above';
    } else if (wingName === 'RTB') {
      return 'above';
    } else if (wingName === 'STB') {
      return 'right';
    } else if (wingName === 'PTB') {
      return 'right';
    } else if ( wingName === 'GPTB') {
      return 'right';
    } else if ( wingName === 'ATB') {
      return 'right';
    }
  }
 

   
  private getTooltipText(wingName) {
    if (wingName === 'GTB') {
      return 'Geometry! Click/Ctrl-Click to activate measuing tool'; // 'Geometry';
    } else if (wingName === 'QTB') {
      return 'Properties! Click to activate tool for data query'; // 'Properties';
    } else if (wingName === 'VTB') {
      return 'Spatial Analysis! Click/Ctrl-Click to activate tool for radius search'; // 'Vicinity';
    } else if (wingName === 'RTB') {
      return 'Remarks';
    } else if (wingName === 'STB') {
      return 'Collaborate! Click to start sharing data'; // 'Share';
    } else if (wingName === 'ATB') {
      return 'Annotate'; // 'Collaborate! Click to start sharing data'; // 'Share';
    } else if (wingName === 'PTB') {
      return 'Positional';
    } else if (wingName === 'GPTB') {
      return 'Geopad'; // 'Geopad™! Click to add content (sites, photos, and notes) for projects'; // 'Geopad';
    }
  }

  private getTooltipTextClass(wingName) {
    if (wingName === 'GTB') {
      return 'gtb-text-rotation';
    } else if (wingName === 'QTB') {
      return 'qtb-text-rotation';
    } else if (wingName === 'VTB') {
      return 'vtb-text-rotation';
    } else if (wingName === 'RTB') {
      return 'rtb-text-rotation';
    } else if (wingName === 'STB') {
      return 'atb-text-rotation';
    } else if (wingName === 'PTB') {
      return 'ptb-text-rotation';
    } else if (wingName === 'GPTB') {
      return 'gptb-text-rotation';
    }
  }

  runAllWaitingTasks(): void{
    this.afterLoginOperations.forEach(operation => {
      if ( operation.type === 'showGeoTray') {
        console.log('CALLING SHOW SAVE SHARE SCREEN AFTER LOGIN');
        // this.openSaveShareScreen(operation.data);
        this.showOrHideTray();
        const index = this.afterLoginOperations.findIndex(op => op.type === 'showGeoTray');
        if (index !== -1) {
          this.afterLoginOperations.splice(index, 1);
        }
      }
    });
  }

  showOrHideTray(): void {
    console.log('IN showOrHideTray');
    this._isGeotrayActive = !this._isGeotrayActive;
    if (this._isGeotrayActive) {
      // console.log('event is ', event as Element);
      this.geotrayHolder.nativeElement.className = 'circle-btn active';
      this.analytics.sendPageViewData('geotray', 'GeoTray');
    } else {
      this.geotrayService.dectivateTools();
      this.geotrayHolder.nativeElement.className = 'circle-btn';
      this.resetAllWingsSelectStatus();
    }
  }
  public activateGeoTray(event): void{
    console.log('In activateGeoTray');
    console.log(event);
    if (!this.isGuest) {
      this.showOrHideTray();
    } else {
      // SAVING OPERATION TO PERFORM AFTER LOGIN
      const index = this.afterLoginOperations.findIndex(op => op.type === 'showGeoTray');
      if (index === -1) {
        // IF NO REQUEST PRESENT
        this.afterLoginOperations.push({ type: 'showGeoTray' });
      } else {
        // IF REQUEST PRESENT, SAVING RECENT REQUEST ONLY
        this.afterLoginOperations[index] = { type: 'showGeoTray' };
      }
      this.authObsr.initiateAuthenticationRequest({from: 'geotray'});
    }
  }

  public onWingSelected(selectedToolWing) {
    console.log('onWingSelected', selectedToolWing);
    const toolOptions = {
      title: selectedToolWing.title,
      isCtrlClicked: selectedToolWing.srcEvent./*srcEvent.*/ctrlKey,
      popupComponent: this.popupComponent
    };
    if (!String(selectedToolWing.tooltip).includes('Geopad') /*'Remarks'*/ &&
        !String(selectedToolWing.tooltip).includes('Annotate')) {
      this.geotrayService.activateTool(toolOptions);
    }
    if (String(selectedToolWing.tooltip).includes('Geopad') /*'Remarks'*/ ||
        String(selectedToolWing.tooltip).includes('Annotate')) {
      this.geotrayService.dectivateTools();
      // this.remarkClicked.emit(true);
    }
    if(selectedToolWing.title === 'QTB') {
      // here New code for loading prototype related static data
      this.processLoadingStaticDataForPrototype();
    }
  }
  showGeopad(event) {
    this.showGeopadWindow.emit(event);
  }
  
  showGeoSession(event){
    this.showGeoSessionWindow.emit(event);
  }
  
 
  public onWingHovered(selectedToolWing) {
    selectedToolWing.color = '#667BBC';
    selectedToolWing.icon.name = 'assets/right-white-svg/'
      + selectedToolWing.title + '.svg';
    // console.log('onWingHovered', selectedToolWing);
  }

  public onWingHoveredOut(selectedToolWing) {
    selectedToolWing.color = '#FFFFFF';
    selectedToolWing.icon.name = 'assets/right-colored-svg/'
      + selectedToolWing.title + '.svg';
    // console.log('onWingHoveredOUt', selectedToolWing);
  }

  public menuButtonSelected(selectedToolWing) {
    console.log('event geotrayDockerEvent', selectedToolWing);
    this.geotrayHolder.nativeElement.className = 'circle-btn';
    this._isGeotrayActive = false;
    this.geotrayService.dectivateTools();
    this.resetAllWingsSelectStatus();
    // this.remarkClicked.emit(false);
  }
  resetAllWingsSelectStatus() {
    this.wings.forEach(element => {
      element.selected = false;
      this.onWingHoveredOut(element);
    });
  }
  closeTooltip(): void{
    if (!this.isGuest){
      setTimeout(() => {
        this.showTooltip = false;
      }, environment.feUserGuideTooltipAutoCloseDuration);
    }
  }
  onPredefinedClickedEvent(event){
    console.log(event,"buttonclicked in geotray")
    this.onPropertiesClicked =  false;
    this.onPredefinedClicked = event;
    this.onClassifiedClicked = false;
    this.onBlendedClicked = false;
    this.onCollocatedClicked = false;
    this.onExtendedClicked = false;
    console.log(this.onPredefinedClicked, "check Predefined")
    
    
  }
  onClassifiedClickedEvent(event){
    console.log(event,"buttonclicked in geotray")
    this.onPropertiesClicked =  event;
    this.onPredefinedClicked = false;
    this.onClassifiedClicked = event;
    this.onBlendedClicked = false;
    this.onCollocatedClicked = false;
    this.onExtendedClicked = false;
    console.log(this.onClassifiedClicked, "check classified")
    
  }
  onBlendedClickedEvent(event){
    console.log(event,"buttonclicked in geotray")
    this.onPropertiesClicked =  event;
    this.onPredefinedClicked = false;
    this.onClassifiedClicked = false;
    this.onBlendedClicked = event;
    this.onCollocatedClicked = false;
    this.onExtendedClicked = false;
    console.log(this.onBlendedClicked, "check blendedd")
    
  }
  onCollocatedClickedEvent(event){
    console.log(event,"buttonclicked in geotray")
    this.onPropertiesClicked =  event;
    this.onPredefinedClicked = false;
    this.onClassifiedClicked = false;
    this.onBlendedClicked = false;
    this.onCollocatedClicked = event;
    this.onExtendedClicked = false;
    console.log(this.onCollocatedClicked, "check collocatedd");
    
  }
  onExtendedClickedEvent(event){
    console.log(event,"buttonclicked in geotray")
    this.onPropertiesClicked =  event;
    this.onPredefinedClicked =false;
    this.onClassifiedClicked = false;
    this.onBlendedClicked = false;
    this.onCollocatedClicked = false;
    this.onExtendedClicked = event;
    console.log(this.onExtendedClicked, "check extended");
  }
  onslopeClickedEvent(event){
    this.onslopeClicked = event;
    console.log(this.onslopeClicked, "check slope");

  }
  onAEDSClickedEvent(event){
    this.onAEDSClicked = event;
    console.log(this.onAEDSClicked, "checkproperty");

  }
  onbufferClickedEvent(event){
    this.onbufferClicked = event;
    console.log(this.onbufferClicked,"checkbuffer");
  }
  getFile(files: any, fileType: string) {
    return Array.from(files).find( (file: any) => {
      let fileExt = file.name.match(/\.[0-9a-z]+$/i);
      fileExt = fileExt ? fileExt[0] : '';
      return fileExt.toUpperCase() === fileType.toUpperCase();
    });
  }
  processLoadingStaticDataForPrototype(): any {
    /* let places = [];
    (async() => {
      const url = "https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2FHBCUs_Lat_long.xlsx?alt=media&token=dc05347a-9990-4b8a-887f-70c809931914";
      const data = await (await fetch(url)).arrayBuffer();
      const workBook = XLSX.read(data);
      console.log('data is ', data, workBook);
      // const workBook = XLSX.read(data, { type: 'binary' });
      const jsonData = workBook.SheetNames.reduce((initial, name) => {
        const ExcelSheets = workBook.SheetNames
        console.log(workBook.SheetNames)
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        console.log(initial); 
        return initial; 
      }, {});      
      const dataString = JSON.stringify(jsonData);
      console.log(jsonData);
      jsonData['Sheet1'].forEach(records => {
        console.log(records);
        places.push(records);
      });
      setTimeout(() => {
        let placesFeatures = [];
        places.forEach((p) => {
            placesFeatures.push(new Feature({
              geometry: new Point(fromLonLat([p.longitude, p.latitude])),
              // id: p.toString,
              // isInsidePolygon: false,
              style: new Style({
                image: new Circle({
                  radius: 7,
                  fill: new Fill({color: 'black'}),
                  stroke: new Stroke({
                    color: [255,0,0], width: 2
                  })
                })
              })
            }))
        })
        console.log(places, placesFeatures);
        // setTimeout(() => {
          const vectorLayer = new VectorLayer({
          source: new VectorSource({
            features: placesFeatures
          })
        });
        this.basemapService.getCurrentBasemap().addLayer(vectorLayer);
        console.log(vectorLayer, this.basemapService.getCurrentBasemap().getLayers());
          
        // }, 500);
      }, 500);
    })(); */
    console.log('calling static data ');
    const tempThis = this;
    /* $.getJSON('https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Fprototype_state.geojson?alt=media&token=b1de8995-af7b-47de-87cc-f0e7bd23ea69', function(data){
      console.log('state data is ', data);
      tempThis.setLayerToMap_StaticForPrototype(data);
    }); */
    /* $.getJSON('https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Fprototype_county.geojson?alt=media&token=d1e3a39a-7e20-4843-9507-256872899666', function(data){
      console.log('county data is ', data);
      tempThis.setLayerToMap_StaticForPrototype(data);
    }); */
    /* (async() => {
      console.log('insided calling static data ');
      const url = "https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Fprototype_state.geojson?alt=media&token=c11e607e-d40a-49ea-bc0f-c9d0833f2502";
      const geojsonData = await (await fetch(url)).arrayBuffer();
      console.log('data is ', geojsonData);
    }); */
    // Loading shape files to tower for prototype
    // state level firebase zip url
    const layerName = 'StatewideShapes_IHE_Data';
    let isduplicateFound = false;
    this.geoTowerService.geotowerLayersList.forEach((layer) => {
      if (layerName === layer.name) {
        console.log('Duplicate layer object found.... in geotray ');
        isduplicateFound = true;
      }
    });
    const prefix = '/fe_public/Administrative/prototype/';
    if(!isduplicateFound) {
      this.listFilesAndFolders('/', prefix.substring(prefix.indexOf('/') + 1));
    }
    /* new CloudFileSelectorComponent(this.commonService).listFilesAndFolders('/', prefix.substring(prefix.indexOf('/') + 1));
    const temp = new CloudFileSelectorComponent(this.commonService).listFilesAndFoldersForPrototype('/', prefix.substring(prefix.indexOf('/') + 1));
    setTimeout(() => {
      console.log('testing ', temp);      
    }, 3000);
    const listObjectsAsObservable = Observable.bindNodeCallback(this.s3.listObjects.bind(this.s3));
    listObjectsAsObservable({'Delimiter': '/', 'Prefix': prefix})
    .subscribe({
      next: (response) => console.log(response),
      error: (err) => console.log(err)
    }); */
    /* const stateZipFile = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2FStatewideShapes_IHE_Data.zip?alt=media&token=ced2e4cd-0d37-4de2-895d-fcf9bc02891c';
    const eventOptions = {
      fileUrls: stateZipFile,
      alertComponent: 'this.alertComponent',
      zip_file: zip,
      fileEvent: 'event',
      geobar: new GeobarComponent(this.basemapService, this.renderer, this.router, this.authObsr, 
        this.commonService, this.geobarService, this.geoTowerService, this.geobaseService, 
        this.notePadService, this.topicsService)
    };
    this.geobarService.activateEvent(eventOptions, 'AwsUrl'); */
    /* const stateZipFile = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2FStatewideShapes_IHE_Data.zip?alt=media&token=ced2e4cd-0d37-4de2-895d-fcf9bc02891c';
    fetch(stateZipFile).then((response) => {
      console.log(response);
      if (response.status === 200) {
        response.blob().then(blobRes => {
          console.log('blob resp ', blobRes);
          const eventOptions = {
            files: blobRes,
            alertComponent: 'this.alertComponent',
            zip_file: zip,
            fileEvent: 'event',
            geobar: new GeobarComponent(this.basemapService, this.renderer, this.router, this.authObsr, 
              this.commonService, this.geobarService, this.geoTowerService, this.geobaseService, 
              this.notePadService, this.topicsService)
          };
          this.geobarService.activateEvent(eventOptions, 'Upload');
        });
      }
    }) */
  }
  private randomRainbowColor(min, max): any {
    return this.Colors[Math.floor(Math.random() * (max - min + 1)) + min];
  }
  private setLayerToMap_StaticForPrototype(geoJson): any {
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)'
    });
    const stroke = new Stroke({
      // color: '#319FD3',
      color: this.randomRainbowColor(0, 6),
      width: 1
    });
    const style = new Style({
      image: new CircleStyle({
        fill,
        stroke,
        radius: 5
      }),
      fill,
      stroke,
    });
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson, {
        // featureProjection: this.basemapProjection
      })
    });
    vectorSource.getFeatures().forEach(feature => {
      const r = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const g = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const b = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const a = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      feature.setStyle(new Style({
        image: new CircleStyle({
          fill: new Fill({
            color: 'rgba('+r+', '+g+', '+b+', '+a+')'
          }),
          stroke,
          radius: 5
        }),
        fill: new Fill({
          color: 'rgba('+r+', '+g+', '+b+', '+a+')'
        }),
        stroke,
      }));
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      visible: false
    });
    vectorLayer.set('name', geoJson.fileName);
    vectorLayer.setOpacity(0.7);
    this.basemapService.getCurrentBasemap().addLayer(vectorLayer);
    
  }
  listFilesAndFolders(delimiter = '/', prefix = ''): void{
    console.log('In listAlbums');
    console.log(this);
    // this.s3.listObjectsV2({'Delimiter': '/', 'Prefix': 'file1/layers/'}, (err, data) => {
    /* this.fileListingStatus = 'loading';
    this.currentFilesList = []; */
    this.s3.listObjectsV2({Delimiter: delimiter, Prefix: prefix}, (err, data) => {
      console.log(err);
      console.log(data);
      const tempCurrentFiles = [];
      if (err) {
        /* this.currentFilesList = [];
        this.fileListingStatus = 'loaded'; */
        return alert('There was an error listing your albums: ' + err.message);
      } else {
          const commonPrefixes: any [] = data.CommonPrefixes;
          commonPrefixes.forEach(element => {
            tempCurrentFiles.push({
              Type: 'Folder',
              name: element.Prefix.substring(element.Prefix.indexOf(data.Prefix) + data.Prefix.length) // element.Prefix
            });
          });
          const contents: any [] = data.Contents;
          let index = 0;
          contents.forEach(element => {
            // let isValidFile = false;
            const fileName = element.Key.substring(element.Key.indexOf(data.Prefix) + data.Prefix.length);
            if (element.Key.includes('.') /*&& element.Key.includes('.zip')*/){
              element.Type = 'File';
              element.name =  fileName; // element.Key;
              element.shortFileSize = ''// this.getFileSize(element.Size);
              element.extension = fileName.substring(fileName.lastIndexOf('.'));
              element.selected = false;
              element.url = 'https://test-gallery1.s3.ap-southeast-1.amazonaws.com/fe_public/Administrative/prototype/' + fileName;
              element.size = element.Size,
              element.id = `${String(new Date().getTime())}_${index++}`;
              tempCurrentFiles.push(element);
            }
          });
          console.log(tempCurrentFiles);
          // Here Loading the shp files as AWS
          tempCurrentFiles.forEach((awsFile) => {
            const awsFiles = [];
            awsFiles.push(awsFile);
            const eventOptions = {
              fileUrls: awsFiles,
              alertComponent: 'this.alertComponent',
              zip_file: zip,
              fileEvent: 'event',
              // geobar: new GeobarComponent(this.basemapService, this.renderer, this.router, this.authObsr, 
              //   this.commonService, this.geobarService, this.geoTowerService, this.geobaseService, 
              //   this.notePadService, this.topicsService)
            };
            this.geobarService.activateEvent(eventOptions, 'AwsUrl'); 
          });
      }
    });
  }
}
