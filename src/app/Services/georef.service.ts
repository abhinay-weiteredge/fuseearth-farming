import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import 'ol/ol.css';
import {Draw, Modify, Snap} from 'ol/interaction';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, RegularShape, Stroke, Icon, Style, Text} from 'ol/style';
import { unByKey } from 'ol/Observable.js';
import GeoJSON from 'ol/format/GeoJSON';
import { CommonService } from './common.service';

@Injectable()
export class GeorefService {

  projection = 'EPSG:4326';
  georefPointsDataContainer: any = {};
  croppingToolsData: any = {};
  constructor(private commonService: CommonService) { }

  drawPointOnMap(mapRef: any, geoJson, drawType = 'Point', watchOnPolygonChanges = null, styleShape, styleColor): void{
    console.log('drawPointOnMap');
    console.log(geoJson, drawType);
    // const shape = this.getShapeOfaContext(context);
    // console.log(shape);
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson.features, {
        featureProjection: this.projection // this.basemapService.getBaseMapProjection()
      })
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.getLayerStyle({shape: styleShape, color: styleColor}, 'rgba(255,255,255,0.1)', geoJson.pointNum)
    });
    vectorLayer.set('name', geoJson.name);
    vectorLayer.setZIndex(5);
    // vectorLayer.set('geopadCustomData', context);

    mapRef.addLayer(vectorLayer);
    if (this.commonService.isValid(watchOnPolygonChanges)) {
      console.log('SUBSCRIBED FOR POLYGON CHANGES');
      const modify = new Modify({source: vectorSource});
      mapRef.addInteraction(modify);
      let listener = null;
      try{
        console.log(modify);
        listener = modify.on('modifyend', (event) => {
          console.log(event);
          const features = event.features.getArray();
          const newForm = new GeoJSON();
          const featColl = newForm.writeFeaturesObject(features);
          const data = {
            features: featColl,
            'co-ordinates': featColl.features[0].geometry.coordinates,
            name: geoJson.name,
            from: drawType
          };
          watchOnPolygonChanges.next(data);
        });
      }catch (e){
        console.log(e);
      }
      this.georefPointsDataContainer[geoJson.name] = {
        modifyInteraction: modify,
        modifyInteractionListener: listener
      };
    }
    console.log(this.georefPointsDataContainer);
  }


  redrawTextOnPoint(layerObj: any, pointNum): void{
    const style = this.getLayerStyle({shape: 'circle', color: 'red'}, 'rgba(255,255,255,0.1)', String(pointNum));
    layerObj.setStyle(style);
  }

  redrawPoint(mapRef, layerObj: any, geoJson, drawType = 'Point', watchOnPolygonChanges): void{
    console.log(geoJson, drawType);
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson.features, {
        featureProjection: this.projection // this.basemapService.getBaseMapProjection()
      })
    });
    layerObj.setSource(vectorSource);
    const layerName = layerObj.values_.name;
    if (this.commonService.isValid(this.georefPointsDataContainer[layerName].modifyInteraction)){
      const oldModify = this.georefPointsDataContainer[layerName].modifyInteraction;
      console.log(oldModify);
      mapRef.removeInteraction(oldModify);
      if (this.commonService.isValid(this.georefPointsDataContainer[layerName].modifyInteractionListener)) {
        unByKey(this.georefPointsDataContainer[layerName].modifyInteractionListener);
      }

      const modify = new Modify({source: vectorSource});
      mapRef.addInteraction(modify);
      let listener = null;
      try{
        console.log(modify);
        listener = modify.on('modifyend', (event) => {
          console.log(event);
          const features = event.features.getArray();
          const newForm = new GeoJSON();
          const featColl = newForm.writeFeaturesObject(features);
          const data = {
            features: featColl,
            'co-ordinates': featColl.features[0].geometry.coordinates,
            name: geoJson.name,
            from: drawType
          };
          watchOnPolygonChanges.next(data);
        });
      }catch (e){
        console.log(e);
      }
      this.georefPointsDataContainer[geoJson.name] = {
        modifyInteraction: modify,
        modifyInteractionListener: listener
      };

    }
    console.log(this.georefPointsDataContainer);
  }
  removeFeatureOnMap(mapRef: any, layerName: string): void{
    console.log('removeFeatureOnMap');
    try{
      mapRef.getLayers().forEach(layerObj => {
        if (layerObj !== undefined) {
          if (layerObj.values_.name === layerName) {
            mapRef.removeLayer(layerObj);
            if (this.commonService.isValid(this.georefPointsDataContainer[layerName].modifyInteractionListener)) {
              unByKey(this.georefPointsDataContainer[layerName].modifyInteractionListener);
            }
            this.georefPointsDataContainer[layerName].modifyInteractionListener = null;
            if (this.commonService.isValid(this.georefPointsDataContainer[layerName].modifyInteraction)){
              mapRef.removeInteraction(this.georefPointsDataContainer[layerName].modifyInteraction);
            }
            this.georefPointsDataContainer[layerName].modifyInteraction = null;
            delete this.georefPointsDataContainer[layerName];
          }
        }
      });
    } catch (e) { console.log(e); }
    console.log(this.georefPointsDataContainer);
  }

  getLayerStyle(shapeInfo: any, fillColor = 'rgba(255,255,255,0.1)', displayText = null): Style{
    let imageStyle = null;
    console.log(shapeInfo);
    if (shapeInfo.shape === 'circle') {
      imageStyle = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: fillColor // shapeInfo.color // '#e91e63' // '#ffcc33'
        }),
        stroke: new Stroke({
          color: shapeInfo.color, // '#e91e63', // '#ffcc33',
          width: 2
        })
      });
    } else if (shapeInfo.shape === 'square') {
      imageStyle = new RegularShape({
        fill: new Fill({
          color: fillColor // shapeInfo.color
        }),
        stroke: new Stroke({color: shapeInfo.color, width: 2}),
        points: 4,
        radius: 12,
        angle: Math.PI / 4,
      });
    }

    const style = new Style({
      // fill: new Fill({
      //   color: 'rgba(255, 255, 255, 0.4)' // 'rgba(255, 255, 255, 0.2)'
      // }),
      // stroke: new Stroke({
      //   color: '#e91e63', // '#ffcc33',
      //   width: 2
      // }),
      image: imageStyle,
    });
    if (this.commonService.isValid(displayText)){
      style.setText( new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        font: '12px/1 Arial', // 'bold 12px/1 Arial'
        text: displayText,
        fill: new Fill({color: '#000000'}),
        stroke: new Stroke({color: '#000000', width: 2}),
        offsetX: 0,
        offsetY: 0,
        placement: 'point',
        // maxAngle: maxAngle,
        overflow: undefined,
        rotation: 0,
      }) );
    }
    return style;
  }


  redrawCroppingArea(geoJson: any): void{
    console.log('In redrawCroppingArea');
    console.log(geoJson);
    const vector = this.croppingToolsData.vector;
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson.features, {
        featureProjection: this.projection
      })
    });
    vector.setSource(vectorSource);
    console.log(this);
    console.log(vector);
  }
  activateCroppingTool(mapRef, positionMarkObserver: Subject<any>): void{
    const drawType = 'Polygon';
    const source = new VectorSource();
    const vector = new VectorLayer({
      source,
      // style: this.getLayerStyle({shape: 'circle', color: 'blue'})
      style: this.getLayerStyleForPolygon()
    });
    vector.setZIndex(6);
    vector.set('name', 'georef_cropping_tool');
    mapRef.addLayer(vector);
    const draw = new Draw({
      source,
      type: drawType // 'Point'
    });
    mapRef.addInteraction(draw);
    const snap = new Snap({source});
    mapRef.addInteraction(snap);

    this.croppingToolsData = {
      snap, draw, vector
    };
    vector.getSource().on('addfeature', (event) => {
      console.log('feature added');
      try {
        const features = snap.getFeatures_();
        console.log(features);
        const newForm = new GeoJSON();
        const featColl = newForm.writeFeaturesObject(features);
        console.log(featColl);

        // setTimeout(() => {
        //   const vectorSource = new VectorSource({
        //     // features
        //     features: (new GeoJSON()).readFeatures(featColl, {
        //       featureProjection: this.projection
        //     })
        //   });
        //   vector.setSource(vectorSource);
        // }, 3000);

        const data = {
          features: featColl,
          'co-ordinates': featColl.features[0].geometry.coordinates,
          name: `georef_cropping_tool`,
          from: drawType // 'position'
        };
        positionMarkObserver.next(data);
        setTimeout(() => {
          // this.deActivateCroppingTool(mapRef);
          mapRef.removeInteraction(this.croppingToolsData.draw);
          mapRef.removeInteraction(this.croppingToolsData.snap);
        }, 1000);
      } catch (e) { console.log(e); }
    });
  }
  deActivateCroppingTool(mapRef): void{
    if (this.commonService.isValid(mapRef)){
      mapRef.removeInteraction(this.croppingToolsData.draw);
      mapRef.removeInteraction(this.croppingToolsData.snap);
      mapRef.removeLayer(this.croppingToolsData.vector);
    }
  }

  getLayerStyleForPolygon(): Style{
    let imageStyle = null;
    // console.log(shapeInfo);
    imageStyle = new RegularShape({
      fill: new Fill({color: '#e91e63'}),
      stroke: new Stroke({color: '#e91e63', width: 2}),
      points: 4,
      radius: 7,
      angle: Math.PI / 4,
    });
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.4)' // 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#e91e63', // '#ffcc33',
        width: 2
      }),
      image: imageStyle
    });
  }

}
