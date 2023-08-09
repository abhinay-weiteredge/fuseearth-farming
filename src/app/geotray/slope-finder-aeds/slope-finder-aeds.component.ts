import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  EventEmitter,
  Output,
  AfterViewInit,
} from '@angular/core';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { DragBox } from 'ol/interaction.js';
import { platformModifierKeyOnly } from 'ol/events/condition.js';
import { Select } from 'ol/interaction';
import Polygon from 'ol/geom/Polygon';
import { unByKey } from 'ol/Observable.js';
import { CommonService } from '../../Services/common.service';
import { features } from 'process';
import Overlay from 'ol/Overlay';
import { containsExtent } from 'ol/extent';
import CircleStyle from 'ol/style/Circle';
import { MatExpansionModule } from '@angular/material/expansion';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import Text from 'ol/style/Text';
import { GeotrayMenuComponent } from '../geotray-menu/geotray-menu.component';
import { Circle, Fill, Stroke, Style } from 'ol/style.js';
//import VectorLayer from 'ol/layer/Vector.js';
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
import { Console } from 'console';
import { ExcelService } from 'src/app/Services/readxlsxservice';
import * as XLSX from 'xlsx';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { MyService } from 'src/app/my-service.service';
import { MatrixPathAEDSService } from './matrix-path-aeds.service';
import { MatrixReverseAEDSService } from './matrix-reverse-aeds.service';
import { get as getProjection } from 'ol/proj.js';
import { GeobarAlertComponent } from 'src/app/geobar-alert/geobar-alert.component';
import { saveAs } from 'file-saver';
import { min } from 'rxjs-compat/operator/min';
import { SlopeAEDSService } from 'src/app/Services/slope-aeds.service';


@Component({
  selector: 'app-slope-finder-aeds',
  templateUrl: './slope-finder-aeds.component.html',
  styleUrls: ['./slope-finder-aeds.component.scss'],
})
export class SlopeFinderAEDSComponent implements OnChanges, OnInit {
  slopePercentage: number;
  @Input() angle: number;
  @Input() slopeRatio: string;
  @Input() onAEDSClicked;
  @Output() Slopevalue: EventEmitter<any> = new EventEmitter<any>();
  @Output() Angle: EventEmitter<any> = new EventEmitter<any>();
  @Output() Ratio: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(GeobarAlertComponent) alertComponent: GeobarAlertComponent;

  slopecursor = 'url(/assets/svgs/Farming/slope-finder-icon.svg) 31 68, auto';
  buffertoolcursor =
    'url(/assets/svgs/Farming/buffer-tool-icon.svg) 33.99999 68, auto';
  static spopupstatus: boolean;
  ratioCandidates: string;
  private basemap: OlMap;
  private renderer: Renderer2;
  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  draw: any;
  snap: any;
  excelData = null;
  LLC_ASCIIx: any;
  LLC_ASCIIy: any;
  Res_ASCII: any;
  cellsizeft: any;
  RCOUNT_ASCII: any;
  CCOUNT_ASCII: any;
  fileData: string;
  headerData: { [key: string]: string } = {}; // Declare headerData at the class level
  elevationData: number[][] = [];
  markedLocationCoOrds: Array<string> = [];
  showCoOrdsCopiedMsg: boolean;
  public EntSlopeValue: any;
  static bsmapservice: any;
  static excelData: any;
  pctslope: any;
  showError: boolean = false;
  constructor(
    private http: HttpClient,
    private excelService: ExcelService,
    private commonService: CommonService,
    private basemapService: BasemapService,
    private renderer2: RendererFactory2,
    private myService: MyService,
    private matrixpath: MatrixPathAEDSService,
    private matrixreverse: MatrixReverseAEDSService,
    private el: ElementRef,
    private SlopeAEDSService: SlopeAEDSService
  ) {
    this.renderer = this.renderer2.createRenderer(null, null);
    this.basemap = this.basemapService.getCurrentBasemap();
    this.myService.triggerKeyupEnter$.subscribe((data) => {
      // Handle the "Enter" keyup event here
      console.log('triggereddropsownvv..', data);
      // this.slopefindertool();
    });
  }
  baseService: BasemapService;

  closeslopepopup() {
    this.onAEDSClicked = false;
  }

  ngOnInit(): void {
    if (this.onAEDSClicked) {
      this.slopefindertool();
    }

    const fileUrl = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Fvermont_ch_6590.frf?alt=media&token=de4089ce-b2c3-4a95-a84b-751cfd3a2e7c';
    this.SlopeAEDSService.getTextFileData(fileUrl).subscribe(
      data => {
        if (!data) {
          // Fetching from cache
          this.SlopeAEDSService.getFileDataCache().subscribe(cachedData => {
            this.fileData = cachedData;
          });
        } else {
          // Fetching from URL and caching
          this.fileData = data;
          this.SlopeAEDSService.cacheFileData(data);
          console.log(data, "checkfrfdata")
          // Parse header and elevation data
          this.parseData(data);
        }
        // Now you can work with this.fileData
      },
      error => {
        console.error('Error fetching file data:', error);
      }
    );

  }
  private parseData(data: string): void {
    // The parsing code from my previous response
    // Extract headerData and elevationData from the parsed result
    // Parse the text data
    const lines = this.fileData.trim().split('\n');
    let isHeader = false;
    let headerData: { [key: string]: string } = {};
    let elevationData: number[][] = [];

    for (const line of lines) {
      if (line.includes('HEADERBEGIN')) {
        isHeader = true;
        continue;
      } else if (line.includes('HEADEREND')) {
        isHeader = false;
        continue;
      } else if (line.includes('DATABEGIN')) {
        isHeader = false;
        continue;
      }

      if (isHeader) {
        const [key, value] = line.split('\t');
        headerData[key] = value;
      } else if (!isHeader && line.trim() !== '') {
        const elevationRow = line.split(' ').map(Number);
        elevationData.push(elevationRow);
      }
    }

    // Extracted variables
    this.headerData.hrefsys = headerData.hrefsys;
    this.headerData.vrefsys = headerData.vrefsys;
    this.headerData.authority = headerData.authority;
    this.headerData.cellsize = headerData.cellsize;
    this.headerData.llcx = headerData.llcx;
    this.headerData.llcy = headerData.llcy;
    this.headerData.rows = headerData.rows;
    this.headerData.cols = headerData.cols;
    this.headerData.EPSGcode = `${this.headerData.authority.trim()}:${this.headerData.hrefsys.trim()}`;
    console.log(this.headerData.EPSGcode, "checkepsgcodeofasciii");
    // Save parsed elevation data
    this.elevationData = elevationData;
    console.log(this.headerData, this.elevationData[2][2], this.elevationData, "checkingheaderdataofhrf")
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.onAEDSClicked && changes.onAEDSClicked.currentValue === true) {
      this.slopefindertool();
      console.log(this.onAEDSClicked, 'checkonAEDSClickedinbuffertool');
    }
    if (changes.slopePercentage && !changes.slopePercentage.firstChange) {
      this.calculateAngleAndRatioFromSlope();
    }
    if (changes.angle && !changes.angle.firstChange) {
      this.calculateSlopeAndRatioFromAngle();
    }
    if (changes.slopeRatio && !changes.slopeRatio.firstChange) {
      this.calculateSlopeAndAngleFromRatio();
    }
    if (changes.slopeRatio && !changes.slopeRatio.firstChange) {
      this.slopefindertool();
    }
  }

  calculateAngleAndRatioFromSlope() {
    const slopeDecimal = this.slopePercentage;
    this.EntSlopeValue = slopeDecimal;
    console.log(this.EntSlopeValue, 'checkEntSlopeValue');
    this.Slopevalue.emit(this.slopePercentage);
    this.angle = (Math.atan(slopeDecimal) * 180) / Math.PI;
    console.log(this.angle, 'checkingggangle');
    this.angle = Number(this.angle.toFixed(2)); // round to 2 digits after decimal
    if (
      Number.isInteger(slopeDecimal) &&
      slopeDecimal >= 0 &&
      slopeDecimal <= 100
    ) {
      // Compute getRatio
      console.log(slopeDecimal, 'checkingggwhole');
      const slopeRatio = this.getRatio(slopeDecimal);
      const gcd = this.getGcd(slopeDecimal, 100);
      this.slopeRatio = `${slopeDecimal / gcd}:${100 / gcd}`;
    } else if (slopeDecimal >= 0 && slopeDecimal <= 100) {
      // Handle decimals
      console.log(slopeDecimal, 'checkingggangledecimals');
      this.slopeRatio = this.calculateRatioFromSlopePercentage(slopeDecimal);
    } else {
      // Handle input outside the range [0, 100]
      console.log(slopeDecimal, 'checkinggganglemore100');
      const slopeRatio = this.getRatio(slopeDecimal);
      const gcd = this.getGcd(slopeDecimal, 100);
      this.slopeRatio = `${slopeDecimal / gcd}:${100 / gcd}`;
    }
    console.log(this.slopeRatio, 'checkingggratio');
  }

  calculateSlopeAndRatioFromAngle() {
    const angleRad = (this.angle * Math.PI) / 180;
    const slope = Math.tan(angleRad) * 100;
    const slopeDecimal = slope / 100;
    this.slopePercentage = Number(slopeDecimal.toFixed(2)); // round to 2 digits after decimal
    this.Slopevalue.emit(this.slopePercentage);
    console.log(slopeDecimal, 'checkingggslopepercentage');
    if (
      Number.isInteger(this.slopePercentage) &&
      this.slopePercentage >= 0 &&
      this.slopePercentage <= 100
    ) {
      // Compute getRatio
      console.log(this.slopePercentage, 'checkingggwhole');
      const slopeRatio = this.getRatio(this.slopePercentage);
      const gcd = this.getGcd(this.slopePercentage, 100);
      this.slopeRatio = `${this.slopePercentage / gcd}:${100 / gcd}`;
    } else if (this.slopePercentage >= 0 && this.slopePercentage <= 100) {
      // Handle decimals
      console.log(this.slopePercentage, 'checkingggangledecimals');
      this.slopeRatio = this.calculateRatioFromSlopePercentage(
        this.slopePercentage
      );
    } else {
      // Handle input outside the range [0, 100]
      console.log(this.slopePercentage, 'checkinggganglemore100');
      const slopeRatio = this.getRatio(this.slopePercentage);
      const gcd = this.getGcd(this.slopePercentage, 100);
      this.slopeRatio = `${this.slopePercentage / gcd}:${100 / gcd}`;
    }
    console.log(this.slopeRatio, 'checkingggratio');
  }

  calculateSlopeAndAngleFromRatio() {
    const ratioArr = this.slopeRatio.split(':');
    const ratioDecimal = Number(ratioArr[0]) / Number(ratioArr[1]);
    const slope = ratioDecimal * 100;
    const angle = (Math.atan(slope) * 180) / Math.PI;
    this.slopePercentage = slope;
    console.log(slope, 'checkingggslopepercentage');
    this.slopePercentage = Number(slope.toFixed(2)); // round to 2 digits after decimal
    this.Slopevalue.emit(this.slopePercentage);
    this.angle = angle;
    console.log(this.angle, 'checkingggangle');
    this.angle = Number(this.angle.toFixed(2)); // round to 2 digits after decimal
    const gcd = this.getGcd(slope, 100);
  }

  getRatio(n: number): [number, number] {
    const tolerance = 1.0e-6;
    let h1 = 1,
      h2 = 0,
      k1 = 0,
      k2 = 1;
    let b = n;
    do {
      let a = Math.floor(b);
      let aux = h1;
      h1 = a * h1 + h2;
      h2 = aux;
      aux = k1;
      k1 = a * k1 + k2;
      k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(n - h1 / k1) > n * tolerance);

    // Simplify the ratio
    const gcd = this.getGcd(h1, k1);
    const h = h1 / gcd;
    const k = k1 / gcd;

    return [h, k];
  }

  getGcd(a: number, b: number): number {
    if (b === 0) {
      return a;
    } else {
      return this.getGcd(b, a % b);
    }
  }

  calculateRatioFromSlopePercentage(slopePercentage) {
    // Initialize an array to store the ratio candidates
    const ratioCandidates = [];

    // Iterate over the numbers 1 to 100 (or any other max number you choose)
    for (let i = 1; i <= 100; i++) {
      // Calculate the slope ratio for the current number
      const slopeRatioo = +(slopePercentage * i).toFixed(2);
      console.log(slopeRatioo, 'checkinggg*i');
      const ratio = Math.floor(slopeRatioo) + ':' + i;
      console.log(ratio, 'checkingggfloor');

      // Calculate the difference between the slope ratio and the result
      const diff = Math.abs(slopeRatioo - Math.floor(slopeRatioo)).toFixed(2);

      console.log(diff, 'checkingggdif');

      // Add the ratio and difference to the candidates array
      ratioCandidates.push({ ratio, diff });
    }

    // Sort the candidates array by the difference in ascending order
    ratioCandidates.sort((a, b) => a.diff - b.diff);

    // Return the ratio with the smallest difference
    return ratioCandidates[0].ratio;
  }

  /////////////////**READING TIFF EXCEL DATA */////////////////////////
  async readExcelData() {
    const url =
      'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2FTIFF_TEXT2.xlsx?alt=media&token=b07f550a-4d6b-44de-be44-5ca2edad3c18';
    const response = await fetch(url);
    const blob = await response.blob();
    const data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsBinaryString(blob);
    });
    const workbook = XLSX.read(data, { type: 'binary' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(range, 'vhevkrange');
    const DEM_Elev = [];
    const DEM_Elevft = [];
    // for(let R = range.s.r; R <= range.e.r; ++R) {
    //   const row = [];
    //   const rowft = [];
    //   for(let C = range.s.c; C <= range.e.c; ++C) {
    //     const cellAddress = XLSX.utils.encode_cell({r:R, c:C});
    //     console.log(cellAddress,"checkceladdress")
    //     const cellvalue = worksheet[cellAddress] ? worksheet[cellAddress].v : undefined;
    //     const cellvalueft = cellvalue/m2f_factor
    //     row.push(cellvalue);
    //     rowft.push(cellvalueft);
    //     console.log(cellvalue,cellvalueft,'checkdemelevationnn');
    //   }
    //   DEM_Elev.push(row);
    //   DEM_Elevft.push( )
    // }
    this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(this.excelData, 'checlexceldataaaa');
    console.log(DEM_Elev, DEM_Elevft, 'checkrowss');
    console.log(DEM_Elev, range, DEM_Elev, this.excelData, 'checkdemelevation');
  }

  ///////////////////***SLOPEFINDER TOOL *////////////////////////////
  async slopefindertool() {
    // Load Excel data into cache
    // console.log(this.commonService.sloperFinderAEDSpreview(), 'farmingobj')
    await this.readExcelData();
    // Create a new vector layer for the line and vertices
    const vectorLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 2,
        }),
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: 'red',
          }),
          stroke: new Stroke({
            color: 'blue',
            width: 2,
          }),
        }),
      }),
    });

    // Add the vector layer to the map
    if (!this.commonService.isValid(this.basemap)) {
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    this.basemap.addLayer(vectorLayer);

    // Create the interaction to draw the line
    var draw = new Draw({
      source: vectorLayer.getSource(),
      type: 'LineString',
    });

    // Add the draw interaction to the map
    this.basemap.addInteraction(draw);

    let coordinates = [];


    // Create an array to store the coordinates of the drawn line
    draw.on('drawend', async (event) => {
      // Get the coordinates of the drawn line
      coordinates = event.feature.getGeometry().getCoordinates();
      // var capturedcords = coordinates.
      console.log(
        coordinates[0],
        coordinates[0][0],
        coordinates[0][1],
        'checkcoords'
      );
      // if (!this.excelData) {
      //   // Wait for the Excel data to be fetched and cached
      //   await this.readExcelData();
      //   console.log(this.excelData, 'checkexceldata');
      // } else {
      // setTimeout(() => {
      //////////////////////////////****Access the ASCII data****////////////////////////
      //****PHASE 1 *////////////////////////////////////////////////////////////////////
      //const m2f_factor = 0.3048
      const Res_ASCII = parseFloat(this.headerData.cellsize); //Cellsize of ASCII
      const m2f_factor = 1;
      const LLC_ASCIIx = this.headerData.llcx; //Lowerleft corner X coordinate of ASCII
      const LLC_ASCIIy = this.headerData.llcy; //Lowerleft corner Y coordinate of ASCII
      const cellsizeft = 328.0839;
      const RCOUNT_ASCII = parseInt(this.headerData.rows); //Nomber Of ROWS in ASCII
      const CCOUNT_ASCII = parseInt(this.headerData.cols); //Number of COLUMNS in ASCII
      const DEM_Elev = this.elevationData; //Elevation values from DEM
      console.log(
        `"Res_ASCII":${Res_ASCII},"LLC_ASCIIx":${LLC_ASCIIx},"LLC_ASCIIy":${LLC_ASCIIy},"RCOUNT_ASCII":${RCOUNT_ASCII},"CCOUNT_ASCII":${CCOUNT_ASCII},"DEM_Elev":${DEM_Elev}`
      );
      // compute TRC_ASCII values
      const TRC_ASCIIx = LLC_ASCIIx + (CCOUNT_ASCII + 1) * Res_ASCII;
      const TRC_ASCIIy = LLC_ASCIIy + (RCOUNT_ASCII + 1) * Res_ASCII;
      const Res_ASCIIft = Res_ASCII / m2f_factor; //Cellsize of ASCII-Res_ASCII in Feet
      console.log(
        LLC_ASCIIx,
        LLC_ASCIIy,
        TRC_ASCIIx,
        TRC_ASCIIy,
        'checkTRC_ASCIIx_CS1xyasCS4'
      );
      //////////////////////////////****Transform LLC_ASCII into CS4 and store result as LLC_CS4****////////////////////////
      const transformed_Coordinates =
        this.basemapService.getTransformedCoordinates(
          [LLC_ASCIIx, LLC_ASCIIy],
          this.headerData.elevation,
          this.headerData.elevation
        );
      const LLC_CS4x = transformed_Coordinates[0];
      const LLC_CS4y = transformed_Coordinates[1];
      console.log(
        LLC_ASCIIx,
        LLC_ASCIIy,
        LLC_CS4x,
        LLC_CS4y,
        TRC_ASCIIx,
        TRC_ASCIIy,
        'checkTRC_ASCIIx_CS1xyasCS4'
      );
      //Transform TRC_ASCII into CS4 and store result as TRC_CS4
      const transformed_Coordinates_TRC =
        this.basemapService.getTransformedCoordinates(
          [TRC_ASCIIx, TRC_ASCIIy],
          this.headerData.elevation,
          this.headerData.elevation
        );
      var TRC_CS4x = transformed_Coordinates_TRC[0];
      var TRC_CS4y = transformed_Coordinates_TRC[1];
      console.log(
        LLC_ASCIIx,
        LLC_ASCIIy,
        LLC_CS4x,
        LLC_CS4y,
        TRC_ASCIIx,
        TRC_ASCIIy,
        TRC_CS4x,
        TRC_CS4y,
        'checkTRC_ASCIIx_CS1xyasCS4'
      );
      //compute Res_CS4
      const Res_CS4 = (TRC_CS4y - LLC_CS4y) / (RCOUNT_ASCII + 1);
      console.log(Res_CS4, 'checkcsrees');
      //Convert and store Res_CS4 in feet
      const Res_CS4ft = Res_CS4 / m2f_factor;

      //**PHASE 2 *////////////////////////////////////////////////////////////////////

      var USER_SLPCT = this.slopePercentage; // capture percentage (or ratio or angle) of slope
      //**capture initial and final coordinates in CS1 [CANDICS1: (candIx_CS1, candIy_CS1) and CANDFCS1: (candFx_CS1, candFy_CS1)] */
      // let Threshold = 0.5;
      let TOLERANCEE = 0.25; // Define the TOLERANCEE value
      // for (let i = 0.05; i <= 0.25; i += 0.05) {

      //     console.log(`Tolerence: ${TOLERANCEE}, Threshold: ${Threshold}`);

      const maxIterations = 10; // The loop will run 10 times
      const candFx_CS1 = coordinates[1][0].toFixed(6);
      const candFy_CS1 = coordinates[1][1].toFixed(6);
      let candIx_CS1 = coordinates[0][0].toFixed(6);
      let candIy_CS1 = coordinates[0][1].toFixed(6);


      for (let iterationCount = 0; iterationCount < 15; iterationCount++) {
        for (let j = 0.5; j <= 1.60; j += 0.5) {
          //     // Your code here
          //     TOLERANCEE = parseFloat(i.toFixed(2));
          let Threshold = parseFloat(j.toFixed(2));
          //  convert initial coordinates into CS4(CANDICS4)
          const transformed_candIx_CS1 =
            this.basemapService.getTransformedCoordinates(
              [candIx_CS1, candIy_CS1],
              this.basemapService.getCurrentBasemap().getView().getProjection(),
              this.headerData.elevation
            );
          const candIx_CS4 = transformed_candIx_CS1[0];
          const candIy_CS4 = transformed_candIx_CS1[1];
          console.log(
            candIx_CS1,
            candIy_CS1,
            candIx_CS4,
            candIy_CS4,
            'checkcandI_CS1xyasCS4'
          );
          //  convert final coordinates into CS4(CANDFCS4)
          const transformed_candFx_CS1 =
            this.basemapService.getTransformedCoordinates(
              [candFx_CS1, candFy_CS1],
              this.basemapService.getCurrentBasemap().getView().getProjection(),
              this.headerData.elevation
            );
          const candFx_CS4 = transformed_candFx_CS1[0];
          const candFy_CS4 = transformed_candFx_CS1[1];
          console.log(
            candIx_CS1,
            candIy_CS1,
            candIx_CS4,
            candIy_CS4,
            candFx_CS1,
            candFy_CS1,
            candFx_CS4,
            candFy_CS4,
            'checkcandF_CS1xyasCS4'
          );
          //** compute distance between the initial & final coordinates in CS1(CANDICS1 and CANDFCS1).*/
          const candist1 = Math.sqrt(
            Math.pow(candFx_CS1 - candIx_CS1, 2) +
            Math.pow(candFy_CS1 - candIy_CS1, 2)
          );
          //  compute distance between the initial & final coordinates in CS4(CANDICS4 and CANDFCS4).
          const candist4 = Math.sqrt(
            Math.pow(candFx_CS4 - candIx_CS4, 2) +
            Math.pow(candFy_CS4 - candIy_CS4, 2)
          );
          console.log(candist1, candist4, 'chewchdist1and4');
          //  store candist4 in feet
          const candist4ft = candist4 / m2f_factor;
          //**Check if user direction is Upslope or Downslope */
          // const row1 = Math.floor((candIy_CS1 - LLC_ASCIIy) / Res_ASCII);
          // const caprow1 = RCOUNT_ASCII - row1 + 1;
          // const col1 = Math.floor((candIx_CS1 - LLC_ASCIIx) / Res_ASCII);
          // const capcol1 = col1 + 1;
          // const CELEVI = this.excelData[caprow1][capcol1];
          // const CELEVIft = CELEVI / m2f_factor;
          // const row2 = Math.floor((candFy_CS1 - LLC_ASCIIy) / Res_ASCII);
          // const caprow2 = RCOUNT_ASCII - row2 + 1;
          // const col2 = Math.floor((candFx_CS1 - LLC_ASCIIx) / Res_ASCII);
          // const capcol2 = col2 + 1;
          // const CELEVF = this.excelData[caprow2][capcol2];
          // const CELEVFft = CELEVF / m2f_factor;
          // console.log(
          //   CELEVI,
          //   CELEVIft,
          //   CELEVF,
          //   CELEVFft,
          //   row1,
          //   col1,
          //   caprow1,
          //   capcol1,
          //   row2,
          //   col2,
          //   caprow2,
          //   capcol2,
          //   'capturedcellvalues'
          // );
          //**Checking the difference between Final and Initial Elevations for determining the Directions(Upslope/Downslope) */
          // if (CELEVI > CELEVF) {
          //   // Create a yellow bar with black text
          //   const errorMessage = document.createElement('div');
          //   errorMessage.style.background = 'yellow';
          //   errorMessage.style.color = 'black';
          //   errorMessage.style.padding = '10px';
          //   errorMessage.style.fontWeight = 'bold';
          //   errorMessage.textContent =
          //     'You are going upslope. Please change the direction and try again..!!';

          //   // Append the error message to the body of the document
          //   document.body.appendChild(errorMessage);

          //   // Optionally, you can also show the error message in an alert dialog
          //   alert(
          //     'You are going upslope. Please change the direction and try again..!!'
          //   );
          // }

          //** PHASE 3 Identify the zones of computation (ZOC) */
          // Impose the Geobon
          const GeobonRes = candist4 / 5;
          console.log(
            candist1,
            candist4,
            candist4ft,
            GeobonRes,
            'checkdistancebtwCandIFxy'
          );

          const CANDIr_LIOP = 0;
          const CANDIc_LIOP = 0;
          const CANDFc_LIOP = Math.floor((candFx_CS4 - candIx_CS4) / GeobonRes);
          const CANDFr_LIOP = Math.floor((candFy_CS4 - candIy_CS4) / GeobonRes);
          console.log(
            candIx_CS4,
            candIy_CS4,
            candFx_CS4,
            candFy_CS4,
            CANDIr_LIOP,
            CANDIc_LIOP,
            CANDFr_LIOP,
            CANDFc_LIOP,
            candist4,
            GeobonRes,
            'checkCANDFc_LIOP'
          );
          var GeobonZOC = [];
          console.log(GeobonZOC, 'checkgeobonzocarrays');
          const path = this.matrixpath.path;
          for (const [pathRow, pathCol] of path) {
            var D2CX = CANDFc_LIOP - pathCol;
            var D2CY = CANDFr_LIOP - pathRow;
            console.log(
              D2CX,
              D2CY,
              CANDFr_LIOP,
              CANDFc_LIOP,
              pathRow,
              pathCol,
              'CHECKD2CXY'
            );
            var D2D = Math.sqrt(
              Math.pow(CANDFr_LIOP - pathRow, 2) +
              Math.pow(CANDFc_LIOP - pathCol, 2)
            );
            const D2O = Math.sqrt(Math.pow(pathRow, 2) + Math.pow(pathCol, 2));
            var InitialDist = Math.sqrt(
              Math.pow(CANDFr_LIOP, 2) + Math.pow(CANDFc_LIOP, 2)
            );
            var TotalDist = D2D + D2O;
            var diff = TotalDist - InitialDist;
            if (diff < Threshold) {
              var NearcoordsR = pathRow;
              var NearcoordsC = pathCol;
              // var NearR = caprow1 + pathRow;
              // var NearC = capcol1 + pathCol;
              // const zoc = { NearR, NearC };
              GeobonZOC.push([NearcoordsR, NearcoordsC]);
              console.log(
                NearcoordsR,
                NearcoordsC,
                GeobonZOC,
                // NearR,
                // NearC,
                // this.excelData[NearR][NearC],
                'checkneardirectionscoords'
              );
            }
            console.log(
              `"CANDFr_LIOP":${CANDFr_LIOP},"CANDFc_LIOP":${CANDFc_LIOP},"D2CX":${D2CX},"D2CY":${D2CY},"D2D":${D2D},"D2O":${D2O},"InitialDist":${InitialDist},"TotalDist":${TotalDist},"diff":${diff},"NearcoordsR":${NearcoordsR},"NearcoordsC":${NearcoordsC}`
            );
          }
          let DEMCS4_ZOCI_col = Math.floor(
            (candIx_CS4 - LLC_CS4x) / (Res_CS4 * m2f_factor)
          );
          let DEMCS4_ZOCI_row = Math.floor(
            (candIy_CS4 - LLC_CS4y) / (Res_CS4 * m2f_factor)
          );
          let DEMCS4_ZOCF_col = Math.floor(
            (candFx_CS4 - LLC_CS4x) / (Res_CS4 * m2f_factor)
          );
          let DEMCS4_ZOCF_row = Math.floor(
            (candFy_CS4 - LLC_CS4y) / (Res_CS4 * m2f_factor)
          );
          const CELEVIN = this.excelData[DEMCS4_ZOCI_col][DEMCS4_ZOCI_row];
          const CELEVFI = this.excelData[DEMCS4_ZOCF_col][DEMCS4_ZOCF_row];
          console.log(
            DEMCS4_ZOCI_col,
            DEMCS4_ZOCI_row,
            // capcol1,
            // caprow1,
            CELEVIN,
            // CELEVI,
            DEMCS4_ZOCF_col,
            DEMCS4_ZOCF_row,
            // capcol2,
            // caprow2,
            CELEVFI,
            // CELEVF,
            'checkdemparameters'
          );
          // Initialize a string variable to store the results
          let resultsString = '';
          var DEM_ZOC_CS4 = [];
          var currCS4 = [];
          const DEM_ZOC_CS4_ELEV = [];
          const ELEV_DIFF = [];
          const INI_DEM_DIST = [];
          let coordinatess = [];
          let INIDEMROW =
            DEMCS4_ZOCI_row < DEMCS4_ZOCF_row ? DEMCS4_ZOCI_row : DEMCS4_ZOCF_row;
          let INIDEMCOL =
            DEMCS4_ZOCI_col < DEMCS4_ZOCF_col ? DEMCS4_ZOCI_col : DEMCS4_ZOCF_col;
          let FINDEMROW =
            DEMCS4_ZOCF_row > DEMCS4_ZOCI_row ? DEMCS4_ZOCF_row : DEMCS4_ZOCI_row;
          let FINDEMCOL =
            DEMCS4_ZOCF_col > DEMCS4_ZOCI_col ? DEMCS4_ZOCF_col : DEMCS4_ZOCI_col;
          const INI_ELEV = this.excelData[INIDEMCOL][INIDEMROW];
          const FIN_ELEV = this.excelData[FINDEMCOL][FINDEMROW];
          for (let i = INIDEMROW; i <= FINDEMROW; i++) {
            for (let j = INIDEMCOL; j <= FINDEMCOL; j++) {
              // Compute current x and y values
              const currCS4x = LLC_CS4x + j * (Res_CS4 * m2f_factor);
              const currCS4y = LLC_CS4y + i * (Res_CS4 * m2f_factor);
              currCS4.push([currCS4x, currCS4y]);
              // Compute GeobonZOC indexes for current x and y values
              const GeobonZOC_Col_CurrX = Math.floor((currCS4x - candIx_CS4) / GeobonRes);
              const GeobonZOC_Row_CurrY = Math.floor((currCS4y - candIy_CS4) / GeobonRes);
              console.log(i, j, currCS4y, currCS4x, GeobonZOC_Row_CurrY, GeobonZOC_Col_CurrX, "checkgeobonzoccolrowcurr")
              // Loop through GeobonZOC 2D array
              for (let k = 0; k < GeobonZOC.length; k++) {
                const geobonZOC_Row = GeobonZOC[k][0];
                const geobonZOC_Col = GeobonZOC[k][1];

                // Check if current coordinates match any pair in GeobonZOC
                if (GeobonZOC_Row_CurrY === geobonZOC_Row && GeobonZOC_Col_CurrX === geobonZOC_Col) {
                  console.log("checkifconditionnnnn")
                  DEM_ZOC_CS4.push([j, i]);
                  DEM_ZOC_CS4_ELEV.push(this.excelData[j][i]);
                  ELEV_DIFF.push(Math.abs(this.excelData[j][i] - INI_ELEV));
                  INI_DEM_DIST.push(Math.sqrt(
                    Math.pow(i - INIDEMROW, 2) +
                    Math.pow(j - INIDEMCOL, 2)
                  ) * Res_CS4);
                  console.log(DEM_ZOC_CS4_ELEV, DEM_ZOC_CS4, "checkDEM_ZOC_CS4_ELEV")
                  // Add (i, j) pair to DEM_ZOC_CS4
                }
              }
            }
          }

          //PHASE 4 
          //Perform slope finding analysis within DEM_ZOC_CS4
          // Calculate the slope
          const FINAL_SLOPE = ELEV_DIFF.map((element, index) => element / INI_DEM_DIST[index]);

          // Convert GeobonZOC and DEM_ZOC_CS4 arrays to strings
          const GeobonZOCString = JSON.stringify(GeobonZOC);
          const DEM_ZOC_CS4String = JSON.stringify(DEM_ZOC_CS4);
          const DEM_ZOC_CS4_ELEVString = JSON.stringify(DEM_ZOC_CS4_ELEV);
          const ELEV_DIFFString = JSON.stringify(ELEV_DIFF);
          const INI_DEM_DISTString = JSON.stringify(INI_DEM_DIST);
          const FINAL_SLOPEString = JSON.stringify(FINAL_SLOPE);
          const INI_ELEVString = JSON.stringify(INI_ELEV);
          const FIN_ELEVString = JSON.stringify(FIN_ELEV);

          // Append the console log information to the resultsString
          resultsString +=
            `GeobonZOC Array List\n` +
            `GeobonZOC: ${GeobonZOCString}\n` +
            `\n` +
            `User's Initial Row and Column\n` +
            `INIDEMROW: ${INIDEMROW}\n` +
            `INIDEMCOL: ${INIDEMCOL}\n` +
            `DEM_ZOC_CS4 array list\n` +
            `DEM_ZOC_CS4: ${DEM_ZOC_CS4String}\n` +
            `Distance between Initial Row Column and DEM_ZOC_CS4 array list  \n` +
            `INI_DEM_DIST: ${INI_DEM_DISTString}\n` +
            `\n` +
            `Initial Row Column Elevation Point\n` +
            `INI_ELEV: ${INI_ELEVString}\n` +
            `DEM_ZOC_CS4 Elevation points\n` +
            `DEM_ZOC_CS4_ELEV: ${DEM_ZOC_CS4_ELEVString}\n` +
            `Difference between Initial Row Column and DEM_ZOC_CS4 Elevations \n` +
            `ELEV_DIFF: ${ELEV_DIFFString}\n` +
            `\n` +
            `FINAL_SLOPE: ${FINAL_SLOPEString}\n` +
            `\n` +
            `Res_CS4: ${Res_CS4}\n` +
            `FIN_ELEV: ${FIN_ELEVString}\n` +
            `FINDEMROW: ${FINDEMROW}\n` +
            `FINDEMCOL: ${FINDEMCOL}\n` +
            `candIx_CS4: ${candIx_CS4}\n` +
            `candIy_CS4: ${candIy_CS4}\n` +
            `candFx_CS4: ${candFx_CS4}\n` +
            `candFy_CS4: ${candFy_CS4}\n` +
            `LLC_CS4x: ${LLC_CS4x}\n` +
            `LLC_CS4y: ${LLC_CS4y}\n`;

          // Write the resultsString to a text file
          const blob = new Blob([resultsString], { type: 'text/plain;charset=utf-8' });
          saveAs(blob, 'results.txt');
          console.log('Results saved to results.txt');

          let demZOC_i = -1;
          let min_difference = Infinity;
          for (let index = 0; index < FINAL_SLOPE.length; index++) {
            const FIN_USER_SLPT_DIFF = Math.abs(FINAL_SLOPE[index] - this.slopePercentage);
            min_difference = Math.min(min_difference, FIN_USER_SLPT_DIFF);
            demZOC_i = index;
          }
          console.log(min_difference, "checkdifferencebtwfinalanduserslopeafterloop")
          const LESS_THAN_TOLERANCEE = min_difference / this.slopePercentage;
          console.log(LESS_THAN_TOLERANCEE, min_difference, this.slopePercentage, "checkdifferencebtwfinalanduserslope")
          if (LESS_THAN_TOLERANCEE <= TOLERANCEE) {
            // Get the corresponding point (j, i) from DEM_ZOC_CS4
            const correspondingPoint = DEM_ZOC_CS4[demZOC_i];
            const j = correspondingPoint[0];
            const i = correspondingPoint[1];
            console.log(`The corresponding point in DEM_ZOC_CS4 array is [${j}, ${i}].`, demZOC_i);
            const TLRNC_currCS4x = LLC_CS4x + j * (Res_CS4 * m2f_factor);
            const TLRNC_currCS4y = LLC_CS4y + i * (Res_CS4 * m2f_factor);
            const TLRNC_transformed_currCS1 =
              this.basemapService.getTransformedCoordinates(
                [TLRNC_currCS4x, TLRNC_currCS4y],
                this.headerData.elevation,
                this.basemapService
                  .getCurrentBasemap()
                  .getView()
                  .getProjection()
              );
            var TLRNC_currCS1x = TLRNC_transformed_currCS1[0];
            var TLRNC_currCS1y = TLRNC_transformed_currCS1[1];
            const point = { x: TLRNC_currCS1x, y: TLRNC_currCS1y };
            console.log(TLRNC_currCS1x, TLRNC_currCS1y, "checkcurrcs1x,y")
            coordinatess.push(point);
          }

          // // Ask for user confirmation before downloading
          // if (window.confirm('Do you want to download the results as a text file?')) {
          //   // Write the resultsString to a text file
          //   const blob = new Blob([resultsString], { type: 'text/plain;charset=utf-8' });
          //   saveAs(blob, 'results.txt');
          //   console.log('Results saved to results.txt');
          // } else {
          //   console.log('Download canceled by user.');
          // }

          // Draw lines from the captured coordinate point to all coordinates in the coordinatess array
          const lineFeatures = [];
          const capturedPoint = new Point([candIx_CS1, candIy_CS1]);
          coordinatess.forEach((coord) => {
            const coordPoint = new Point([coord.x, coord.y]);
            const line = new LineString([
              capturedPoint.getCoordinates(),
              coordPoint.getCoordinates(),
            ]);
            const feature = new Feature(line);
            lineFeatures.push(feature);
          });
          const lineVectorSource = new VectorSource({
            features: lineFeatures,
          });
          const lineVectorLayer = new VectorLayer({
            source: lineVectorSource,
            style: new Style({
              stroke: new Stroke({
                color: 'red',
                width: 2,
              }),
            }),
          });
          this.basemap.addLayer(lineVectorLayer);
          // }, 500);
          candIx_CS1 = TLRNC_currCS1x;
          candIy_CS1 = TLRNC_currCS1y;
        }
      }
      // }
      // }
    });
  }

  async downloadExcel() {
    await this.excelService.getExcelData();
    await this.readExcelData();
  }
  private _getAlertMessage(
    alertComponent,
    msg: string = 'You have chosen upward slope direction..!!'
  ): any {
    const alertMessage = msg;
    alertComponent.setAlertMessage(alertMessage);
  }

  private _closeAlertMessage(alertComponent): any {
    alertComponent.closeAlert();
  }
}
