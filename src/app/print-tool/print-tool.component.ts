import {
  Component, OnInit, HostListener, AfterViewInit, EventEmitter, Input, Output, SimpleChange, OnChanges,
  ElementRef, Renderer2, ViewChild, OnDestroy, 
} from '@angular/core';
import { BasemapService } from '../basemap/basemap.service';
import { NgbModalConfig, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { AuthObservableService } from '../Services/authObservableService';
import { BasemapFactory } from '../basemap/BasemapFactory.js';
import { get } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import OlView from 'ol/View';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlXYZ from 'ol/source/XYZ';
import { CommonService } from '../Services/common.service';
import { GeotowerService } from '../geotower/geotower.service';
import { environment } from 'src/environments/environment';
// import * as jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { getPointResolution } from 'ol/proj';
import { fromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Observable } from 'rxjs';
import { PrintToolService } from '../Services/print-tool.service.js';
import Map from 'ol/Map';
import View from 'ol/View';
import OlMap from 'ol/Map';
import { defaults as defaultControls, ScaleLine, Zoom } from 'ol/control.js';
import { buffer, getCenter, getTopLeft, getTopRight, getBottomLeft, getHeight, getWidth } from 'ol/extent';
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { Draggable } from '../../assets/js/Draggable.js';
import { TweenLite } from '../../assets/js/TweenLite.js';
import ResizeObserver from 'resize-observer-polyfill';
declare var $: any;
import {Buffer} from 'buffer';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-print-tool',
  templateUrl: './print-tool.component.html',
  styleUrls: ['./print-tool.component.scss']
})

export class PrintToolComponent implements OnInit, OnDestroy {
  print_view : any;
  logo_view : any;
  compass_view : any;
  showPresentaiton = true;
  isBaseMapOptActive = false;
  selecteMapType: any = { name: 'Street (Bing)', value: 'bingstreet' };
  checkCredit = false;
  uploadedImage : any;
  checkUpload = false
  creditmove : any;
  uploadmove : any;
  
  addPresentationFormGroup : FormGroup;

  presentationPageSizes: any[] = [
    { name: 'A4', value: [210, 297] },
    { name: 'A3', value: [298, 420] },
    { name: 'Letter', value: [216, 279] },
    { name: 'ARCH A', value: [229, 305] },
    { name: 'ARCH B', value: [305, 457] },
    { name: 'ARCH C', value: [457, 610] },
    { name: 'ARCH D', value: [610, 914] },
    { name: 'ARCH E', value: [914, 1219] },
    { name: 'ARCH E1', value: [762, 1067] },
    { name: 'ARCH E2', value: [660, 965] },
    { name: 'ARCH E3', value: [686, 991] },
  ];
  presentationDpiList: any[] = [
    { name: '100', value: '100' },
    { name: '200', value: '200' },
    { name: '300', value: '300' },
    { name: '400', value: '400' }
  ];

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

  unitsList: any = [
    { value: 'us', view: 'Miles', scaleValue: 'us'},
    { value: 'metric', view: 'Kms', scaleValue: 'metric'}
  ];

  @ViewChild('dpiInput') dpiInput: ElementRef<HTMLInputElement>;
  dpiSelect: FormControl = new FormControl('');
  selectedOutputFormat: any;
  selectedPageSize: any;
  selectedOrientation: any;
  selectedDPI: any;
  rotationValue: any = 0;
  angleRotate: any = 0;
  rotateReturn: any;
  @ViewChild('scaleContainerPopup') scaleContainerPopup: ElementRef<HTMLDivElement>;
  @ViewChild('ptool', { static: true }) ptool: ElementRef<HTMLDivElement>;
  @ViewChild('imageScaleDivID') imageScaleDivID: ElementRef<HTMLDivElement>;
  @ViewChild('imgContainerPopup') imgContainerPopup: ElementRef<HTMLDivElement>;
  @ViewChild('legendContainerPopup') legendContainerPopup: ElementRef<HTMLDivElement>;
  @ViewChild('presentationIMGContainer', { static: true }) presentationIMGContainer: ElementRef<HTMLDivElement>;
  @ViewChild('ptbc') ptbc!: ElementRef;
  @ViewChild('childDiv') public childDiv!: ElementRef;
  @ViewChild('mapDiv', {static: true}) mapDiv: ElementRef<HTMLDivElement>;
  @ViewChild('rotateN', {static: true}) rotateN: ElementRef<HTMLDivElement>;
  @ViewChild('mapLogo', {static: true}) mapLogo: ElementRef<HTMLDivElement>;
  @ViewChild('navigateN', {static: true}) navigateN: ElementRef<HTMLDivElement>;
  @ViewChild('imageupload', {static: true}) imageupload: ElementRef<HTMLDivElement>;
  @ViewChild('rotationField', {static : true}) rotationField: ElementRef<HTMLDivElement>;

  private printMap: OlMap;
  activeSitesForPresentation: any[] = [];
  mapProjectionUnitsPopup = '';
  scaleLineWidth = 0;
  popupContent: any;
  basemap: any;
  mapX = 0;
  mapY = 0;
  mapWidth = 0;
  mapHeight = 0;
  logoX = 0;
  logoY = 0;
  symbolX = 0;
  symbolY = 0;
 isResizing = false;
 mapURL : any;
  creditData: any;

  constructor(private basemapService: BasemapService, config: NgbModalConfig, private modalService: NgbModal,
    private geotowerService: GeotowerService, private renderer: Renderer2,
    private commonService: CommonService, private formBuilder: FormBuilder,
    private observ: AuthObservableService, private printToolService: PrintToolService,private authObsr: AuthObservableService, private sanitizer : DomSanitizer) {
    this.selectedPageSize = this.presentationPageSizes[0].value;
    this.dpiInput = this.presentationDpiList[0].value;
    this.selectedOrientation = 'portrait';
    this.selectedOutputFormat = 'PDF';
    this.selectedDPI = this.presentationDpiList[1].value;
    this.popupContent = this;
    this.basemap = this.basemapService.getCurrentBasemap();
  }
  ngOnDestroy(): void {
    console.log('destroyed.....');
  }

  ngOnInit(): void {
    this.createPresentationFormGroup()
    this.draggableMapView()
    this.embeddingPrintMap();
    this.printMap.on('moveend', (e) => {
      // console.log(e);
      this.getScaleLineWidth();
      this.getMapProjectionUnits();
      // this.basemapService.setLoadScaleLine();
    });
    this._updateDraggableObj()
    this._fieldDraggableObj()


    this.addPresentationFormGroup.controls.addMapscale.valueChanges.subscribe(val => {
      console.log('Unit value changed', this.addPresentationFormGroup.controls.addMapscale.value);
      console.log(val, "check me");
      this.submit();
    });

    this.addPresentationFormGroup.controls.addCredit.valueChanges.subscribe(val => {
        this.checkCredit = true
        this.creditData = val
        console.log(this.creditData, "check creditdata")
    })


  }

  ngAfterViewInit(){
    //calculating new width and height for the div with aspect ratio fo page sizes

      for(let x of this.presentationPageSizes){
        if(this.addPresentationFormGroup.get('addPageSize').value === x.name){
          const pageWidth = x.value[0] / 25.4
          const pageHeight = x.value[1] / 25.4

         const divWidth = this.childDiv.nativeElement.offsetWidth * 0.0104166667
         const divHeight = this.childDiv.nativeElement.offsetHeight * 0.0104166667

      
         const newWidth = divHeight * pageWidth / pageHeight
         if(this.addPresentationFormGroup.get('addOrientation').value === 'Portrait'){
          console.log("in the potrait", newWidth , divHeight)
          $(".print-style").css({"width" : `${Math.round(newWidth * 96)}px`, "height" : `${Math.round(divHeight * 96)}px`,"margin" : 'auto auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(newWidth * 96)}px`,"overflow":"auto","max-height": `${Math.round(divHeight * 96)}px`})
          const popupExtent = this.basemap.getView().calculateExtent([newWidth * 96, divHeight * 96]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([newWidth * 96 , divHeight * 96])
         }else{
          console.log("in the lanscape" , divHeight , newWidth)
          $(".print-style").css({"width" : `${Math.round(divHeight * 96)}px`, "height" : `${Math.round(newWidth * 96)}px`,"margin" : 'auto auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(divHeight * 96)}px`,"overflow":"auto","max-height": `${Math.round(newWidth * 96)}px`})
          const popupExtent = this.basemap.getView().calculateExtent([divHeight * 96, newWidth * 96]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([divHeight * 96 , newWidth * 96])
         }
        }
      
      }
      this.loadAllBaseMaps({})
  }

 createPresentationFormGroup(){
  this.addPresentationFormGroup = this.formBuilder.group({
    addOrientation : new FormControl('Portrait'),
    addPageSize : new FormControl('A4'),
    addOutputFormat : new FormControl('PDF'),
    addDpi : new FormControl('200'),
    addMaptype : new FormControl('Street (Bing)'),
    addMapscale : new FormControl('us'),
    addLegend : new FormControl("Show"),
    addImageUpload : new FormControl(""),
    addMapOrientation : new FormControl("0"),
    addCredit : new FormControl("")
  })
 }



 onPageOptionSelected(pagesize){
  var pageWidth : any;
  var pageHeight : any;
  var divWidth : any;
  var divHeight : any;
  var newWidth : any;

  this.presentationPageSizes.map((x)=>{

  const dpi = this.addPresentationFormGroup.get('addDpi').value

    if(x.name === pagesize){

      console.log(dpi, "check dpi")
      pageWidth = x.value[0] / 25.4;
      pageHeight = x.value[1] / 25.4;
      console.log(pageWidth, pageHeight, "paper width and height in inch")

      console.log(this.childDiv.nativeElement.offsetWidth , this.childDiv.nativeElement.offsetHeight , "Divwidth and Divheight in px")

      divWidth = this.childDiv.nativeElement.offsetWidth * 0.0104166667
      divHeight = this.childDiv.nativeElement.offsetHeight * 0.0104166667

      // divWidth = 564 * 0.0104166667
      // divHeight = 640 * 0.0104166667
       
      console.log(divWidth, divHeight , "Divwidth and Divheight in inch")

      newWidth = divHeight * pageWidth / pageHeight


      const resolution_width = dpi * newWidth

      const resolution_height = dpi * divHeight

      console.log(resolution_width, resolution_height , "after added dpi width and height in px")

      const _width = resolution_width / dpi
      
      const _height = resolution_height / dpi

      console.log(_width , _height , "check width and height in inh")

      
      if(this.addPresentationFormGroup.get('addOrientation').value === 'Portrait'){
        console.log("in protrait")
        console.log(_width , _height , "updated width and height in inch")
        $(".print-style").css({"width" : `${Math.round(_width * 96)}px`, "height" : `${Math.round(_height * 96)}px`, "margin" : 'auto auto'})
        $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(_width * 96)}px`,"overflow":"auto","max-height": `${Math.round(_height * 96)}px`})
        const popupExtent = this.basemap.getView().calculateExtent([_width * 96, _height * 96]);
        this.printMap.getView().fit(popupExtent);
        this.printMap.setSize([_width * 96 , _height * 96])
        this.printMap.updateSize()
      }else{
        const divLWidth = 564 * 0.0104166667
        const divLHeight = 640 * 0.0104166667

       const newLWidth = divLHeight * pageWidth / pageHeight

       const resolution_width = dpi * newLWidth

       const resolution_height = dpi * divLHeight
 
       console.log(resolution_width, resolution_height , "after added dpi width and height in px")
 
       const _width = resolution_width / dpi
       
       const _height = resolution_height / dpi
 
       console.log(_width , _height , "check width and height in inh")
       

        console.log(_height, _width , "updated width and height in inch")
        $(".print-style").css({"width" : `${Math.round(_height * 96)}px`, "height" : `${Math.round(_width * 96)}px`, "margin" : '4rem auto'})
        $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(_height * 96)}px`,"overflow":"auto","max-height": `${Math.round(_width * 96)}px`})
        const popupExtent = this.basemap.getView().calculateExtent([_height * 96 , _width * 96]);
        this.printMap.getView().fit(popupExtent);
        this.printMap.setSize([_height * 96 , _width * 96])
        this.printMap.updateSize()
      }

    }
  })

 }


 onOrientOptionSelected(orientation){
console.log(orientation, " check orient")
const dpi = this.addPresentationFormGroup.get('addDpi').value
  this.presentationPageSizes.map((x)=>{
    if(this.addPresentationFormGroup.get('addPageSize').value === x.name){
          const pageWidth = x.value[0] / 25.4
          const pageHeight = x.value[1] / 25.4

         const divWidth = 564 * 0.0104166667
         const divHeight = 640 * 0.0104166667
      
         const newWidth = divHeight * pageWidth / pageHeight

         const resolution_width = dpi * newWidth

         const resolution_height = dpi * divHeight
   
         console.log(resolution_width, resolution_height , "after added dpi width and height in px")
   
         const _width = resolution_width / dpi
         
         const _height = resolution_height / dpi
   
         console.log(_width , _height , "check width and height in inh")

         if(orientation === 'Portrait'){
          console.log("in the potrait", _width , _height)
          $(".print-style").css({"width" : `${Math.round(_width * 96)}px`, "height" : `${Math.round(_height * 96)}px`, "margin" : 'auto auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(_width * 96)}px`,"overflow":"auto","max-height": `${Math.round(_height * 96)}px`})
          const popupExtent = this.basemap.getView().calculateExtent([_width * 96 , _height * 96]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([_width * 96 , _height * 96])
          this.printMap.updateSize()
         }else{
          console.log("in the lanscape" , _height , _width)
          $(".print-style").css({"width" : `${Math.round(_height * 96)}px`, "height" : `${Math.round(_width * 96)}px`, "margin" : '4rem auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${Math.round(_height * 96)}px`,"overflow":"auto","max-height": `${Math.round(_width * 96)}px`})
          const popupExtent = this.basemap.getView().calculateExtent([_height * 96, _width * 96]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([_height * 96 , _width * 96])
          this.printMap.updateSize()
         }

    }
  })
 }

 onDPIOptionSelected(dpi){
  console.log(dpi, " check dpi")
  const orientation = this.addPresentationFormGroup.get('addOrientation').value
  this.presentationPageSizes.map((x)=>{
    if(this.addPresentationFormGroup.get('addPageSize').value === x.name){
          const pageWidth = x.value[0] / 25.4
          const pageHeight = x.value[1] / 25.4

         const divWidth = 564 * 0.0104166667
         const divHeight = 640 * 0.0104166667

       
         console.log(pageWidth, pageHeight , "in the dpi option")
         
         const newWidth = divHeight * pageWidth / pageHeight

         console.log(newWidth, "new width in dpi selected")

         const resolution_width = dpi * newWidth

         const resolution_height = dpi * divHeight
   
         console.log(resolution_width, resolution_height , "after added dpi width and height in px")
   
         const _width = resolution_width / dpi
         
         const _height = resolution_height / dpi
   
         console.log(_width , _height , "check width and height in inh")


         if(orientation === 'Portrait'){
          console.log("in the potrait", newWidth , divHeight)

          console.log(resolution_width, resolution_height , "after adding dpi to width and height")

          console.log(_width , _height , "original width and height in inches")

          $(".print-style").css({"width" : `${_width}in`, "height" : `${_height}in`, "margin" : 'auto auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${_width}in`,"overflow":"auto","max-height": `${_height}in`})
          const popupExtent = this.basemap.getView().calculateExtent([_width * 96, _height * 96 ]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([_width * 96 , _height * 96])
         }else{
          console.log("in the lanscape" , _height , _width)


          console.log( resolution_height , resolution_width , "after adding dpi to width and height")

          console.log(_height, _width , "original width and height in inches")

          $(".print-style").css({"width" : `${_height}in`, "height" : `${_width}in`, "margin" : '4rem auto'})
          $(".print-map").css({"resize" : "both", "max-width" : `${_height}in`,"overflow":"auto","max-height": `${_width}in`})
          const popupExtent = this.basemap.getView().calculateExtent([_height * 96, _width * 96 ]);
          this.printMap.getView().fit(popupExtent);
          this.printMap.setSize([_height * 96 , _width * 96])
         }

    }
  })
  
 }


 public loadAllBaseMaps(options) {
  let _basemapFactory = new BasemapFactory('openstreet');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  _basemapFactory = new BasemapFactory('satellite');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  _basemapFactory = new BasemapFactory('terrain');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  _basemapFactory = new BasemapFactory('bingsatellite');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  /* _basemapFactory = new BasemapFactory('bingstreet');
  this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer()); */
  _basemapFactory = new BasemapFactory('googlestreet');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  _basemapFactory = new BasemapFactory('googleSatellite');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());    
  _basemapFactory = new BasemapFactory('toner');
  this.printMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  /* if (options.pageType === 'DEFAULT') {
    _basemapFactory = new BasemapFactory('bingsatellite');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  } else {
    _basemapFactory = new BasemapFactory('bingstreet');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
  } */
}

getMaptypeSelected(map){
  var mapType;

  this.mapTypesList.map((x)=>{
    console.log(x)
    console.log(map.value)
  if(x.name === map.value)
    mapType = x.value

    console.log(mapType, "check")

    this.printMap.getLayers().forEach(layer => {

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
  })

    // #TODO - later this code need to be simply & easly...


}

submit(): any {
  this.printMap.controls.forEach(control => {
    console.log('what is control here ', control);
    if (control.values_ !== null && control.values_.units !== undefined) {
      this.printMap.removeControl(control);
      control.setUnits(this.addPresentationFormGroup.controls.addMapscale.value);
      // this.mapProjectionUnits = this.setMapProjectionUnits(control.renderedHTML_);
      this.mapProjectionUnitsPopup = this.setMapProjectionUnits(control.element.innerText);
      this.printMap.addControl(control);
    }
  });
  // this.observ.updateUnits(this.addPresentationFormGroup.controls.addMapscale.value);
  // this.modalService.dismissAll('close');
  // localStorage.setItem('unit', this.addPresentationFormGroup.controls.addMapscale.value);
}

  onOrientOptionsSelected(selectedValue): any {
    console.log('selected value ', selectedValue);
    this.selectedOrientation = selectedValue;
    /* setTimeout(() => {
      this.calcuating_PolygoneFromPDFSize();
    }, 500); */
    // this.calculatePrintFrame_FitMap(true);
    // this.embeddingPrintMap();
  }
  onPdfOptionsSelected(selectedValue): any {
    console.log('selected value ', selectedValue);
    this.selectedPageSize = selectedValue;
    // this.calculatePrintFrame_FitMap(true);
    // this.embeddingPrintMap();
  }
  isValid(str): any {
    if (str == null || str === undefined || str === ' ' || str === '' || str === 'null' || str === 'undefined') {
      return false;
    } else { return true; }
  }
  getScaleLineWidth(): any {
    setTimeout(() => {
      try {
        const mapControlCollection: any[] = this.printMap.getControls().array_;
        mapControlCollection.forEach(element => {
          if (this.isValid(element.renderedWidth_)) {
            this.scaleLineWidth = element.renderedWidth_;
          }
        });
        // console.log('SCALE LINE WIDTH : ', this.scaleLineWidth);
      } catch (e) {
        console.log(e);
      }
    }, 1000);
  }
  getMapProjectionUnits(): any {
    this.printMap.controls.forEach(control => {
      // console.log(this.printMap, control);
      if (this.commonService.isValid(control.values_)) {
        if (control.values_.units !== undefined) {
          setTimeout(() => {
            // console.log('Here scal line ', control, control.renderedHTML_, control.element.innerText);
            this.mapProjectionUnitsPopup = this.setMapProjectionUnits(control.element.innerText);
          }, 1000);
        }
      }
    });
  }
  setMapProjectionUnits(val): any {
    const tempArr = val.split(' ');
    if (tempArr.length > 1) {
      // Here adding new code for view factory related
      const scaleLine = tempArr[3].match(/\d+/g);
      const scalByHalf = Number(scaleLine) / 2;
      const value = tempArr[2].slice(0, tempArr[2].length - (scalByHalf.toString().length)).slice(0, -1); // .replace(/\,/g, '');
      // console.log(tempArr, ' :: ', scaleLine, ' : ', value);
      const viewFactory = tempArr[0] + tempArr[1] + value;
      // this.observ.updateViewFactory(viewFactory);
      if (scaleLine.includes('.')) {
        let fixedNum = scaleLine.substr(scaleLine.indexOf('.') + 1).length;
        // console.log(fixedNum);
        if (fixedNum > 5) {
          // console.log('MORE THAN 5. SETTING TO 5');
          fixedNum = 5;
        }
        return String(Number(scaleLine).toFixed(fixedNum)) + ' ' + tempArr[4];
      } else {
        return scaleLine + ' ' + tempArr[4];
      }
    } else {
      return val;
    }
  }

  initializingMiniMap(mapLayer, projection) {
    console.log(mapLayer, "check layer")
    this.printMap = new Map({
      layers: [mapLayer],
      target: 'map-mini',
      controls: defaultControls().extend([
        new ScaleLine({
          className: 'ol-scale-text-mini',
          target: this.scaleContainerPopup,
          units: 'us',
          bar: true,
          text: true
        }),
      ]),
      view: new View({
        center: [0, 0],
        zoom: 4,
        projection: projection,
        constrainRotation: false
      }),
    });
  }

  embeddingPrintMap(): any {
    const projection = this.basemap.getView().getProjection().code_;
    this.basemap.getLayers().forEach(basemapLayer => {
      const layerName = basemapLayer.values_.name;
      if (layerName === 'terrain' || layerName === 'openstreet' || layerName === 'satellite'
        || layerName === 'toner' || layerName === 'bingsatellite' || layerName === 'bingstreet'
        || layerName === 'googlestreet' || layerName === 'googlesatellite') {
        if (basemapLayer.values_.visible) {
          const basemapFactory = new BasemapFactory(layerName);
          const mapLayer: OlTileLayer = basemapFactory.getBaseMap().getMapTileLayer();
          mapLayer.setVisible(true);
          this.initializingMiniMap(mapLayer, projection);
          // this.calculatePrintFrame_FitMap(false);
        }
      }
    });
    /* this.calcuating_PolygoneFromPDFSize();
    this.showSitesInfoFun(); */
  }
  // calculatePrintFrame_FitMap(isSelectionChange) {
  //   this.printMap.getView().setRotation(this.basemap.getView().getRotation());
  //   this.rotationValue = this.basemap.getView().getRotation() * 180 / Math.PI;
    // /* try{
    //   const globeIconDraggable = Draggable.get('#rotationN');
    //   TweenLite.set('#rotationN', { rotation: this.rotationValue });
    //   globeIconDraggable.update();
    // } catch (e){
    //   console.log(e);
    // } */
  //   // globeIconDraggable.update();
  //   /* 1 inch = 25.4 mm
  //   dpi = 96 px / in
  //   96 px / 25.4 mm
  //   Therefore one pixel is equal to
  //   1 px = 25.4 mm / 96
  //   1 px = 0.26458333 mm */
  //   let pdfSize = this.selectedPageSize;
  //   if (this.selectedPageSize.length > 2) {
  //     pdfSize = [];
  //     pdfSize.push(this.selectedPageSize.split(',')[0], this.selectedPageSize.split(',')[1]);
  //   }    
  //   // mm = ( pixcel * 25.4 ) / DPI(default 96)
  //   // pixcel = mm * 96(for DPI) / 25.4
  //   // ratio calculation = width/height & 1 / result(w/h)
  //   const pdfWidthHeightRatio = pdfSize[0] / pdfSize[1];
  //   const pdfHeightWidthRatio = 1 / pdfWidthHeightRatio;
  //   // main whitespace Div Height & Width to mm
  //   const divWidth = this.presentationIMGContainer.nativeElement.offsetWidth * 25.4 / 96;
  //   const divHeight = this.presentationIMGContainer.nativeElement.offsetHeight * 25.4 / 96;
  //   // calculting mapPopup height & width
  //   const mapWindowHeight = divWidth / pdfHeightWidthRatio;
  //   const mapWindoWidth = divHeight / pdfHeightWidthRatio;
  //   const printFrameSize = [];
  //   let printFrameFitMapSize = [210, 297];
  //   const mapDivSize = [this.mapDiv.nativeElement.offsetWidth, this.mapDiv.nativeElement.offsetHeight];
  //   if (this.selectedOrientation !== 'portrait') {
  //     printFrameSize.push(pdfSize[1], pdfSize[0]);
  //     this.ptool.nativeElement.style.width = mapWindowHeight + 'mm';
  //     this.ptool.nativeElement.style.height = (mapWindoWidth - 0) + 'mm';  
  //     printFrameFitMapSize = [297, 210];
  //   } else {
  //     printFrameSize.push(pdfSize[0], pdfSize[1]);
  //     this.ptool.nativeElement.style.width = mapWindoWidth + 'mm';
  //     this.ptool.nativeElement.style.height = (mapWindowHeight - 0) + 'mm';
  //     printFrameFitMapSize = [210, 297];
  //   }
  //   this.mapDiv.nativeElement.style.width = this.ptool.nativeElement.offsetWidth + 'px';
  //   this.mapDiv.nativeElement.style.height = this.ptool.nativeElement.offsetHeight + 'px';
  //   this.mapDiv.nativeElement.style.maxWidth = this.ptool.nativeElement.offsetWidth + 'px';
  //   this.mapDiv.nativeElement.style.maxHeight = this.ptool.nativeElement.offsetHeight + 'px';
  //   this.ptool.nativeElement.style.maxHeight = this.presentationIMGContainer.nativeElement.offsetHeight + 'px';

  //   console.log('calculated data - pdfWidthHeightRatio: ', pdfWidthHeightRatio, ' pdfHeightWidthRatio: ', pdfHeightWidthRatio,
  //   ' divWidth: ', divWidth, ' divHeight: ', divHeight,
  //   'mapWindowHeight: ', mapWindowHeight, ' mapWindoWidth: ', mapWindoWidth,
  //   '--> mapWindowHeight: ', mapWindowHeight * 96 / 25.4, ' mapWindoWidth: ', mapWindoWidth * 96 / 25.4);

  //   if(!isSelectionChange) {
  //     const popupExtent = this.basemap.getView().calculateExtent(printFrameFitMapSize);
  //     this.printMap.getView().fit(popupExtent);
  //     console.log(pdfSize, printFrameSize, printFrameFitMapSize, popupExtent, this.ptool, getCenter(popupExtent),
  //     this.basemap.getView().getCenter(), this.printMap.getView().getCenter(),
  //     this.basemap.getView().getResolution(), this.printMap.getView().getResolution(),
  //     Math.round(pdfSize[0] * this.selectedDPI / 25.4), Math.round(pdfSize[1] * this.selectedDPI / 25.4),
  //     this.presentationIMGContainer.nativeElement.offsetWidth,
  //     this.presentationIMGContainer.nativeElement.offsetHeight,
  //     Math.round((printFrameSize[0] * this.selectedDPI / 25.4) / this.presentationIMGContainer.nativeElement.offsetWidth * 100),
  //     Math.round((printFrameSize[1] * this.selectedDPI / 25.4) / this.presentationIMGContainer.nativeElement.offsetHeight * 100));
  //     this.getScaleLineWidth();
  //     this.getMapProjectionUnits();
  //   } else {
  //     this.printMap.updateSize();
  //   }
  //   this.showSitesInfoFun();
  // }
  removePolygon(): any {
    if (this.printMap.getLayers().values_.length > 0) {
      this.printMap.getLayers().forEach(layer => {
        console.log(layer);
        if (layer !== undefined) {
          if (layer.values_.name === 'orientationPrint') {
            this.printMap.removeLayer(layer);
          }
        }
      });
    }
  }

  drawPolygon(popupExtent): any {
    console.log(this.printMap.getLayers());
    if (this.printMap.getLayers().values_.length > 0) {
      this.printMap.getLayers().forEach(layer => {
        console.log(layer);
        if (layer !== undefined) {
          if (layer.values_.name === 'orientationPrint') {
            this.printMap.removeLayer(layer);
          }
        }
      });
    }
    this.printMap.addLayer(
      new VectorLayer({
        name: 'orientationPrint',
        source: new VectorSource({
          features: [new Feature(fromExtent(popupExtent))]
        }),
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.7)' // 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new Stroke({
            color: "blue",
            width: 2
          })
        })
      })
    );
  }

  showSitesInfoFun(): void {
    this.activeSitesForPresentation = [];
    // this.showPresentaiton = true;
    const activeSites = [];
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      if (this.commonService.isValid(layer)) {
        // TO IDENTIFY SITE LAYERS ONLY
        if (this.commonService.isValid(layer.values_.geopadCustomData)) {
          activeSites.push(layer);
        }
      }
    });
    activeSites.forEach(element => {
      this.printMap.addLayer(element);
      const site = element.values_.geopadCustomData.site;
      this.activeSitesForPresentation.push({
        name: site.locationName,
        type: site.siteType,
        fillColour: site.fillColour,
        iconColour: site.iconColour
      });
    });
    console.log(this.activeSitesForPresentation);
  }

  showPresentaitonFun_old(): void {
    this.activeSitesForPresentation = [];
    this.showPresentaiton = true;
    const activeSites = [];
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      if (this.commonService.isValid(layer)) {
        // TO IDENTIFY SITE LAYERS ONLY
        if (this.commonService.isValid(layer.values_.geopadCustomData)) {
          activeSites.push(layer);
        }
      }
    });
    activeSites.forEach(element => {
      const site = element.values_.geopadCustomData.site;
      this.activeSitesForPresentation.push({
        name: site.locationName,
        type: site.siteType,
        fillColour: site.fillColour,
        iconColour: site.iconColour
      });
    });
    console.log(this.activeSitesForPresentation);
  }
  
  setValueForInputFromSelect(event, inputFrom: string, listItems: any[]): void {
    console.log(event);
    const val = event.target.value;
    let nameToSet = '';
    const index = listItems.findIndex(item => String(item.value) === String(val));
    if (index !== -1) {
      nameToSet = listItems[index].name;
    }
    try {
      if (inputFrom === 'dpi') {
        this.dpiInput.nativeElement.value = nameToSet;
      }
    } catch (e) {

    }
  }
  createHeaders(keys) {
    var result = [];
    for (var i = 0; i < keys.length; i += 1) {
      result.push({
        id: keys[i],
        name: keys[i],
        prompt: keys[i],
        width: 70,
        height: 5,
        align: "center",
        padding: 0
      });
    }
    return result;
  }
  
  downloadPDF(mapXY,ptool) {
    document.body.style.cursor = 'progress';
    // document.querySelector('.print-map .ol-viewport .ol-layers .ol-layer canvas').style.filter = "opacity(0%)";
    this.removePolygon();
    const resolution = this.selectedDPI;
    const map = this.printMap; // this.basemapService.getCurrentBasemap();
    let pdfSize = this.selectedPageSize;
    if (this.selectedPageSize.length > 2) {
      pdfSize = [];
      pdfSize.push(this.selectedPageSize.split(',')[0], this.selectedPageSize.split(',')[1]);
    }
    let width = Math.round(pdfSize[0] * resolution / 25.4);
    let height = Math.round(pdfSize[1] * resolution / 25.4);
    console.log(width,height, "check width & height")
    let orgSize = map.getSize();
    const orgZoom = map.getView().getZoom();  //edit2
    const orgExtent = map.getView().calculateExtent(orgSize);
    const popupWindowSize = [];
    popupWindowSize.push(pdfSize[0], pdfSize[1]);
    const _width = pdfSize[0];
    const _height = pdfSize[1];
    if (this.selectedOrientation !== 'portrait') {
      pdfSize = [];
      pdfSize.push(_height, _width);
    }
    const size = popupWindowSize;
    const extent = map.getView().calculateExtent(size);
    // this.basemapService.getCurrentBasemap().getView().fit(extent);
    const mapView = map.getView();
    const currZoom = map.getView().getZoom();  //edit2
    const mapProjection = mapView.getProjection();
    let mapResolutionAtEquator = mapView.getResolution();
    const viewCenter = mapView.getCenter();
    mapResolutionAtEquator = mapView.getResolution();
    const mapPointResolution = getPointResolution(mapProjection, mapResolutionAtEquator, viewCenter);
    const mapResolutionFactor = mapResolutionAtEquator / mapPointResolution;
    const orientation = this.selectedOrientation;
    const sitesList = this.activeSitesForPresentation;
    const headers = this.createHeaders([
      "type",
      "name"
    ]);
    let closeTool = this.showPresentaiton;
    const scale1 = (width * mapPointResolution * 1000) / pdfSize[0];
    const imageScaleDivID = this.imageScaleDivID.nativeElement;
    const scaleContainerPopup = this.scaleContainerPopup.nativeElement;
    const imgContainerPopup = this.imgContainerPopup.nativeElement;
    let legendContainerPopup;
    if (this.legendContainerPopup !== undefined) {
      legendContainerPopup = this.legendContainerPopup.nativeElement;
    }

    // code for calculating the BBox from DPI & PDF Size
    // DPI dots for inch
    // pdf width inches = pdf.width*DPI = pixcels
    // pdf height inches = pdf.height*DPI  =pixcels
    const xPixcels = pdfSize[0] * resolution / 25.4;
    const yPixcels = pdfSize[1] * resolution / 25.4;
    const pixcelsToCoords = map.getCoordinateFromPixel([xPixcels, yPixcels]);
    const CoordsTopixcels = map.getPixelFromCoordinate(viewCenter);
    console.log('calculation BBox from DPI * Pdf size: ', pdfSize, xPixcels, yPixcels, viewCenter, pixcelsToCoords, CoordsTopixcels);


    console.log('Printing map data', size, extent, mapProjection, mapResolutionAtEquator, mapPointResolution,
      mapResolutionFactor, orientation, scale1, currZoom, orgZoom);
    const divWidth = imageScaleDivID.offsetWidth;
    const divHeight = imageScaleDivID.offsetHeight;
    console.log(divWidth, divHeight, scaleContainerPopup.offsetWidth, scaleContainerPopup.offsetHeight,
      imgContainerPopup.offsetWidth, imgContainerPopup.offsetHeight);
    map.once('rendercomplete', function (event) {
      // const canvas = event.context.canvas;
      console.log('Time Start --- ', new Date());
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = pdfSize[0] * 3.7795275591;
      mapCanvas.height = pdfSize[1] * 3.7795275591;
      /* if (orientation !== 'portrait') {
        mapCanvas.width = pdfSize[1];
        mapCanvas.height = pdfSize[0];
      } */
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        document.querySelectorAll('.print-map .ol-viewport .ol-layers .ol-layer canvas'),
        function (canvas) {
          if (canvas.width > 0) {
            const opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const transform = canvas.style.transform;
            // Get the transform parameters from the style's transform matrix
            const matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix
            );
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      const data = mapCanvas.toDataURL('image/jpeg');
      // const pdf = new jsPDF.jsPDF(orientation);
      const pdf = new jsPDF({
        orientation : orientation
      })
      const getSize = document.getElementsByClassName('print-size')
  
      const mapX =  parseInt(mapXY.style.left) 
      const mapY = parseInt(mapXY.style.top)
      const mapWidth = parseInt(mapXY.style.width)
      const mapHeight = parseInt(mapXY.style.height)
      const totalWidthMap = parseFloat(ptool.style.width) * 3.7795275591
      console.log(parseFloat(ptool.style.width),totalWidthMap, "check total width")
      console.log(mapX,mapY, 100,200,"naveen")
      pdf.addImage(data, 'JPEG', mapX, mapY, mapWidth , mapHeight );
      // --- Code for Other Data - scale-container-popup
      // -- Here for Lables indication
      const imgProps = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      console.log('printing image properties: ', imgProps, pdfWidth, pdfHeight, legendContainerPopup);
      const logoX = pdfSize[0] - 40;
      const logoY = pdfSize[1] - 10;
      pdf.addImage(
        'assets/svgs/properties_icon/new/logo_bg.png',
        'JPEG', logoX, logoY, 40, 10
      );

      html2canvas(imgContainerPopup, { backgroundColor: null }).then(function (canvasElement) {
        var img = canvasElement.toDataURL("image/png");
        pdf.addImage(img, 'JPEG', 0, 1, imgContainerPopup.offsetWidth / 4, imgContainerPopup.offsetHeight / 4);
        // pdf.save('FE-Map.pdf');
        html2canvas(scaleContainerPopup).then(function (canvasElementS) {
          var img = canvasElementS.toDataURL("image/png");
          pdf.addImage(img, 'JPEG', 0, imgContainerPopup.offsetWidth / 4, scaleContainerPopup.offsetWidth / 4, scaleContainerPopup.offsetHeight / 4);
          if (sitesList.length > 0) {
            html2canvas(legendContainerPopup).then(function (canvasElementLegend) {
              var legend = canvasElementLegend.toDataURL('image/png');
              pdf.addImage(legend, 'JPEG', 1, scaleContainerPopup.offsetWidth / 2, legendContainerPopup.offsetWidth / 4, legendContainerPopup.offsetHeight / 4);
              pdf.save('FE-Map.pdf');
            });
          } else {
            pdf.save('FE-Map.pdf');
          }
          /* if(sitesList.length > 0 ) {
            const generateData = function(totalSites) {
              var result = [];
              let isPointAvailable = false;
              let isLineAvailable = false;
              let isPolygonAvailable = false;
              sitesList.forEach((site) => {
                const data = {
                  type: site.type,
                  name: site.name
                }
                // result.push(Object.assign({}, data));
                if(site.type === 'Point') {
                  if(!isPointAvailable) {
                    data.type = 'O';
                    data.name = 'Point';
                    result.push(Object.assign({}, data));
                    isPointAvailable = true;
                  }
                }
                if(site.type === 'LineString') {
                  if(!isLineAvailable) {
                    data.type = '____';
                    data.name = 'Line'
                    result.push(Object.assign({}, data));
                    isLineAvailable = true;
                  }
                }
                if(site.type === 'Polygon') {
                  if(!isPolygonAvailable) {
                    data.type = '[]';
                    data.name = 'Polygon'
                    result.push(Object.assign({}, data));
                    isPolygonAvailable = true;
                  }
                }
              });
              return result;
            };
            const tableY = logoY - 40;
            pdf.table(1, scaleContainerPopup.offsetWidth / 4, generateData(sitesList.length), headers, { autoSize: true });
          }
          pdf.save('FE-Map.pdf');  */
        });
      });
      // --- End of Code for Other Data

      // pdf.save('FE-Map.pdf');
      map.setSize(orgSize);
      // map.getView().fit(extent, size);
      // map.renderSync();
      mapView.setZoom(orgZoom);
      document.body.style.cursor = 'auto';
    });
    const printPointResolution = (scale1 * 25.4) / (resolution * 1000);
    const printResolutionAtEquator = mapResolutionFactor * printPointResolution;
    const printZoom = mapView.getZoomForResolution(printResolutionAtEquator);
    // const printZoom = Math.log(mapView.getMaxResolution() / printResolutionAtEquator) / Math.log(2);
    console.log('final data ', printPointResolution, printResolutionAtEquator, printZoom,
      Math.log(mapView.getMaxResolution() / printResolutionAtEquator) / Math.log(2), mapView.getMaxResolution());
    map.setSize(pdfSize);
    mapView.setZoom(printZoom);
    // map.renderSync();
  }

  private _updateDraggableObj(): any {
    Draggable.create('#rotationN', {
      type: 'rotation',
      throwProps: true,
      // bounds: { minRotation: -23, maxRotation: 337 },
      onDrag: (e) => {
        console.log('drag start ', e);
        let target = null;
        if (e.target.tagName === 'IMG') {
          console.log("img matched")
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationN') {
          console.log("rotationId MATCHED")
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
          target = this.rotateN.nativeElement;
          // target = e.target;
        }
        if (this.commonService.isValid(target)) {
          console.log(target,"in the ondrag")
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          // console.log(element);
          // console.log(element._gsTransform);
          let angle = element._gsTransform.rotation;
          // console.log(e, angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          // this._setRotation(angle);
          this.printMap.getView().setRotation(angle * Math.PI / 180);
        } else {
          console.log('INVALID TARGET...');
        }
      },
      onDragEnd: (e) => {
        console.log('drag end ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationN') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
          target = this.rotateN.nativeElement;
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          let angle = element._gsTransform.rotation;
          console.log(angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          // this._setRotation(angle);
          console.log(this.mapDiv.nativeElement.offsetWidth, this.mapDiv.nativeElement.offsetHeight, "check width and height naveen")
          this.printMap.getView().setRotation(angle * Math.PI / 180);
        } else {
          console.log('INVALID TARGET...');
        }
      }
    });
    const globeIconDraggable = Draggable.get('#rotationN');
    TweenLite.set('#rotationN', { rotation: 0 });
    globeIconDraggable.update();
  }

  private _fieldDraggableObj(): any {

    Draggable.create('#rotationField', {
      type: 'rotation',
      throwProps: true,
      // bounds: { minRotation: -23, maxRotation: 337 },
      onDrag: (e) => {
        console.log('drag start ', e);
        let target = null;
        if (e.target.tagName === 'IMG') {
          console.log("img matched")
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationField') {
          console.log("rotationId MATCHED")
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
          target = this.rotationField.nativeElement;
          // target = e.target;
        }
        if (this.commonService.isValid(target)) {
          console.log(target,"in the ondrag")
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          // console.log(element);
          // console.log(element._gsTransform);
          let angle = element._gsTransform.rotation;
          // console.log(e, angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          // this._setRotation(angle);
          this.printMap.getView().setRotation(angle * Math.PI / 180);
        } else {
          console.log('INVALID TARGET...');
        }
      },
      onDragEnd: (e) => {
        console.log('drag end ', e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationField') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
          target = this.rotationField.nativeElement;
        }
        if (this.commonService.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          let angle = element._gsTransform.rotation;
          console.log(angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this.angleRotate = `${parseInt(angle)}°`
          // this._setRotation(angle);
          console.log(this.mapDiv.nativeElement.offsetWidth, this.mapDiv.nativeElement.offsetHeight, "check width and height naveen")
  
            this.printMap.getView().setRotation(angle * Math.PI / 180)
          console.log(angle, "check angle" )
        } else {
          console.log('INVALID TARGET...');
        }
      }
    });
    const globeIconDraggable = Draggable.get('#rotationField');
    TweenLite.set('#rotationField', { rotation: 0 });
    globeIconDraggable.update();
  }
  setDefaultPosition(event) {
    this._updateDraggableObj();
    this.rotationValue = 0;
    this.printMap.getView().setRotation(0 * Math.PI / 180);
  }

draggableMapView(){
   this.print_view = document.querySelector(".print-map")
   
   //map move function
    this.print_view.addEventListener("mousedown", (event)=>{
      if(event.altKey === true){
          this.print_view.addEventListener("mousemove", ()=>{
            $(".print-map").css({"cursor": "move"})
            $(".print-map").draggable({containment: "parent" })
          });
      }
   
        this.print_view.addEventListener("mouseup", ()=>{
        this.print_view.removeEventListener("mousemove", ()=>{
          $(".print-map").draggable({containment: "parent" })
        })
       
      })
     })

     this.logo_view = document.querySelector(".logo-move")

     //image move function
     this.logo_view.addEventListener("mousedown", ()=>{

         this.logo_view.addEventListener("mousemove", ()=>{
           $(".logo-move").draggable({containment: "parent" })
         })

       this.logo_view.addEventListener("mousedown", ()=>{
         this.logo_view.removeEventListener("mousemove", ()=>{
           $(".logo-move").draggable({containment: "parent" })
         })
       })
     })

     this.compass_view = document.querySelector(".compass-move")

     //compass move function
     this.logo_view.addEventListener("mousedown", ()=>{

         this.logo_view.addEventListener("mousemove", ()=>{
           $(".compass-move").draggable({containment: "parent" })
         })

       this.logo_view.addEventListener("mousedown", ()=>{
         this.logo_view.removeEventListener("mousemove", ()=>{
           $(".compass-move").draggable({containment: "parent" })
         })
       })
     })

     this.creditmove = document.querySelector(".credit-move")
   console.log(this.creditmove, "check credittttttttt")
     //credit move function
    if(this.creditmove){
      this.creditmove.addEventListener("mousedown", ()=>{

        this.creditmove.addEventListener("mousemove", ()=>{
          $(".credit-move").draggable({containment: "parent" })
        })
  
      this.creditmove.addEventListener("mousedown", ()=>{
        this.creditmove.removeEventListener("mousemove", ()=>{
          $(".credit-move").draggable({containment: "parent" })
        })
      })
    })

    }     


    }

 checkPdfDownload(mapLogo,navigateN){
 const mapmini = this.mapDiv.nativeElement
 const rotateNEle = this.rotateN.nativeElement;
  var pdfwidth : any;
  var pdfheight : any;
  var orientation : any;
  var pdf : any;
  var filename;
  const dpi = this.addPresentationFormGroup.get('addDpi').value

  this.presentationPageSizes.map((x)=>{
    if(x.name === this.addPresentationFormGroup.get('addPageSize').value){
      pdfheight = x.value[1]  / 25.4
      pdfwidth = x.value[0] / 25.4
      orientation = this.addPresentationFormGroup.get('addOrientation').value
    }
  })

  console.log(pdfwidth, pdfheight , dpi ,"check values")

  const width = Math.round(pdfwidth * Number(dpi))
  const height = Math.round(pdfheight * Number(dpi))

  const c_width = width / 25.4
  const c_height = height / 25.4

  console.log(width , height , "after dpi added width and height")

  console.log(c_width , c_height , "after c added width and height")


  const size = this.printMap.getSize();
  const viewResolution = this.printMap.getView().getResolution();

  console.log(size, viewResolution , "check size and resolution of map")
  console.log(this.printMap , "check olmap")

  // this.printMap.once('rendercomplete', function () {
    console.log("in the loop of render")

this.printMap.once('rendercomplete',function(){
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = width;
  mapCanvas.height = height;
  const mapContext = mapCanvas.getContext('2d');
  Array.prototype.forEach.call(
    document.querySelectorAll('.print-map .ol-viewport .ol-layers .ol-layer canvas'),
    function (canvas) {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity;
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
        const transform = canvas.style.transform;
        // Get the transform parameters from the style's transform matrix
        const matrix = transform
          .match(/^matrix\(([^\(]*)\)$/)[1]
          .split(',')
          .map(Number);
        // Apply the transform to the export map context
        CanvasRenderingContext2D.prototype.setTransform.apply(
          mapContext,
          matrix
        );
        mapContext.drawImage(canvas, 0, 0);
      }
    }
  );
  mapContext.globalAlpha = 1;
  mapContext.setTransform(1, 0, 0, 1, 0, 0);

       if(orientation === 'Portrait'){
        console.log("potrait here")
        pdf = new jsPDF('p','in', [pdfwidth , pdfheight  ]);
        // pdf = new jsPDF({orientation : orientation});
        pdf.addImage(mapCanvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, pdfwidth ,pdfheight)

        // html2canvas(navigateN.nativeElement, {backgroundColor : null}).then(function (canvasElement) {
        //   var image = canvasElement.toDataURL("image/png");
        //   pdf.addImage(image, 'PNG', 0, 0, 500, 500)
        // })

       const obj = {
        "pdf" : pdf,
        "pdf_dimensions" : [pdfwidth, pdfheight],
        "dpi" : dpi,
        "data" : navigateN
        }
        console.log(pdf,"before adding ")
        PrintToolComponent.logoGenerate(obj,mapLogo)
        // PrintToolComponent.rotateNGenerate(obj,navigateN)
        html2canvas(rotateNEle).then(canvasEle => {
          pdf.addImage(canvasEle.toDataURL('image/png'), 'JPEG', 10, 10, 100, 100);
          filename = 'fe_buider' + '.pdf';
          pdf.save(filename);
        });
        /* var rotateElement = document.querySelector('#navigateArrow')
        pdf.html(rotateElement,0,0,200,200)
        console.log(pdf,"after adding ")
        filename = 'fe_buider' + '.pdf';
        pdf.save(filename); */

      }else{
        console.log("landscape here")
        pdf = new jsPDF('l', 'in', [pdfwidth  , pdfheight  ]);
        pdf.addImage(mapCanvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, pdfheight ,pdfwidth)
        filename = 'fe_buider' + '.pdf';
        pdf.save(filename);

      }


  // this.printMap.setSize(size);
  // this.printMap.getView().setResolution(viewResolution);
  // console.log(this.mapDiv.nativeElement, "map div")


});

const printSize = [width, height]
this.printMap.setSize(printSize)
const scaling = Math.min(width / size[0], height / size[1]);
this.printMap.getView().setResolution(viewResolution / scaling);


// switch(Number(dpi)){
//    case 100 :
//     this.recalculate_preview(2000,size)
//     break;
//     case 200 :
//     this.recalculate_preview(4000,size)
//     break;
//     case 300 :
//     this.recalculate_preview(7000,size)
//     break;
//     case 400 : 
//     this.recalculate_preview(20000,size)
//     break;  
//     default:
//       console.log("not matched any case of dpi")
// }

  // // domtoimage.toJpeg(div).then(function(dataURL){

  // //   img = new Image();
  // //   img.src = dataURL;
  // //   newImage = img.src;
  // //   // console.log(img , "test the image")

  // //   img.onload = function(){

  // //     var doc;
  // //     console.log(pdfwidth,pdfheight, "check array items")
  // //     console.log(orientation, "check value of orientation")
  // //     if(orientation === 'Portrait'){
  // //       console.log("potrait here")
  // //       doc = new jsPDF('p','in', [pdfwidth , pdfheight  ]);
  // //     }else{
  // //       console.log("landscape here")
  // //       doc = new jsPDF('l', 'in', [pdfwidth  , pdfheight  ]);
  // //     }

  // //     var width = doc.internal.pageSize.getWidth();
  // //     var height = doc.internal.pageSize.getHeight();
  // //     console.log(width ,height,"check values of width and height in in")
  // //     console.log(newImage, "check image")
  // //     if(orientation === 'Portrait'){
  // //       doc.addImage(newImage, 'PNG', 0, 0, width, height);
  // //       filename = 'fe_buider' + '.pdf';
  // //       doc.save(filename);
  // //     }else{
  // //       doc.addImage(newImage, 'PNG', 0 , 0, width, height);
  // //       filename = 'fe_buider' + '.pdf';
  // //       doc.save(filename);
  // //     }



  // //   };

  // // })
  // // .catch(function(error){

  // // });
  //   )
  // }


}

recalculate_preview(timer, size){
console.log(timer, "milliseconds allocated")
  setTimeout(() => {
    const popupExtent = this.basemap.getView().calculateExtent([size[0], size[1]]);
    this.printMap.getView().fit(popupExtent);
    
  }, timer);

}

static logoGenerate(obj,mapLogo){
  console.log(obj,"check obj")
  var img = new Image()
  img.src = 'assets/svgs/properties_icon/new/logo_bg.png'
  const pdf = obj.pdf
  const calculated_width = mapLogo.offsetWidth *  0.0104166667 * obj.dpi / 96
  const calculated_height = mapLogo.offsetHeight *  0.0104166667 * obj.dpi / 96

  console.log(calculated_width,calculated_height, "check the width and height")

  pdf.addImage(img.src, 'png', obj.pdf_dimensions[0] - calculated_width , obj.pdf_dimensions[1] - calculated_height , calculated_width , calculated_height)

}


static rotateNGenerate(obj,navigateN){
  const pdf = obj.pdf
  console.log(obj,"check obj")

  // var calculated_width;
  // var calculated_height;
var element = document.getElementById('navigateArrow')
html2canvas(element).then(canvas => {
  const contentDataURL = canvas.toDataURL('image/png')
  console.log(contentDataURL, "check url")
  pdf.addImage(contentDataURL, 'PNG', 0, 0, 100, 100 )
})

  // html2canvas(navigateN).then(canvas =>{
  //   const imageURL = canvas.toDataURL('image/png')
  //   console.log(imageURL,"check image")
  //   return imageURL
  // }).then(value=>{
  //   calculated_width = navigateN.offsetWidth *  0.0104166667 * obj.dpi / 96
  //   calculated_height = navigateN.offsetHeight *  0.0104166667 * obj.dpi / 96
 
  //  console.log(calculated_width,calculated_height, "check the width and height")

  //   console.log(value,"check output")
  //   pdf.addImage(value, 'PNG' , 0 , 0, calculated_width, calculated_height)
  // })


}

checkButtonFunction(e){
  var blob = URL.createObjectURL(e.target.files[0])
  this.uploadedImage = this.sanitizer.bypassSecurityTrustUrl(blob)
  this.checkUpload = true
}
}

