import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BasemapService } from 'src/app/basemap/basemap.service';
import OlMap from 'ol/Map';
import { DragBox } from 'ol/interaction.js';
import { platformModifierKeyOnly } from 'ol/events/condition.js';
import { Select } from 'ol/interaction';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
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
import {
  Output,
  EventEmitter,
  SimpleChange,
  AfterViewInit,
} from '@angular/core';
import * as $ from 'jquery';
import { FileUtil } from 'src/app/geobar/util/fileUtil';
import { KMLGroundOverlayParsing } from 'src/app/geobar/util/kmlGroundOverlayParsing';
import { AuthObservableService } from 'src/app/Services/authObservableService';
import { GeotrayService } from '../geotray.service';
import { MiniTowerItemComponent } from 'src/app/geotower/mini-tower-item/mini-tower-item.component';
import { MyService } from 'src/app/my-service.service';
import { Circle } from 'ol/style.js';
import Draw from 'ol/interaction/Draw.js';
import Point from 'ol/geom/Point.js';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Tile as TileLayer } from 'ol/layer';
import { emit } from 'process';
import { LineString } from 'ol/geom';
import Pointer from 'ol/interaction/Pointer';
import { SlopeFinderComponent } from '../slope-finder/slope-finder.component';
// import * as turf from 'turf';
import { Geometry } from 'ol/geom';
import * as turf from '@turf/turf';
import { get as getProjection } from 'ol/proj.js';

@Component({
  selector: 'app-buffer-tool',
  templateUrl: './buffer-tool.component.html',
  styleUrls: ['./buffer-tool.component.scss'],
})
export class BufferToolComponent implements OnInit {
  @Input() onbufferClicked;
  private basemap: OlMap;
  private renderer: Renderer2;
  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  draw: any;
  snap: any;
  receivedslope: any;
  bufferValue: any;
  selectedUnits: turf.Units = 'miles';

  constructor(
    private commonService: CommonService,
    private basemapService: BasemapService,
    private renderer2: RendererFactory2
  ) {
    this.renderer = this.renderer2.createRenderer(null, null);
    this.basemap = this.basemapService.getCurrentBasemap();
  }
  ngOnInit() {
    if (this.onbufferClicked) {
      this.showbuffer();
    }
    this.bufferValue;
    console.log(this.bufferValue, 'checkbuffervalue');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.onbufferClicked &&
      changes.onbufferClicked.currentValue === true
    ) {
      this.showbuffer();
      console.log(this.onbufferClicked, 'checkonbuffferclickedinbuffertool');
    }
  }

  // update the variable when the dropdown selection changes
  onUnitsChange() {
    this.selectedUnits = this.selectedUnits;
    console.log(this.selectedUnits, 'checkselectedunits');
  }

  showbuffer() {
    // if (!this.onbufferClicked) {
    //         return;
    // }
    const vectorLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 5,
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

    if (!this.commonService.isValid(this.basemap)) {
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    this.basemap.addLayer(vectorLayer);

    const draw = new Draw({
      source: vectorLayer.getSource(),
      type: 'LineString',
    });
    this.basemap.addInteraction(draw);
    draw.on('drawend', async (event) => {
      var coordinates = event.feature.getGeometry().getCoordinates();
      console.log(coordinates,"checkinitialcoords")
      var transformedCordArray = [];
  
      // for (let i = 0; i < coordinates.length; i++) {
      //   for (let j = 0; j < 1; j++) {
      //     var transformed_Coordinates =
      //       this.basemapService.getTransformedCoordinates(
      //         [coordinates[i][j], coordinates[i][j + 1]],
      //         this.basemapService.getCurrentBasemap().getView().getProjection(),
      //         getProjection('EPSG:4326')
      //       );
  
      //     transformedCordArray.push(transformed_Coordinates);

      //   }
      //  console.log(transformedCordArray,"sgwhdwgs")
      // }
      console.log(
        coordinates,
        transformedCordArray,
        'checlcoordinatesofbuffer'
      );

      const bufferDistance = this.bufferValue;
      const bufferedLine = turf.buffer(
        turf.lineString(coordinates),
        bufferDistance,
        { units: this.selectedUnits }
          
      );

      const feature = new Feature({
        geometry: new Polygon(bufferedLine.geometry.coordinates),
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.5)',
          }),
          stroke: new Stroke({
            color: 'red',
            width: 5,
          }),
        }),
      });
      console.log(feature,"checkfeature")
      const circleSource = new VectorSource({
        features: [feature],
      });
      const circleLayer = new VectorLayer({
        source: circleSource,
      });
      this.basemap.addLayer(circleLayer);
    });
  }
}
