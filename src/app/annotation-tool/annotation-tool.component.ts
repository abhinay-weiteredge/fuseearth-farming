import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChange } from '@angular/core';
import { AnnotationToolService } from '../Services/annotation-tool.service';
import { CommonService } from '../Services/common.service';

export class AnnotationPolygon{
  name: string;
  index: number;
  coords: any[];
  features: any;
  constructor(name: string, index: number, coords: any[], features: any){
    this.name = name;
    this.index = index;
    this.coords = coords;
    this.features = features;
  }
}

@Component({
  selector: 'app-annotation-tool',
  templateUrl: './annotation-tool.component.html',
  styleUrls: ['./annotation-tool.component.scss']
})
export class AnnotationToolComponent implements OnInit, OnChanges {

  @Input() triggerAnnotation = '';
  @Output() saveAnnotation: EventEmitter<any> = new EventEmitter<any>();

  annotatePolygons: Array<AnnotationPolygon> = [];
  showAnnotationCancelConfirmScreen = false;

  constructor(private atService: AnnotationToolService, private commonService: CommonService) {
    this.atService.onPositionMark.subscribe(res => {
      console.log('POSITION MARKED');
      console.log(res);
      const coords = this.getCoordsFromPositionMarkData(res.from, res['co-ordinates']);
      const data = this.getFeaturesFromCoords(coords);
      const annotatePolygon: AnnotationPolygon = new AnnotationPolygon(`annotate${this.annotatePolygons.length + 1}`,
                                                                        this.annotatePolygons.length + 1, coords, data);
      this.atService.reDrawPointOrPolygonOnMap(res.from, annotatePolygon.features);
      this.annotatePolygons.push(annotatePolygon);
      console.log(this.annotatePolygons);
    });

    this.atService.onPolygonChanges.subscribe(polygonChanged => {
      console.log('POLYGON CHANGED');
      console.log(polygonChanged);
      const coords = this.getCoordsFromPositionMarkData(polygonChanged.from, polygonChanged['co-ordinates']);
      const data = this.getFeaturesFromCoords(coords, polygonChanged.id);
      const index = this.annotatePolygons.findIndex(obj => obj.features.id === polygonChanged.id);
      if (index !== -1){
        this.annotatePolygons[index].coords = coords;
        this.annotatePolygons[index].features = data;
      }
      console.log(this.annotatePolygons);
      console.log(coords);
    });

    this.atService.onCancelAnnotation.subscribe(res => {
      console.log('CANCEL ANNOTATION');
      console.log(res);
      const index = this.annotatePolygons.findIndex(obj => obj.features.id === res.id);
      if (index !== -1){
        console.log(this.annotatePolygons[index]);
        this.atService.removeLayerFromMap(this.annotatePolygons[index].features.name, this.annotatePolygons[index].features.id);
        this.annotatePolygons.splice(index, 1);
        console.log(this.annotatePolygons);
      }
    });
    this.atService.onSaveAnnotation.subscribe(res => {
      console.log('SAVE ANNOTATION');
      console.log(res);
      const index = this.annotatePolygons.findIndex(obj => obj.features.id === res.id);
      if (index !== -1){
        console.log(this.annotatePolygons[index]);
        const saveFeatures = this.commonService.getObjectClone(this.annotatePolygons[index]);
        this.clearAllAnnotationsAndTool();
        console.log('Data to return');
        console.log(saveFeatures);
        this.saveAnnotation.emit(saveFeatures);
      }
    });
  }

  ngOnInit(): void { }

  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    // console.log('IN ANNOTATION INPUT CHANGES');
    // console.log(changes);
    // console.log(this);
    if (this.commonService.isValid(changes.triggerAnnotation)) {
      if (!changes.triggerAnnotation.firstChange) {
        // console.log('IT IS NOT A FIRST CHANGE');
        // console.log('ENABLING ANNOTATION TOOL');
        // console.log(this.triggerAnnotation);
        this.atService.drawShapesWithAnnotateTool();
      } else {
        // console.log('IT IS A FIRST CHANGE');
      }
    }
  }

  clearAllAnnotationsAndTool(): void{
    this.annotatePolygons.forEach(obj => {
      this.atService.removeLayerFromMap(obj.features.name, obj.features.id);
    });
    this.annotatePolygons = [];
    this.atService.removePolygonMarkTools();
  }

  @HostListener('window:keyup.esc', ['$event'])
  keyEvent(event: KeyboardEvent): any {
    console.log('esc clicked!! in annotation component ', event);
    this.clearAllAnnotationsAndTool();
  }

  getCoordsFromPositionMarkData(from, rawCoords): any{
    let coords;
    const coordsList = [];
    if (from === this.atService.shapeDrawType.POLYGON /*'polygon'*/){
      // coords = res['co-ordinates'];
      rawCoords.forEach(latLngList => {
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
    } else if ( from === this.atService.shapeDrawType.LINE_STRING ){
      rawCoords.forEach(latLngList => {
        console.log(latLngList);
        // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
        coordsList.push(latLngList[0]);
        coordsList.push(latLngList[1]);
      });
      console.log(coordsList);
      coords = coordsList;
    } else if (from === this.atService.shapeDrawType.POINT /*'position'*/){
      // coords = [res['co-ordinates']];
      rawCoords.forEach(latLngList => {
        console.log(latLngList);
        // CO-ORDINATES `[78.534344232, 17.534435435]` <=> `[LONGITUDE, LATITUDE]`
        coordsList.push(latLngList);
      });
      console.log(coordsList);
      coords = coordsList;
    }
    return coords;
  }

  getFeaturesFromCoords(coords, id = null): any{
    let geometryData: any;
    let isPolygon = false;

    if (coords.length === 2) {
      geometryData = {
        type: this.atService.shapeDrawType.POINT, // 'Point',
        coordinates: [Number(coords[0]), Number(coords[1])]
      };
    } else if (coords.length > 2) {
      if (coords.length > 4) {
        // console.log(`LAT : ${coords[0]} === ${coords[coords.length - 2]} `);
        // console.log(`LONG : ${coords[1]} === ${coords[coords.length - 1]} `);
        if (coords[0] === coords[coords.length - 2] &&
            coords[1] === coords[coords.length - 1]) {
            isPolygon = true;
        }
      }
      geometryData = {
        type: isPolygon ? this.atService.shapeDrawType.POLYGON : this.atService.shapeDrawType.LINE_STRING,
        coordinates: []
      };
      let i = 0;
      const coOrds = [];
      while ( i < coords.length ) {
        try{
          const tempArray = [Number(coords[i]), Number(coords[i + 1])];
          coOrds.push(tempArray);
        } catch (e) {
          console.log(e);
        }
        i = i + 2;
      }
      geometryData.coordinates = isPolygon ? [coOrds] : coOrds;

    }
    if (!this.commonService.isValid(id)){
      id = new Date().getTime().toString();
    }
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: null
        }]
      },
      name: `annotation_${id}`,
      id
    };
    return data;
  }

}
