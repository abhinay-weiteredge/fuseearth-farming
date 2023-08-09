import { IBasemap } from './IBasemap';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlTileWMS from 'ol/source/TileWMS';
import osm from 'ol/source/OSM';
import BingMaps from 'ol/source/BingMaps';
import XYZ from 'ol/source/XYZ';
import TileImage from 'ol/source/TileImage';




export class StreetGoogleMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
      return new OlTileLayer({
        visible: false,
        source: new XYZ({
            // attributions: [new ol.Attribution({ html: '<a href=""></a>' })],
            // url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga'
            url: 'https://mt1.google.com/vt/lyrs=m@113&hl=en&&x={x}&y={y}&z={z}',
            crossOrigin: 'anonymous',
         }),
         // source: new TileImage({ url: 'http://mt1.google.com/vt/lyrs=m@113&hl=en&&x={x}&y={y}&z={z}' }),
         // source: new TileImage({ url: 'http://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}' }),
         name: 'googlestreet',
        });
  }
}

