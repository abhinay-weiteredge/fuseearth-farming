import { OpenStreetMap } from './OpenStreetMap';
import { StamenMap } from './StamenMap';
import { IBasemap } from './IBasemap';
import { SatelliteMap } from './SatelliteMap';
import { TonerMap } from './TonerMap';
import { SatelliteBingMap } from './SatelliteBingMap';
import { StreetBingMap } from './StreetBingMap';
import { StreetGoogleMap } from './StreetGoogleMap';
import { SatelliteGoogleMap } from './SatelliteGoogleMap';

export class BasemapFactory {
    constructor(private baseMapType: string) { }

    public getBaseMap(): any {
        const stamenMapType = 'terrain';
        const openStreetMapType = 'openstreet';
        const satelliteMapType = 'satellite';
        const tonerMapType = 'toner';
        const satelliteBingMapType = 'bingsatellite';
        const streetBingMapType = 'bingstreet';
        const streetGoogleMapType = 'googlestreet';
        const satelliteGoogleMapType = 'googlesatellite';
        if (this.baseMapType.toUpperCase() === stamenMapType.toUpperCase()) {
            return new StamenMap();
        } else if (this.baseMapType.toUpperCase() === openStreetMapType.toUpperCase()) {
            return new OpenStreetMap();
        } else if (this.baseMapType.toUpperCase() === satelliteMapType.toUpperCase()) {
            return new SatelliteMap();
        } else if (this.baseMapType.toUpperCase() === tonerMapType.toUpperCase()) {
            return new TonerMap();
        } else if (this.baseMapType.toUpperCase() === satelliteBingMapType.toUpperCase()) {
            return new SatelliteBingMap();
        } else if (this.baseMapType.toUpperCase() === streetBingMapType.toUpperCase()) {
            return new StreetBingMap();
        } else if (this.baseMapType.toUpperCase() === streetGoogleMapType.toUpperCase()) {
            return new StreetGoogleMap();
        } else if (this.baseMapType.toUpperCase() === satelliteGoogleMapType.toUpperCase()) {
            return new SatelliteGoogleMap();
        }
    }
}
