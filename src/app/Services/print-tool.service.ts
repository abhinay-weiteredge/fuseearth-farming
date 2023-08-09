import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { Injectable, OnInit } from '@angular/core';
@Injectable(
    {
      providedIn: 'root'
    }
)
export class PrintToolService implements OnInit {
    constructor() {
    }
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }
    mapInit(printmap): any {
        const map = new Map({
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            target: printmap,
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        });
        return map;
    }
}