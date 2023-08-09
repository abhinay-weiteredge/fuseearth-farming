import { IBasemap } from './IBasemap';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlTileWMS from 'ol/source/TileWMS';
import osm from 'ol/source/OSM';
import BingMaps from 'ol/source/BingMaps';


export class StreetBingMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
      return new OlTileLayer({
        visible: true,
        preload: Infinity,
        source: new BingMaps({
          key: 'AsyUGselC-sTUDjUXG2zzNivnjN7bOBiYWL51gaoZUlyhlLUZ7tPcivlA_0lauMR',
          imagerySet: 'RoadOnDemand',
          // use maxZoom 19 to see stretched tiles instead of the BingMaps
          // "no photos at this zoom level" tiles
          // maxZoom: 19
          crossOrigin: 'anonymous',
        }),
        name: 'bingstreet',
      });
  }
}

