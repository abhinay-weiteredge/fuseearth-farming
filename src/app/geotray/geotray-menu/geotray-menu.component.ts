import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
  AfterViewInit,
  OnChanges,
} from '@angular/core';
import * as $ from 'jquery';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { FileUtil } from 'src/app/geobar/util/fileUtil';
import { KMLGroundOverlayParsing } from 'src/app/geobar/util/kmlGroundOverlayParsing';
import { AuthObservableService } from 'src/app/Services/authObservableService';
import { CommonService } from 'src/app/Services/common.service';
import { GeotrayService } from '../geotray.service';
import { MiniTowerItemComponent } from 'src/app/geotower/mini-tower-item/mini-tower-item.component';
import { MyService } from 'src/app/my-service.service';
import { Circle, Fill, Stroke, Style } from 'ol/style.js';
import Draw from 'ol/interaction/Draw.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import VectorSource from 'ol/source/Vector.js';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import OlMap from 'ol/Map';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { emit } from 'process';
import { LineString } from 'ol/geom';
import Pointer from 'ol/interaction/Pointer';
import { SlopeFinderComponent } from '../slope-finder/slope-finder.component';
// import * as turf from 'turf';
import { Geometry } from 'ol/geom';
import Polygon from 'ol/geom/Polygon';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-geotray-menu',
  templateUrl: './geotray-menu.component.html',
  styleUrls: ['./geotray-menu.component.scss'],
})
export class GeotrayMenuComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() state: boolean;
  @Input() slope;
  @Input() Slopevalue: any;
  @Output() parentFunction: EventEmitter<any> = new EventEmitter();
  propertiesWindowVisible: any;
  predefinedVisibility: any;
  classifiedVisibility: any;
  blendedVisibility: any;
  collocatedVisibility: any;
  extendedVisibility: any;
  slopefinderVisibility: any;
  slopefinderVisibilityAEDS: any;
  buffertoolVisibility: any;
  vicinitytoolVisibility: any;
  private basemap: OlMap;
  private renderer: Renderer2;
  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  draw: any;
  snap: any;
  receivedslope: any;
  //map: OlMap.Map;
  @Input() wings: any = [];
  @Input() resetAllWings: String = '';
  @Input() isGuest = true;
  @Input() layernames;
  @Input() layer: any;

  @Output() onPropertiesClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onslopeClicked: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onAEDSClicked: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onbufferClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onPredefinedClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onClassifiedClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onBlendedClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onCollocatedClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onExtendedClicked: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() onWingHovered: EventEmitter<any> = new EventEmitter<any>();
  @Output() onWingHoveredOut: EventEmitter<any> = new EventEmitter<any>();
  @Output() onWingSelected: EventEmitter<any> = new EventEmitter<any>();
  @Output() onMenuBtnClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() showGeopadWindow: EventEmitter<any> = new EventEmitter<any>();
  // @Output() showPropertyWindow: EventEmitter<any> = new EventEmitter<any>();

  @Output() showGeoSessionWindow: EventEmitter<any> = new EventEmitter<any>();
  @Output() nameEmitter: EventEmitter<string> = new EventEmitter<any>();
  @Output() slopetoolcall: EventEmitter<boolean> = new EventEmitter<any>();

  setActive = false;
  currentTooltipContent = '';
  width = 50;
  height = 50;
  showSubOptions = false;
  showProperties = false;
  showbuffer = false;
  showvicinity = false;
  showslope = false;
  showslopeAEDS = false;
  showAnnotateTool = false;
  selectedSubOption: string;
  selectedProperty: string;
  afterLoginOperations: any[] = [];
  fileNames: string[];
  slopefindercursor =
    'url(/assets/svgs/Farming/slope-finder-icon.svg) 31 68, auto';
  buffertoolcursor =
    'url(/assets/svgs/Farming/buffer-tool-icon.svg) 33.99999 68, auto';
  cursorService: any;
  percentage: any;
  constructor(
    private geotrayService: GeotrayService,
    private authObsr: AuthObservableService,
    private commonService: CommonService,
    private predefined1: GeotrayService,
    private myService: MyService,
    private basemapService: BasemapService,
    private renderer2: RendererFactory2
  ) {
    this.renderer = this.renderer2.createRenderer(null, null);
    this.basemap = this.basemapService.getCurrentBasemap();
  }
  predef: any;
  public fileUtilCallback: (returnData: any) => any;
  kmlParsingProcess: KMLGroundOverlayParsing;
  baseService: BasemapService;
  zipWriter: any;
  validationUploadedFile(inputFiles: any, options: any): void {
    throw new Error('Method not implemented.');
  }
  validationAwsUrl(options: any): void {
    throw new Error('Method not implemented.');
  }
  checkOtherFormatsForAws(inputFiles: any, options: any): void {
    throw new Error('Method not implemented.');
  }
  _createZipFile(inputFiles: any, callback: any): void {
    throw new Error('Method not implemented.');
  }
  getZipFileMethod1(files: any, callback: any): void {
    throw new Error('Method not implemented.');
  }
  addNextFileToZip(currentCount: any, files: any, onSuccess: any): void {
    throw new Error('Method not implemented.');
  }
  getZipFileMethod2(inputFiles: any, finalCallback: any): void {
    throw new Error('Method not implemented.');
  }
  saveZipBlob(blob: any): void {
    throw new Error('Method not implemented.');
  }
  pFileReaderAsText(file: any): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  pFileReaderAsArrayBuffer(file: any): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  pBufferReaderAsText(buffer: any): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  public _processXLSXFilesList(inputFile: any): void {
    throw new Error('Method not implemented.');
  }
  public _processCSVFilesList(inputFile: any): void {
    throw new Error('Method not implemented.');
  }
  getFile(files: any, fileType: string): unknown {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.parentFunction.emit('test');
    // this.myService.layer$.subscribe(layer => {
    //   this.layer = layer;
    // });      // update the dropdown list here
    //   console.log("checklayerssss",this.layer)
    this.fileNames = this.myService.fileNames;
    console.log('checklayerssss', this.fileNames);
    console.log(this.Slopevalue, 'checkslopevalueeeee');
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.setActive = true;
    }, 300);
  }
  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    this.predefined1.setPopup(this.predef);
    console.log(this.predefined1, 'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    console.log(changes);
    if (this.commonService.isValid(changes.resetAllWings)) {
      if (!changes.resetAllWings.firstChange) {
        this.resetWingSelection();
        this.showSubOptions = false;
        this.showProperties = false;
        this.showbuffer = false;
        this.onbufferClicked.emit(this.showbuffer);
        this.onAEDSClicked.emit(false)
        this.onslopeClicked.emit(false)
        this.showvicinity = false;
        this.showslope = false;
        this.showslopeAEDS = false;
        this.selectedSubOption = '';
        this.selectedProperty = '';
      }
    }
    if (this.commonService.isValid(changes.isGuest)) {
      if (!changes.isGuest.firstChange) {
        if (!this.isGuest) {
          this.runAllWaitingTasks();
        } else {
          this.afterLoginOperations = [];
        }
      }
    }
    // if(SlopeFinderComponent.spopupstatus==false){
    //   this.slopefinderVisibility=false;

    // }
  }
  resetWingSelection() {
    this.wings.forEach((element) => {
      element.selected = false;
      this.setHoveredOutIcon(element);
    });
  }
  mouseOver(e, wing) {
    this.currentTooltipContent = wing.tooltip;
    if (!wing.selected) {
      this.onWingHovered.emit(wing);
    }
  }
  mouseOut(e, wing) {
    if (!wing.selected) {
      this.onWingHoveredOut.emit(wing);
    }
  }

  runAllWaitingTasks() {
    this.afterLoginOperations.forEach((operation) => {
      if (operation.type === 'showSaveShare') {
        console.log('CALLING SHOW SAVE SHARE SCREEN AFTER LOGIN');
        this.openSaveShareScreen(operation.data);
        const index = this.afterLoginOperations.findIndex(
          (op) => op.type === 'showSaveShare'
        );
        if (index !== -1) {
          this.afterLoginOperations.splice(index, 1);
        }
      }
    });
  }

  openSaveShareScreen(data) {
    this.showGeoSessionWindow.emit(data);
    this.closeMenu('');
    setTimeout(() => {
      this.resetWingSelection();
    }, 1000);
    this.geotrayService.dectivateTools();
  }
  selectedWing(e: PointerEvent, wing) {
    console.log(e);
    console.log(e.ctrlKey);
    if (wing.title === 'GPTB') {
      if (e.ctrlKey) {
        this.showSubOptions = true;
        this.resetWingSelection();
        this.geotrayService.dectivateTools();
        this.showslope = false;
        this.showslopeAEDS = false;
        this.showbuffer = false;
        this.onbufferClicked.emit(this.showbuffer);
        this.onAEDSClicked.emit(false);
        this.onslopeClicked.emit(false);
        this.showvicinity = false;
      } else {
        this.showGeopad(e);
        this.resetWingSelection();
      }
    } else if (wing.title === 'QTB') {
      //this.showProperties = true;
      this.showProperties = !this.showProperties;
      this.showbuffer = false;
      this.showvicinity = false;
      this.showslope = false;
      this.showslopeAEDS = false;
      this.onbufferClicked.emit(this.showbuffer);
      this.onAEDSClicked.emit(false);
      this.onslopeClicked.emit(false);
    } else if (wing.title === 'ATB') {
     // if (e.ctrlKey) {
      //   if (this.showAnnotateTool == true) {
      //               this.showAnnotation(e);
      //       this.resetWingSelection();
      //       this.showGeometryProperties = false;
      //     }
      //     else {
      //       alert("Susbcribe for higher package to use this feature")
      //       this.disable = true;
      //       return;
      //     }
      // } else {
        this.showAnnotateTool = !this.showAnnotateTool;
        this.showslope = !this.showslope;
        this.showslopeAEDS = !this.showslopeAEDS;
        this.buffertoolVisibility = false;
        this.showProperties = false;
        this.showbuffer = false;
        this.showvicinity = false;
        this.onbufferClicked.emit(this.showbuffer);
      // }
    }  else if (wing.title === 'VTB') {
      this.showbuffer = !this.showbuffer;
      this.showvicinity = !this.showvicinity;
      this.slopefinderVisibility = false;
      this.slopefinderVisibilityAEDS = false;
      this.showslope = false;
      this.showslopeAEDS = false;
      this.showProperties = false;
      this.showAnnotateTool = false;
      this.onslopeClicked.emit(false);
      this.onAEDSClicked.emit(false);
    }
     else if (wing.title === 'STB') {
      const data = { e, data: 'geosession' };
      if (!this.isGuest) {
        this.openSaveShareScreen(data);
      } else {
        // SAVING OPERATION TO PERFORM AFTER LOGIN
        const index = this.afterLoginOperations.findIndex(
          (op) => op.type === 'showSaveShare'
        );
        if (index === -1) {
          // IF NO TOWER LAYER SAVE REQUEST PRESENT
          this.afterLoginOperations.push({ type: 'showSaveShare', data });
        } else {
          // IF TOWER LAYER SAVE REQUEST PRESENT, SAVING RECENT REQUEST ONLY
          this.afterLoginOperations[index] = { type: 'showSaveShare', data };
        }
        this.authObsr.initiateAuthenticationRequest({
          from: 'geotray-save-share',
        });
      }
    } else if (wing.title === 'ATB') {
    } else {
      this.showSubOptions = false;
      this.showProperties = false;
      this.showslope = false;
      this.showslopeAEDS = false;
      this.showbuffer = false;
      this.showvicinity = false;
    }
    this.resetWingSelection();
    if (wing.title === 'GPTB' && !e.ctrlKey) {
    } else if (wing.title === 'QTB') {
    } else if (wing.title === 'ATB') {
    } else {
      this.wings.forEach((element) => {
        if (element.title === wing.title) {
          element.selected = true;
          this.setHoveredIcon(element);
          // this.onWingHovered.emit(wing);
        } else {
          element.selected = false;
          this.setHoveredOutIcon(element);
          // this.onWingHoveredOut.emit(wing);
        }
      });
    }
    const temp = wing;
    temp.srcEvent = e;
    this.onWingSelected.emit(temp);
    // }
  }
  dropClicked(wing){
    
    console.log("clicked the drop",wing)
    if(wing.title === 'VTB'){
      this.showbuffer = !this.showbuffer;
      this.showvicinity = !this.showvicinity;
      this.slopefinderVisibility = false;
      this.slopefinderVisibilityAEDS = false;
      this.onslopeClicked.emit(false);
      this.onAEDSClicked.emit(false);
      this.showslope = false;
      this.showslopeAEDS = false;
      this.showProperties = false;
      this.showAnnotateTool = false;
    }  
  }
  showUploadPhotosVideos() {
    // this.showGeopadWindow.emit('video-image');
    // this.selectedSubOption='video-image';
  }
  showUploadAudio() {
    // this.showGeopadWindow.emit('audio');
    // this.selectedSubOption='audio';
  }
  showGeopad(event) {
    console.log(event);
    this.showGeopadWindow.emit({ event, data: 'geopad' });
    this.selectedSubOption = 'geopad';
    this.closeMenu('');
  }
  showAnnotation(event): void {
    this.showGeopadWindow.emit({ event, data: 'annotate' });
    this.selectedSubOption = 'annotate';
    this.closeMenu('');
  }
  showViewOtherLocation() {
    // this.showGeopadWindow.emit('view-location');
    // this.selectedSubOption='view-location';
  }
  showPredefined() {
    this.selectedProperty = 'predefined';
    this.predefinedVisibility = !this.predefinedVisibility;
    this.classifiedVisibility = false;
    this.blendedVisibility = false;
    this.collocatedVisibility = false;
    this.extendedVisibility = false;
    this.onPredefinedClicked.emit(this.predefinedVisibility);
    console.log('checkhit', this.selectedProperty);
  }
  showClassified() {
    this.selectedProperty = 'classified';
    this.classifiedVisibility = !this.classifiedVisibility;
    this.blendedVisibility = false;
    this.collocatedVisibility = false;
    this.extendedVisibility = false;
    this.predefinedVisibility = false;
    this.propertiesWindowVisible = !this.propertiesWindowVisible;
    this.onClassifiedClicked.emit(this.classifiedVisibility);
    console.log('checkhit', this.selectedProperty);
  }
  showBlended() {
    this.selectedProperty = 'blended';
    this.blendedVisibility = !this.blendedVisibility;
    this.classifiedVisibility = false;
    this.collocatedVisibility = false;
    this.extendedVisibility = false;
    this.predefinedVisibility = false;
    this.propertiesWindowVisible = !this.propertiesWindowVisible;
    this.onBlendedClicked.emit(this.blendedVisibility);
    console.log('checkhit', this.selectedProperty);
  }
  showCollocated() {
    this.selectedProperty = 'collocated';
    this.extendedVisibility = false;
    this.predefinedVisibility = false;
    this.blendedVisibility = false;
    this.classifiedVisibility = false;
    this.collocatedVisibility = !this.collocatedVisibility;
    this.propertiesWindowVisible = !this.propertiesWindowVisible;
    this.onCollocatedClicked.emit(this.collocatedVisibility);
    console.log('checkhit', this.selectedProperty);
  }
  showExtended() {
    this.selectedProperty = 'extended';
    this.predefinedVisibility = false;
    this.blendedVisibility = false;
    this.classifiedVisibility = false;
    this.collocatedVisibility = false;
    this.extendedVisibility = !this.extendedVisibility;
    this.onExtendedClicked.emit(this.extendedVisibility);
    console.log('checkhit', this.onExtendedClicked);
  }

  handleSlopePctValue(e) {
    this.receivedslope = e;
    console.log(this.receivedslope, 'checkreceivedslopeval');
  }

  showAEDS() {
    this.selectedProperty = 'slopefinderADES';
    this.slopefinderVisibilityAEDS = !this.slopefinderVisibilityAEDS;
    this.onAEDSClicked.emit(this.slopefinderVisibilityAEDS);
    if(this.slopefinderVisibilityAEDS){
      this.basemapService.setMouseIcon(this.slopefindercursor);
    }
    if(!this.slopefinderVisibilityAEDS){
      this.basemapService.setMouseIcon("auto");
    }
    this.slopefinderVisibility = false;
    this.showslopedropdown = false;
    this.showbufferdropdown = false;
    this.onslopeClicked.emit(this.slopefinderVisibility);
    this.myService.trigger();
    console.log(
      'checkproperty',
      this.selectedProperty,
      this.slopefinderVisibilityAEDS
    );
  }
  showslopefinder() {
    this.selectedProperty = 'slopefinder';
    this.slopefinderVisibility = !this.slopefinderVisibility;
    this.onslopeClicked.emit(this.slopefinderVisibility);
    if(this.slopefinderVisibility){
      this.basemapService.setMouseIcon(this.slopefindercursor);
    }
    if(!this.slopefinderVisibility){
      this.basemapService.setMouseIcon("auto");
    }
    this.slopefinderVisibilityAEDS = false;
    this.onAEDSClicked.emit(this.slopefinderVisibilityAEDS);
    this.showslopedropdownAEDS = false;
    this.showbufferdropdown = false;
    this.myService.trigger();
  }

  showslopedropdown: boolean = false;

  openslopedropdown() {
    this.showslopedropdown = !this.showslopedropdown;
    this.showslopedropdownAEDS = false;
  }
  showslopedropdownAEDS: boolean = false;

  openslopedropdownAEDS() {
    this.showslopedropdownAEDS = !this.showslopedropdownAEDS;
    this.showslopedropdown = false;
  }

  // showVicinityTool() {
  //   this.selectedProperty = 'Vicinity';
  //   this.slopefinderVisibility = !this.slopefinderVisibility;
  //   this.onslopeClicked.emit(this.slopefinderVisibility);
  //   this.slopefinderVisibilityAEDS = false;
  //   this.onAEDSClicked.emit(this.slopefinderVisibilityAEDS);
  //   this.showslopedropdownAEDS = false;
  //   this.showbufferdropdown = false;
  //   this.myService.trigger();
  //   this.basemapService.setMouseIcon(this.slopefindercursor);
  // }

  showbuffertool() {
    this.selectedProperty = 'buffertool';
    this.buffertoolVisibility = !this.buffertoolVisibility;
    this.showslopedropdown = false;
    this.showslopedropdownAEDS = false;
    this.onbufferClicked.emit(this.buffertoolVisibility);
    if(this.buffertoolVisibility){
      this.basemapService.setMouseIcon(this.buffertoolcursor);
    }
    if(!this.buffertoolVisibility){
      this.basemapService.setMouseIcon("auto");
    }
    console.log('checkhit', this.onbufferClicked);
  }

  showbufferdropdown: boolean = false;

  openbufferdropdown() {
    this.showbufferdropdown = !this.showbufferdropdown;
  }

  showvicinitytool() {
    this.vicinitytoolVisibility = !this.vicinitytoolVisibility;
    // wing.title === 'vicinity'
    //     clickEvent: 'getFeatureInfoByCircleRadius',
    // ctrlClickEvent: 'getFeatureInfoByCircle',
  }

  closeMenu(event) {
    this.onMenuBtnClicked.emit(false);
  }
  public setHoveredIcon(wing) {
    wing.color = '#667BBC';
    wing.icon.name = 'assets/right-white-svg/' + wing.title + '.svg';
    // console.log('onWingHovered', selectedToolWing);
  }

  public setHoveredOutIcon(wing) {
    wing.color = '#FFFFFF';
    wing.icon.name = 'assets/right-colored-svg/' + wing.title + '.svg';
    // console.log('onWingHoveredOUt', selectedToolWing);
  }
}
