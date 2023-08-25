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
import { MatrixPathService } from './matrix-path.service';
import { MatrixReverseService } from './matrix-reverse.service';

@Component({
  selector: 'app-slope-finder',
  templateUrl: './slope-finder.component.html',
  styleUrls: ['./slope-finder.component.scss'],
})
export class SlopeFinderComponent implements OnChanges {
  slopePercentage: number;
  @Input() angle: number;
  @Input() slopeRatio: string;
  @Input() onslopeClicked;
  @Output() Slopevalue: EventEmitter<any> = new EventEmitter<any>();
  @Output() Angle: EventEmitter<any> = new EventEmitter<any>();
  @Output() Ratio: EventEmitter<any> = new EventEmitter<any>();

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
  LLC_X: any;
  LLC_Y: any;
  cellSize: any;
  cellsizeft: any;
  rowcount: any;
  colcount: any;
  markedLocationCoOrds: Array<string> = [];
  showCoOrdsCopiedMsg: boolean;
  public EntSlopeValue: any;

  static bsmapservice: any;
  static excelData: any;
  drawInteraction: OlMap;
  //pctslope: number;
  constructor(
    private http: HttpClient,
    private excelService: ExcelService,
    private commonService: CommonService,
    private basemapService: BasemapService,
    private renderer2: RendererFactory2,
    private myService: MyService,
    private matrixpath: MatrixPathService,
    private matrixreverse: MatrixReverseService
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
  ngOnChanges(changes: SimpleChanges) {
    if(this.onslopeClicked){
      console.log("MSG: onslope and onAEDSClicked ",this.onslopeClicked)
      this.slopefindertool();
    }
    if(!this.onslopeClicked){
      console.log("MSG: onslope and onAEDSClickedd ",!this.onslopeClicked)
      this.removeDrawInteraction(); // Remove the draw interaction
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
    console.log(ratioCandidates[0].ratio, 'checkingggnewratio');
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
    this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    // Extract parameter values from header
    // const LLC_X = worksheet['C4'].v;
    // const LLC_Y = worksheet['C5'].v;
    // const cellSize = worksheet['C3'].v;
    // const cellsizeft = worksheet['B3'].v;
    // const rowcount = worksheet['B1'].v;
    // const colcount = worksheet['B2'].v;
    // console.log("LLC_X:",LLC_X,"LLC_Y:",LLC_Y,"cellsize:",cellSize,"cellsizeinft:",cellsizeft,)
    // this.slopefindertool(
    //   LLC_X,
    //   LLC_Y,
    //   cellSize,
    //   cellsizeft,
    //   rowcount,
    //   colcount
    // );
  }
  ///////////////////***SLOPEFINDER TOOL *////////////////////////////
  async slopefindertool(// LLC_X,LLC_Y, cellSize, cellsizeft, rowcount, colcount
  ) {
    
    if (this.slopePercentage == null) {
      return;
    }
    // Load Excel data into cache
    await this.readExcelData();
    var slopeDecimal = this.slopePercentage;
    console.log(slopeDecimal, 'checkslopeenteredvalue');
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
    this.drawInteraction = new Draw({
      source: vectorLayer.getSource(),
      type: 'Point',
    });

    // Add the draw interaction to the map
    this.basemap.addInteraction(this.drawInteraction);

    let coordinates = [];

    // Create an array to store the coordinates of the drawn line
    this.drawInteraction.on('drawend', async (event) => {
      // Get the coordinates of the drawn line
      coordinates = event.feature.getGeometry().getCoordinates();
      // var capturedcords = coordinates.
      console.log(coordinates, 'checkcoords');
      // Check if the Excel data is already cached
      const xDiff = Math.abs(coordinates[1][0]) - Math.abs(coordinates[0][0]);
      const yDiff = Math.abs(coordinates[1][1]) - Math.abs(coordinates[0][1]);
      const NDir = (Math.atan(xDiff / yDiff) * 180) / Math.PI;
      console.log(NDir, 'checkslopeintan');

      if (!this.excelData) {
        // Wait for the Excel data to be fetched and cached
        await this.readExcelData();
        console.log(this.excelData, 'checkexceldata');
      } else {
        // Access the Excel data

        setTimeout(() => {
          //Access the Excel data
          const LLC_X = -121.876446;
          const LLC_Y = 37.498947;
          const cellSize = 0.001;
          const cellsizeft = 328.0839;
          const rowcount = 140;
          const colcount = 101;
          const capturedX = coordinates[0].toFixed(6);
          const capturedY = coordinates[1].toFixed(6);
          var pctslope = this.slopePercentage;
          console.log(pctslope, 'checkpctslope');
          const row = Math.floor((capturedY - LLC_Y) / cellSize);
          const caprow = rowcount - row + 1;
          const col = Math.floor((capturedX - LLC_X) / cellSize);
          const capcol = col + 1;
          const capturedCellValue = this.excelData[caprow][capcol];
          console.log(
            'CAPXY:',
            capturedX,
            capturedY,
            'CAPRC:',
            row,
            col,
            'adj',
            caprow,
            capcol,
            'CAP_ELEV:',
            capturedCellValue,
            'CAP_DWNSLP VALUE:'
          );
          let minDistance = 200;
          let nearestRow = null;
          let nearestCol = null;
          let nearestValue = null;
          const epsilon = 1;
          const pctepsilon = 0.005;
          let coordinatess = [];
          // // Loop through all cells in the Excel data to find the nearest cell with a value equal to or less than the captured value
          //neighbourhood looping for slope finding//
          const band = 5;
          const Rarray = [];
          const Carray = [];

          //**************Previous For Loop for finding the Nearest values//****************/*/
          // for (let R = caprow - band; R <= caprow + band; R++) {
          //   for (let C = capcol - band; C <= capcol + band; C++) {
          //     const candN_elevation = this.excelData[R][C];
          //     const Denom_distance =
          //       Math.sqrt((capcol - C) ** 2 + (caprow - R) ** 2) * cellsizeft;
          //     const compelv =
          //       (capturedCellValue - candN_elevation) / Denom_distance;
          //     console.log(
          //       caprow,
          //       capcol,
          //       band,
          //       R,
          //       C,
          //       Denom_distance,
          //       'CAPNEIGHBHOURS'
          //     );
          //     if (compelv > 0 && Math.abs(compelv - pctslope) <= pctepsilon) {
          //       console.log(capturedCellValue,candN_elevation,compelv,R,C,caprow,capcol,band,Denom_distance,
          //         'CAPFINALNEIGHBOUR'
          //       );
          //       Rarray.push(R);
          //       Carray.push(C);
          //       console.log(Rarray[0], Carray[0], 'CHECKARRAYRC');
          //       const x = LLC_X + (Carray[0] + 1) * cellSize;
          //       const y = LLC_Y + (rowcount - Rarray[0] + 1) * cellSize;
          //       const point = { x: x, y: y };
          //       coordinatess.push(point);
          //       const RC = { R, C, Denom_distance };

          //     }
          //   }
          // }

          // const path = this.matrixpath.path;
          const path = this.matrixreverse.path;
          //const path = this.generateSpiralPath(10);//Here 10 is the size of the matrix
          console.log(path, 'checkspiralpath');
          for (const [pathRow, pathCol] of path) {
            const R = caprow + pathRow;
            const C = capcol + pathCol;
            // Check if the current R and column are within bounds of the array
            if (
              R >= 0 &&
              R < this.excelData.length &&
              C >= 0 &&
              C < this.excelData[R].length
            ) {
              const candN_elevation = this.excelData[R][C];
              const Denom_distance =
                Math.sqrt((capcol - C) ** 2 + (caprow - R) ** 2) * cellsizeft;
              const compelv =
                (capturedCellValue - candN_elevation) / Denom_distance;
              console.log(
                caprow,
                capcol,
                band,
                R,
                C,
                Denom_distance,
                'CAPNEIGHBHOURS'
              );

              if (compelv > 0 && Math.abs(compelv - pctslope) <= pctepsilon) {
                console.log(
                  capturedCellValue,
                  candN_elevation,
                  compelv,
                  R,
                  C,
                  caprow,
                  capcol,
                  Denom_distance,
                  pctslope,
                  'CAPFINALNEIGHBOUR'
                );
                Rarray.push(R);
                Carray.push(C);
                console.log(Rarray[0], Carray[0], 'CHECKARRAYRC');
                const x = LLC_X + (Carray[0] + 1) * cellSize;
                const y = LLC_Y + (rowcount - Rarray[0] + 1) * cellSize;
                const point = { x: x, y: y };
                coordinatess.push(point);
                //const RC = { R, C, Denom_distance };
              }
            }
          }

          console.log(coordinatess, 'allxycoordinates');
          console.log(
            nearestRow,
            nearestCol,
            nearestValue,
            minDistance,
            'checknearest'
          );

          // Draw lines from the captured coordinate point to all coordinates in the coordinatess array
          const lineFeatures = [];
          const capturedPoint = new Point([capturedX, capturedY]);
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
        }, 500);
      }
    });


    // Add event listener for Escape key press to remove the drawn line
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.basemap.removeInteraction(this.drawInteraction);
        this.drawInteraction = null;

        this.basemap.getLayers().forEach((layer) => {
          if (
            layer instanceof VectorLayer &&
            layer.getSource() instanceof VectorSource
          ) {
            this.basemap.removeLayer(layer);
          }
        });
      }
    });
  }
  async downloadExcel() {
    await this.excelService.getExcelData();
    await this.readExcelData();
  }
  generateSpiralPath(size) {
    if (size <= 0) {
      return [];
    }

    let path = [];
    let direction = 0;
    let x = 0;
    let y = 0;

    for (let i = 0; i < size * size; i++) {
      path.push([x, y]);

      if (direction === 0) {
        if (x === y + 1) direction = 1;
      } else if (direction === 1) {
        if (x === y && x >= 0) direction = 2;
      } else if (direction === 2) {
        if (x === y - 1) direction = 3;
      } else if (direction === 3) {
        if (x === y && x <= 0) direction = 0;
      }

      if (direction === 0) y++;
      else if (direction === 1) x--;
      else if (direction === 2) y--;
      else if (direction === 3) x++;
    }

    return path;
  }
  removeDrawInteraction() {
    if (this.drawInteraction && this.basemap) {
      this.basemap.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
  }
}
