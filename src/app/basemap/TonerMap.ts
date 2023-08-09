import { IBasemap } from './IBasemap';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlTileWMS from 'ol/source/TileWMS';
import osm from 'ol/source/OSM';

export class TonerMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
    return new OlTileLayer({
      source: new Stamen({
        layer: 'toner-lite',
      }),
      name: 'toner',
      visible: false
    });
  }
}

