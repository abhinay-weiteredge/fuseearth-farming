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
import { DrawEvent } from 'ol/interaction/Draw';

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
  fileData: string;
  DEM: { [key: string]: any } = {}; // Declare DEM at the class level
  Geobon: { [key: string]: any } = {}; //
  Results: { [key: string]: string } = {}; // 
  elevationData: number[][] = [];
  markedLocationCoOrds: Array<string> = [];
  showCoOrdsCopiedMsg: boolean;
  public EntSlopeValue: any;
  static bsmapservice: any;
  static excelData: any;
  pctslope: any;
  showError: boolean = false;
  count = 0;
  exitloop = 0;
  fincompcount = 0;
  closeEnough = 0;
  pointFound = -1;
  loopcounter = 0;
  CS1: string;
  // CS1 = this.basemapService.getCurrentBasemap().getView().getProjection();
  CS4: string;
  authority: string;
  upSlopePCTtolerance = 0.01;
  dnSlopePCTtolerance = 0.25; 
  searchableSwath = [0.5, 1.0, 1.5];
  maxLoops = 10;
  SUI: { [key: string]: any} = {};
  stopTheRun: number;
  upSlopeInd: number;
  LineSegment: any;
  unitStd_multiplier4V = 0.30480060960122;
  upSlope: number;
  GeobonZOC_Length: any;
  valuesCompiled = false;
  resultsString = '';

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
	});
}
baseService: BasemapService;
  
ngOnInit(): void {
	const fileUrl = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Fvermontch_utm18n.frf?alt=media&token=887f80d3-808f-4cb8-ba3d-6c3d8fff4fc3';
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
		error => {console.error('Error fetching file data:', error);}
	);
}
  
private parseData(data: string): void {
	// The parsing code from my previous response
	// Extract DEM and elevationData from the parsed result
	// Parse the text data
	const lines = this.fileData.trim().split('\n');
	let isHeader = false;
	let DEM: { [key: string]: string } = {};
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
			DEM[key] = value;
		} else if (!isHeader && line.trim() !== '') {
			const elevationRow = line.split(' ').map(Number);
			elevationData.push(elevationRow);
		}
	}
	// Extracted variables
	this.DEM.hrefsys = DEM.hrefsys;
	this.DEM.vrefsys = DEM.vrefsys;
	this.DEM.authority = DEM.authority;
	this.DEM.Resolution = DEM.cellsize;
	this.DEM.LLC_ASCIIx = DEM.llcx;
	this.DEM.LLC_ASCIIy  = DEM.llcy;
	this.DEM.RCOUNT_ASCII = DEM.rows;
	this.DEM.CCOUNT_ASCII  = DEM.cols;
	this.DEM.CS4 = `${this.DEM.authority.trim()}:${this.DEM.hrefsys.trim()}`;
	this.DEM.CS1 = this.basemapService.getCurrentBasemap().getView().getProjection();
	this.DEM.hunits = DEM.hunits;
	this.DEM.vunits = DEM.vunits;
	this.resultsString += `DEM: ${this.DEM}\n`;
	// Save parsed elevation data into array called elevationData
	this.elevationData = elevationData;

	//below are derived variables, not direct inputs from FRF 
	
	//unitStd_multiplier4V = multiplication factor for Vertical to standardize units across
// 	if(this.DEM.hunits === 'meters' && this.DEM.vunits === 'feet'){
// 		this.unitStd_multiplier4V = 0.30480060960122;
// 		}
// 	if(this.DEM.hunits === 'feet' && this.DEM.vunits === 'meters'){
// 		this.unitStd_multiplier4V = 1/0.30480060960122;
// 	}
// 	if(this.DEM.hunits === this.DEM.vunits ){
// 		this.unitStd_multiplier4V = 1;
// 	}
  console.log("MSG: Print unitStd_multiplier4V value ",this.unitStd_multiplier4V)
	this.DEM.TRC_ASCIIx = (parseFloat(this.DEM.LLC_ASCIIx) + (parseFloat(this.DEM.CCOUNT_ASCII) + 1) * parseFloat(this.DEM.Resolution)).toString();
	this.DEM.TRC_ASCIIy = (parseFloat(this.DEM.LLC_ASCIIy) + (parseFloat(this.DEM.RCOUNT_ASCII) + 1) * parseFloat(this.DEM.Resolution)).toString();
	

	//Transform LLC_ASCII from User Provided System (CS3) into CS4 and store result as LLC_CS4. Currently CS3 is suspended.
	//  this.DEM.LLC_CS4 = this.basemapService.getTransformedCoordinates([this.DEM.LLC_ASCIIx, this.DEM.LLC_ASCIIy],this.DEM.CS4, this.DEM.CS4); 
	this.DEM.LLC_CS4x = this.DEM.LLC_ASCIIx;
	this.DEM.LLC_CS4y = this.DEM.LLC_ASCIIy;
 	 
	//Transform TRC_ASCII into CS4 and store result as TRC_CS4
	//  this.DEM.TRC_CS4 = this.basemapService.getTransformedCoordinates([this.DEM.TRC_ASCIIx, this.DEM.TRC_ASCIIy],this.DEM.CS4,this.DEM.CS4);
	this.DEM.TRC_CS4x = this.DEM.TRC_ASCIIx;
	this.DEM.TRC_CS4y = this.DEM.TRC_ASCIIy;

	this.DEM.Res_CS4 = ((parseFloat(this.DEM.TRC_CS4y) - parseFloat(this.DEM.LLC_CS4y)) /parseFloat(this.DEM.RCOUNT_ASCII + 1));
	//this can be a gross approximation, need to fix this in the future based on what coordinate system CS4 would be.

	//VINEET: Please put checks on every variable and after every variable is read in accurately, set a "go-AEDS" to 1. else make it 0.
}

//This routine captures changes in user information like from the parameter bar.
ngOnChanges(changes: SimpleChanges) {
  if(this.onAEDSClicked){
    this.captureSlopeDir();
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
	this.Slopevalue.emit(this.slopePercentage);
	this.angle = (Math.atan(slopeDecimal) * 180) / Math.PI;
	this.angle = Number(this.angle.toFixed(2)); // round to 2 digits after decimal
	if (
		Number.isInteger(slopeDecimal) &&
		slopeDecimal >= 0 &&
		slopeDecimal <= 100
	) {
		// Compute getRatio
		const slopeRatio = this.getRatio(slopeDecimal);
		const gcd = this.getGcd(slopeDecimal, 100);
		this.slopeRatio = `${slopeDecimal / gcd}:${100 / gcd}`;
	} else if (slopeDecimal >= 0 && slopeDecimal <= 100) {
		// Handle decimals
		this.slopeRatio = this.calculateRatioFromSlopePercentage(slopeDecimal);
	} else {
		// Handle input outside the range [0, 100]
		const slopeRatio = this.getRatio(slopeDecimal);
		const gcd = this.getGcd(slopeDecimal, 100);
		this.slopeRatio = `${slopeDecimal / gcd}:${100 / gcd}`;
	}
}

calculateSlopeAndRatioFromAngle() {
	const angleRad = (this.angle * Math.PI) / 180;
	const slope = Math.tan(angleRad) * 100;
	const slopeDecimal = slope / 100;
	this.slopePercentage = Number(slopeDecimal.toFixed(2)); // round to 2 digits after decimal
	this.Slopevalue.emit(this.slopePercentage);
	if (
		Number.isInteger(this.slopePercentage) &&
		this.slopePercentage >= 0 &&
		this.slopePercentage <= 100
	) {
		// Compute getRatio
		const slopeRatio = this.getRatio(this.slopePercentage);
		const gcd = this.getGcd(this.slopePercentage, 100);
		this.slopeRatio = `${this.slopePercentage / gcd}:${100 / gcd}`;
	} else if (this.slopePercentage >= 0 && this.slopePercentage <= 100) {
		// Handle decimals
		this.slopeRatio = this.calculateRatioFromSlopePercentage(
		  this.slopePercentage
		);
	} else {
		// Handle input outside the range [0, 100]
		const slopeRatio = this.getRatio(this.slopePercentage);
		const gcd = this.getGcd(this.slopePercentage, 100);
		this.slopeRatio = `${this.slopePercentage / gcd}:${100 / gcd}`;
	}
}
  
calculateSlopeAndAngleFromRatio() {
	const ratioArr = this.slopeRatio.split(':');
	const ratioDecimal = Number(ratioArr[0]) / Number(ratioArr[1]);
	const slope = ratioDecimal * 100;
	const angle = (Math.atan(slope) * 180) / Math.PI;
	this.slopePercentage = slope;
	this.slopePercentage = Number(slope.toFixed(2)); // round to 2 digits after decimal
	this.Slopevalue.emit(this.slopePercentage);
	this.angle = angle;
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
  
captureSlopeDir() {
	//Create a new vector layer for the line and vertices
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

	// Create an array to store the coordinates of the drawn line
	draw.on('drawend', async (event) => {
		this.SUI.ILV_CS1 = event.feature.getGeometry().getCoordinates();
		console.log("MSG: User Line (ILV) geometry captured from screen!")
		this.SUIvaluesinCS4();
		//this is the start of the slope finding algorithm.
		if (this.upSlopeInd ===1) {
			this.resultsString += `User chose an upslope direction, not running the tool for upslope delineation\n`;
		} else {
			this.slopefindertool();
		}
	});
}

SUIvaluesinCS4() {
	//computer all Initial User Line vertices and parameters in CS4
	console.log("MSG: Entered SUIvaluesinCS4, computing ILV parameters needed for the run")
		 
	if (this.loopcounter === 0) {
		console.log("MSG: Entered into SUIvaluesinCS4 function loopcounter")
		this.SUI.ILV_I_CS4 = this.basemapService.getTransformedCoordinates([this.SUI.ILV_CS1[0][0], this.SUI.ILV_CS1[0][1]],this.DEM.CS1, this.DEM.CS4); 
		this.SUI.ILVIx_CS4 = this.SUI.ILV_I_CS4[0];
		this.SUI.ILVIy_CS4 = this.SUI.ILV_I_CS4[1];
		console.log("MSG: Transformed SUIvaluesinCS4 values are",this.SUI.ILVIx_CS4,this.SUI.ILVIy_CS4)
	
		//Transform Final User Line vertices into CS4
		this.SUI.ILV_F_CS4 = this.basemapService.getTransformedCoordinates([this.SUI.ILV_CS1[1][0], this.SUI.ILV_CS1[1][1]],this.DEM.CS1, this.DEM.CS4); 
		this.SUI.ILVFx_CS4 = this.SUI.ILV_F_CS4[0];
		this.SUI.ILVFy_CS4 = this.SUI.ILV_F_CS4[1];
	} 

	this.SUI.ILV_CS4 = [[this.SUI.ILVIx_CS4,this.SUI.ILVIy_CS4],[this.SUI.ILVFx_CS4,this.SUI.ILVFy_CS4]];
	this.SUI.DEM_I_col = Math.floor((this.SUI.ILVIx_CS4 - this.DEM.LLC_CS4x) / (this.DEM.Res_CS4));
	this.SUI.DEM_I_row = this.DEM.RCOUNT_ASCII - Math.floor((this.SUI.ILVIy_CS4 - this.DEM.LLC_CS4y) / (this.DEM.Res_CS4));
	this.SUI.DEM_F_col = Math.floor((this.SUI.ILVFx_CS4 - this.DEM.LLC_CS4x) / (this.DEM.Res_CS4));
	this.SUI.DEM_F_row = this.DEM.RCOUNT_ASCII - Math.floor((this.SUI.ILVFy_CS4 - this.DEM.LLC_CS4y) / (this.DEM.Res_CS4));
	this.SUI.ILV_DEM = [[this.SUI.DEM_I_col],[this.SUI.DEM_I_row],[this.SUI.DEM_F_col],[this.SUI.DEM_F_row]];
	this.SUI.IElev = this.elevationData[this.SUI.DEM_I_row - 1][this.SUI.DEM_I_col - 1];
	this.SUI.FElev = this.elevationData[this.SUI.DEM_F_row - 1][this.SUI.DEM_F_col - 1];
	this.upSlopeInd = this.checkInclineDir(this.SUI.DEM_I_col,this.SUI.DEM_I_row,this.SUI.DEM_F_col,this.SUI.DEM_F_row,this.SUI.IElev,this.SUI.FElev,this.upSlopePCTtolerance)
	
	this.resultsString +=
		`User Line Vertices Lat, Long: ${this.SUI.ILV_CS1}\n`+
		`User Line Vertices Eastings, Northings: ${this.SUI.ILV_CS4}\n`+
		`User Line Vertices DEM Rows, Cols: ${this.SUI.ILV_DEM}\n`+
		`User Line Vertices elevation values, initial:  ${this.SUI.IElev}+ final: ${this.SUI.FElev}\n`+
		`User Line Vertices Rows, Cols: ${this.SUI.ILV_DEM}\n`+
		`User Line slope: ${this.SUI.ILV_Slope}\n`+
		`User Line length: ${this.SUI.ILV_Distance}\n`+
		`Upslope Indicator Check: ${this.upSlopeInd}\n`+
		`Percent Slope Tolerance used for upslope determination: ${this.upSlopePCTtolerance}\n`;
	console.log("MSG: Leaving SUIvaluesinCS4, done computing ILV parameters needed for the run")
}

checkInclineDir(Icol,Irow,Fcol,Frow,Ielev,Felev,tol) {
	console.log("MSG: Entered checkInclineDir, checking slope incline direction")
	this.SUI.ILV_Distance = (Math.sqrt(Math.pow(Frow-Irow, 2) + Math.pow(Fcol-Icol, 2)) * parseFloat(this.DEM.Res_CS4));
	this.SUI.ILV_Slope = ((Felev-Ielev)* this.unitStd_multiplier4V)/this.SUI.ILV_Distance;
	console.log("MSG: Leaving checkInclineDir, finished checking slope incline direction")
	if (this.SUI.ILV_Slope > tol) return 1;
	if (this.SUI.ILV_Slope >= tol) return 0;
}

slopefindertool() {
	console.log("MSG: Entered slopefindertool, starting delineating the downward slope path")
	
 	this.pointFound = -1;//-1 for suitable point for desired slope not found yet; 0 or more (slope array index) for suitable point for desired slope found, quit!
	this.loopcounter = 0;//count for while loops
	this.stopTheRun = 0;//0 if search is still on, 1 if search is closed
	this.upSlopeInd = 0; //0 for downslope, 1 for upslope
	this.closeEnough = 0; //1 if AEDS finish point distance is close enough (in the same 'DEM-cell' as the user final point). 0 if there is more AEDS work to do. 
	this.LineSegment = [];
	this.LineSegment = this.SUI.ILV_CS4;
	console.log("MSG: In slopefindertool, finished resetting all checks and variables!")
	
	while (this.stopTheRun === 0) {
		this.geobonParams(this.LineSegment);			
		let t = 0;
		while (this.pointFound <= -1) {
			if (t < this.searchableSwath.length) {
				console.log("MSG: In slopefindertool, starting to build GeobonZOC, DEMZOC and other parameters")
				this.buildGeobonZOC(this.Geobon.CANDFr_LTOP, this.Geobon.CANDFc_LTOP, this.searchableSwath[t]);
			} else {
				this.stopTheRun = 1;
				console.log("MSG: In slopefindertool, desired downward slope not found along this direction, please select a different value for slope or chose another direction")
				break;
			}
			
			if (this.GeobonZOC_Length > 0) {
				this.buildDEMZOC(this.SUI.DEM_I_row,this.SUI.DEM_I_col,this.SUI.DEM_F_row,this.SUI.DEM_F_col,this.GeobonZOC_Length);
			} else {
				this.stopTheRun = 1;
				console.log("MSG: In slopefindertool,GeobonZOC_Length is Null or 0, DEMZOC and other parameters won't be built. Quitting!")
				break;
			}
			console.log("MSG:this.Geobon.DEM_ZOC_Indexes ",this.Geobon.DEM_ZOC_Indexes,this.Geobon.DEM_ZOC_Indexes.length)
			if (this.Geobon.DEM_ZOC_Indexes.length > 0) {
				this.Geobon.FINAL_SLOPE = this.Geobon.DEM_ZOC_ElevDiffs.map((element, index) => element / this.Geobon.DEM_ZOC_CandDistances[index]);
				console.log("MSG:this.Geobon.FINAL_SLOPE",this.Geobon.FINAL_SLOPE)
        this.pointFound = this.findPoint();
			} else {
				this.stopTheRun = 1;
				console.log("MSG: In slopefindertool, DEMZOC_Length is Null or 0, downward slope cannot be delineated.  Quitting!")
				break;
			}
      console.log("MSG: In slopefindertool, downward slope point not found @ ", this.searchableSwath[t],"! increasing the swath for further search");
      t++;
		}
    if(this.pointFound >= 0) {
      console.log("MSG: In slopefindertool, found the ", this.loopcounter, "downward slope point! and the index in DemZOC is ", this.pointFound);
      this.LineSegment[0][0] = this.SUI.ILV_CS1[0][0];
      this.LineSegment[0][1] = this.SUI.ILV_CS1[0][1];
      this.closeEnough = this.distanceCheck();
	  console.log("MSG: Closeenough value",this.SUI.ILVIx_CS4, this.SUI.ILVIy_CS4)
      const IntermStepCS1 = this.basemapService.getTransformedCoordinates([this.SUI.ILVIx_CS4, this.SUI.ILVIy_CS4], this.DEM.CS4, this.DEM.CS1);
	  console.log("MSG: Closeenough value after Closeenough ",IntermStepCS1)
	  this.LineSegment[1][0] = IntermStepCS1[0];
      this.LineSegment[1][1] = IntermStepCS1[1];
	  console.log("MSG: Linesegment values",this.LineSegment)
      this.drawTheRed(this.LineSegment);
    } 
		if (this.closeEnough === 1) {
			this.stopTheRun = 1;
			console.log("MSG: Leaving slopefindertool, finished finding the next", this.loopcounter, "th downward slope point finding");
      		break;
		} else {
			this.SUIvaluesinCS4();
			//this is the repeat of the slope finding algorithm.
			if (this.upSlopeInd ===1) {
				console.log("Hit upslope, quitting the search. Please choose a new direction to search");
				this.stopTheRun = 1;
				break;
			} else {
				this.pointFound = -1;
				this.loopcounter = 0;
				this.stopTheRun = 0;
				this.upSlopeInd = 0;
				this.closeEnough = 0;
				this.LineSegment = [];
				this.LineSegment = this.SUI.ILV_CS4;
				this.loopcounter++;
				console.log("MSG: In slopefindertool, looping again (", this.loopcounter, "), finished resetting all checks and variables again!")
			}
		}		
		if (this.loopcounter > this.maxLoops) {
			console.log("Hit maxmimum loops, quitting the search. Please choose a new direction to search");
			this.stopTheRun = 1;
			break;
		}
	}
}
	 
geobonParams(LSV) {
	console.log("MSG: Entered geobonParams, computing geobon parameters for the current line segment")
	this.Geobon.GeoPS = 5;
	this.Geobon.candist4 = Math.sqrt(Math.pow(LSV[0][0] - LSV[0][1], 2) + Math.pow(LSV[1][0] - LSV[1][1], 2));
	this.Geobon.GeobonRes = this.Geobon.candist4 / this.Geobon.GeoPS;
	this.Geobon.CANDIr_LTOP = 0;
	this.Geobon.CANDIc_LTOP = 0;
	this.Geobon.CANDFc_LTOP = Math.floor((LSV[0][0] - LSV[0][1]) / this.Geobon.GeobonRes);
	this.Geobon.CANDFr_LTOP = Math.floor((LSV[1][0] - LSV[1][1]) / this.Geobon.GeobonRes);
	console.log("MSG: Leaving geobonParams, finished computing geobon parameters")
}
	
buildGeobonZOC(CANDFr_LTOP, CANDFc_LTOP, thresh) {
	console.log("MSG: Entered buildGeobonZOC, developing the GeobonZOC parameters")
	const path = this.matrixpath.path;
	this.Geobon.GeobonZOC = [];
	for (const [pathRow, pathCol] of path) {
		var D2D = Math.sqrt(Math.pow(CANDFr_LTOP - pathRow, 2) + Math.pow(CANDFc_LTOP - pathCol, 2));
		const D2O = Math.sqrt(Math.pow(pathRow, 2) + Math.pow(pathCol, 2));
		var InitialDist = Math.sqrt(Math.pow(CANDFr_LTOP, 2) + Math.pow(CANDFc_LTOP, 2));
		var TotalDist = D2D + D2O;
		var diff = TotalDist - InitialDist;
		if (diff < thresh) {
			this.Geobon.GeobonZOC.push([pathRow, pathCol]);
		}
	}
	this.GeobonZOC_Length = this.Geobon.GeobonZOC.length;
	console.log("MSG: Leaving buildGeobonZOC, finished developing the GeobonZOC parameters")
}

buildDEMZOC(Irow,Icol,Frow,Fcol,GZL) {

	console.log("MSG: Entered buildDEMZOC, building DEMZOC for the GeobonZOC with ",GZL, "elements");
		
	this.Geobon.DEM_ZOC_Indexes =[];
	this.Geobon.DEM_ZOC_Eelevations = [];
	this.Geobon.DEM_ZOC_ElevDiffs = [];
	this.Geobon.DEM_ZOC_CandDistances = [];

	const tIrow = Irow < Frow ? Irow : Frow;  
	const tIcol = Icol < Fcol ? Icol : Fcol;
	const tFrow = Frow > Irow ? Frow : Irow;
	const tFcol = Fcol > Icol ? Fcol : Icol;
	
	console.log("MSG: In buildDEMZOC, running loop to building DEMZOC between rows ", tIrow, " to ", tFrow, " and columns ", tIcol, " to ", tFcol)
	for (let i = tIrow; i <= tFrow; i++) {
		for (let j = tIcol; j <= tFcol; j++) {
			// console.log("MSG: In buildDEMZOC, running loop i =", i, "j=", j);
			// Compute current x and y values
			const currCS4x = parseFloat(this.DEM.LLC_CS4x) + j * parseFloat(this.DEM.Res_CS4);
			const currCS4y = parseFloat(this.DEM.LLC_CS4y) + i * parseFloat(this.DEM.Res_CS4);
			
			// Compute GeobonZOC indexes for current x and y values
			const GeobonZOC_CurrCol = Math.floor((currCS4x - this.SUI.ILVIx_CS4) / this.Geobon.GeobonRes);
			const GeobonZOC_CurrRow = Math.floor((currCS4y - this.SUI.ILVIy_CS4) / this.Geobon.GeobonRes);
	
			// Loop through GeobonZOC 2D array
			// console.log("MSG: In buildDEMZOC, running loop i =", i, "j=", j, "starting the check against ", GZL, "indexes in GeobonZOC");
			for (let k = 0; k < GZL; k++) {
				console.log("MSG: In buildDEMZOC, running loop i =", i, "j=", j, "and checking against the ", k, "th index in GeobonZOC");
				const geobonZOC_Row = this.Geobon.GeobonZOC[k][0];
				const geobonZOC_Col = this.Geobon.GeobonZOC[k][1];
				// console.log("MSG: In buildDEMZOC, checking i, j, k",i,j,k);
				// Check if current coordinates match any pair in GeobonZOC
				if (GeobonZOC_CurrRow == geobonZOC_Row && GeobonZOC_CurrCol == geobonZOC_Col) {
					console.log("MSG: In buildDEMZOC, found matching row and column of DEM " , i, j, "against the GeobonZOC index", k);
					this.Geobon.DEM_ZOC_Indexes.push([i, j]);
					// Add (i, j) pair to DEM_ZOC_CS4
					// this.Geobon.DEM_ZOC_ElevDiffs.push(Math.abs(this.elevationData[i - 1][j - 1] - (this.SUI.IElev)) * this.unitStd_multiplier4V);
					// this.Geobon.DEM_ZOC_CandDistances.push(Math.sqrt(Math.pow(i - Irow, 2) + Math.pow(j - Icol, 2)) * this.DEM.Res_CS4);
				} 
			}
		}
	}
	console.log ("MSG: Exit out of the DemZOC function after building it")
//   console.log ("MSG: In buildDEMZoc, test priting this.Geobon.DEM_ZOC_Indexes", this.Geobon.DEM_ZOC_Indexes,this.Geobon.DEM_ZOC_Indexes.length);
	for(let m = 0; m < this.Geobon.DEM_ZOC_Indexes.length; m++) {
	  	let i = this.Geobon.DEM_ZOC_Indexes[m][0];
	  	let j = this.Geobon.DEM_ZOC_Indexes[m][1];
    	console.log ("MSG: In buildDEMZoc, test priting this.Geobon.DEM_ZOC_Indexes for loop m ",m);
		this.Geobon.DEM_ZOC_Eelevations.push(this.elevationData[i - 1][j - 1]);
		this.Geobon.DEM_ZOC_ElevDiffs.push(Math.abs(this.elevationData[i - 1][j - 1] - (this.SUI.IElev)) * this.unitStd_multiplier4V);
		this.Geobon.DEM_ZOC_CandDistances.push(Math.sqrt(Math.pow(i - Irow, 2) + Math.pow(j - Icol, 2)) * parseFloat(this.DEM.Res_CS4));
	}
	console.log("MSG: Check Elevatin differences and Cand =Distances",this.Geobon.DEM_ZOC_ElevDiffs,this.Geobon.DEM_ZOC_CandDistances)
}
	
findPoint() {
	let min_difference = Infinity;
  let demZOC_i = -1;
	for (let index = 0; index < this.Geobon.FINAL_SLOPE.length; index++) {
		const FIN_USER_SLPT_DIFF = Math.abs(this.Geobon.FINAL_SLOPE[index] - this.slopePercentage);
		min_difference = Math.min(min_difference, FIN_USER_SLPT_DIFF);
		const PCT_Error = min_difference / this.slopePercentage;
		if (PCT_Error <= this.dnSlopePCTtolerance) {
      demZOC_i = index;
			return demZOC_i;
		} else{
			return demZOC_i;
		}
	}
}
	
distanceCheck() {	
	console.log("MSG: Entered distanceCheck, computing distance checks and conversions for the current slope line segment")
	const IntermStep = this.Geobon.DEM_ZOC_Indexes[this.pointFound];
	
	this.SUI.ILVIx_CS4 = parseFloat(this.DEM.LLC_CS4x) + IntermStep[1] * (this.DEM.Res_CS4);
	this.SUI.ILVIy_CS4 = parseFloat(this.DEM.LLC_CS4y) + IntermStep[0] * (this.DEM.Res_CS4);
	this.SUI.ILV_I_CS4 = [this.SUI.ILVIx_CS4, this.SUI.ILVIy_CS4];
	this.SUI.ILV_CS4 = [[this.SUI.ILVIx_CS4,this.SUI.ILVIy_CS4],[this.SUI.ILVFx_CS4,this.SUI.ILVFy_CS4]]; 
	console.log("MSG:distanceCheck function values IntermStep",IntermStep)
	console.log("MSG:distanceCheck function values this.SUI.ILVIx_CS4",this.SUI.ILVIx_CS4,this.SUI.ILVIy_CS4)
	console.log("MSG:distanceCheck function values this.SUI.ILV_I_CS4",this.SUI.ILV_I_CS4)
	console.log("MSG:distanceCheck function values this.SUI.ILV_CS4",this.SUI.ILV_CS4)

	const distanceFININI =  Math.sqrt(Math.pow(this.SUI.ILVFx_CS4 - this.SUI.ILVIx_CS4, 2) + Math.pow(this.SUI.ILVFy_CS4 - this.SUI.ILVIy_CS4, 2));
	
	if (distanceFININI < this.DEM.Resolution) {
		console.log("MSG: leaving distanceCheck, found close enough point")
		return 1; 
	} else {
		console.log("MSG: leaving distanceCheck, didn't find close enough point")
		return 0;
	}
}

drawTheRed(LV) {
	console.log("MSG: Entered into drawTheRed function",LV)
	const lineFeatures = [];
	const capturedPoint = new Point([LV[0][0], LV[0][1]]);
	// LV.forEach((coord) => {
	const coordPoint = new Point([LV[1][0], LV[1][1]]);
	const line = new LineString([capturedPoint.getCoordinates(),coordPoint.getCoordinates(),]);
	const feature = new Feature(line);
	lineFeatures.push(feature);
	// });
	const lineVectorSource = new VectorSource({features: lineFeatures,});
	const lineVectorLayer = new VectorLayer({source: lineVectorSource,
		style: new Style({
			stroke: new Stroke({
				color: 'red',
				width: 2,
			}),
		}),
	});
	this.basemap.addLayer(lineVectorLayer);
	console.log("MSG: Finished drawing line on screen");
}
}  
//  openModal() {
 
// 		{this.resultsString +=
// 		`Threshold: ${this.searchableSwath[t]}\n`;
// 		`GeobonZOC Array List\n` +
// 		`GeobonZOC: ${this.Results.GeobonZOCString}\n` +
// 		`GeobonRes: ${this.Geobon.GeobonRes}\n` +
// 		`\n` +
// 		`User's Initial Row and Column\n` +
// 		`INIDEMROW: ${this.Geobon.DEM_I_row}\n` +
// 		`INIDEMCOL: ${this.Geobon.DEM_I_col}\n` +
// 		`FINDEMROW: ${this.Geobon.DEM_F_row}\n` +
// 		`FINDEMCOL: ${this.Geobon.DEM_F_col}\n` +
// 		`DEM_ZOC_CS4 array list\n` +
// 		`DEM_ZOC_CS4: ${this.Results.DEM_ZOC_CS4String}\n` +
// 		`Distance between Initial Row Column and DEM_ZOC_CS4 array list  \n` +
// 		`INI_DEM_DIST: ${this.Geobon.DEM_ZOC_CandDistances}\n` +
// 		`\n` +
// 		`Initial Row Column Elevation Point\n` +
// 		`INI_ELEV: ${this.Results.INI_ELEVString}\n` +
// 		`FIN_ELEV: ${this.Results.FIN_ELEVString}\n` +
// 		`DEM_ZOC_CS4 Elevation points\n` +
// 		`DEM_ZOC_CS4_ELEV: ${this.Geobon.DEM_ZOC_Eelevations}\n` +
// 		`Difference between Initial Row Column and DEM_ZOC_CS4 Elevations \n` +
// 		`ELEV_DIFF: ${this.Geobon.DEM_ZOC_ElevDiffs}\n` +
// 		`\n` +
// 		`FINAL_SLOPE: ${this.Results.FINAL_SLOPEString}\n` +
// 		`\n` +
// 		`Res_CS4: ${this.DEM.Res_CS4}\n` +
// 		`candIx_CS4: ${this.SUI.ILVIx_CS4}\n` +
// 		`candIy_CS4: ${this.SUI.ILVIy_CS4}\n` +
// 		`candFx_CS4: ${this.SUI.ILVFx_CS4}\n` +
// 		`candFy_CS4: ${this.SUI.ILVFy_CS4}\n` +
// 		`LLC_CS4x: ${this.DEM.LLC_CS4x}\n` +
// 		`LLC_CS4y: ${this.DEM.LLC_CS4y}\n` +
// 		`IntermStepCS1x: ${this.Results.IntermStepCS1x}\n`+  
// 		`IntermStepCS1y: ${this.Results.IntermStepCS1y}\n`;
	
// 	// Write the resultsString to a text file
// 	const blob = new Blob([this.resultsString], { type: 'text/plain;charset=utf-8' });
// 	saveAs(blob, 'results.txt');
// 	console.log('Results saved to results.txt');
// 	 // Open the modal and display the compiled values
// 	 if (this.valuesCompiled) {
// 		// Open the modal and pass the values to it
// 		// You can use Angular's MatDialog or any other modal library
// 	 } else {
// 		// Handle the case when values are not compiled
// 		// Show a message or handle it as per your requirement
// 	 }
//   }
  
// }

