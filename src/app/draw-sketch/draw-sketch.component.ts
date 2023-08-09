import { Component, OnInit, AfterViewInit } from '@angular/core';
import 'ol/ol.css';
import OlMap from 'ol/Map';
import View from 'ol/View';
import {Draw, Modify, Snap} from 'ol/interaction';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import { BasemapService } from '../basemap/basemap.service';
import GeoJSON from 'ol/format/GeoJSON';

@Component({
  selector: 'app-draw-sketch',
  templateUrl: './draw-sketch.component.html',
  styleUrls: ['./draw-sketch.component.scss']
})
export class DrawSketchComponent implements OnInit, AfterViewInit {

  draw: any;
  snap: any;
  private _basemap: OlMap;
  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  typeSelect: string = 'None';
  constructor(private basemapService: BasemapService) { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this._basemap = this.basemapService.getCurrentBasemap();
    this.setupMapToDrawSketch();
  }
  getLayerStyle() {
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.4)' // 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#e91e63', // '#ffcc33',
        width: 2
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#e91e63' // '#ffcc33'
        })
      })
    });
  }
  setupMapToDrawSketch() {
    // this.raster = new TileLayer({
    //   source: new OSM()
    // });
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: this.getLayerStyle()
    });
    // this._basemap.addLayer(this.raster);
    this._basemap.addLayer(this.vector);
  }
  clearMap() {
    this._basemap.removeLayer(this.raster);
    this._basemap.removeLayer(this.vector);
  }


addInteractions() {
  console.log('In addInteractions');
  if (this.typeSelect !== 'None') {
    this.draw = new Draw({
      source: this.source,
      type: this.typeSelect
    });
    this._basemap.addInteraction(this.draw);
    this.snap = new Snap({source: this.source});
    this._basemap.addInteraction(this.snap);
  }
}

typeChanges(value) {
  console.log('IN typechanges');
  console.log(value);
  console.log(this);
  this.typeSelect = value;
  this._basemap.removeInteraction(this.draw);
  this._basemap.removeInteraction(this.snap);
  this.addInteractions();
  if (value === 'None') {
    this.getFeatures();
  }
}
getFeatures() {
  try {
    console.log(this.snap);
    console.log(this.snap.getFeatures_());
    const features = this.snap.getFeatures_();
    console.log(features);
    const newForm = new GeoJSON();
    const featColl = newForm.writeFeaturesObject(features);
    console.log(featColl);
    // this.exportJson(featColl);
    const data = {
      features: featColl,
      name: 'temp' + new Date().getTime()
    };
    setTimeout(() => {
      // this._basemap.removeLayer(this.vector);
      this.clearMap();
      this.setupMapToDrawSketch();
      setTimeout(() => {
        console.log('REDRAWING...');
        this.reDrawInMap(data);
      }, 3000);
    }, 1000);
  } catch (e) { console.log(e); }
}

reDrawInMap(geoJson) {
  const vectorSource = new VectorSource({
    features: (new GeoJSON()).readFeatures(geoJson.features, {
      featureProjection: this.basemapService.getBaseMapProjection()
    })
  });
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: this.getLayerStyle()
  });
  vectorLayer.set('name', geoJson.name);
  this._basemap.addLayer(vectorLayer);
}
exportJson(featuresCollection) {
  const txtArray = [];
  txtArray.push(JSON.stringify(featuresCollection));

// Here I use the saveAs library to export the JSON as *.txt file

  const blob = new Blob(txtArray, {type: 'text/json;charset=utf8'});
  this.saveAs(blob, 'temp' + '.txt');
}

saveAs(blob, fName) {
  const link: any = document.createElement('a');
  const id = 'tempDownload_' + new Date().getTime();
  document.body.appendChild(link);
  link.id = id;
  link.style = 'display: none';
    const url = window.URL.createObjectURL(blob);
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
    link.href = url;
    link.download = fName;
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
}


}
