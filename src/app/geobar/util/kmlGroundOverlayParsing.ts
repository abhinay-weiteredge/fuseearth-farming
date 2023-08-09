import { CommonService } from '../../Services/common.service';
import ImageLayer from 'ol/layer/Image.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import OlMap from 'ol/Map';
import { BasemapService } from '../../basemap/basemap.service';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import { Observable, Subject } from 'rxjs';
import * as xml2js from 'xml2js';
import { FirebaseUtil } from './firebaseUtil';
import { AngularFireStorage } from '@angular/fire/storage/storage';

export class KMLGroundOverlayParsing {
  private TEXT_CONSTANT = 'text';
  private basemap;
  private basemapProjection;
  private commonService = new CommonService();
  epsgCode = 'EPSG:4326';
  jpgFileName;
  imageExcelData;
  overlayDataArray = [];
  firebaseUrl;
  progress: Subject<any> = new Subject<any>();

  constructor(private basemapService: BasemapService, private firestorage: AngularFireStorage) {
    this.basemap = this.basemapService.getCurrentBasemap();
    // this.basemapProjection = this.basemap.getView().getProjection().code_;
  }
  public processKMLParsing(filesList, fileName, kmlFile): any {
    if (this.commonService.isValid(kmlFile)) {
      this.pFileReaderAsText(kmlFile)
      .then((value) => {
        // here got xml data
        console.log('xml data ', value, filesList);
        // const jpgURL = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/.jpg%2FSite%20Plan.PNG?alt=media&token=1002062c-dfa5-46f1-8f19-7dc54c6a907e';
        this.jpgFileName = fileName + '_jpg';
        // const extent = [-117.7455828318496, 34.05535819987329, -117.7447205923813, 34.05605439659823];
        // this.imageRenderingOnMap(extent, jpgURL, jpgFileName);
        this.jpgImagePreviewPre(value, filesList);
      });
    }
  }
  private jpgImagePreviewPre(xmlData, filesList): any {
    this.xmlParser(xmlData);
    console.log('overlayDataArray ', this.overlayDataArray);
    this.overlayDataArray.forEach(overlayData => {
      if (overlayData !== undefined) {
        filesList.forEach(file => {
          console.log('files ---- ', file, file.name, overlayData.icon);
          if (file.name === overlayData.icon) {
            console.log('condition passed');
            this.getFirebaseUtil(file, overlayData);
            console.log('what is firebase url after ', this.firebaseUrl);
          }
        });
      }
    });
  }
  private  jpgImagePreviewPost(extent, jpgURL, xmlData): any {
    const image = {
      url: jpgURL
    };
    this._getImageDimension(image).subscribe(imageData => {
      /* this.getProjDef('EPSG:4326').subscribe( projdef => {
        console.log('projection def is ', projdef, jpgURL, imageData);
        proj4.defs(this.epsgCode, projdef);
        register(proj4);
        extent = transformExtent([translationX, translationY,
          translationX + (xScale * imageData.width), translationY + (yScale * imageData.height)],
        get(this.epsgCode), get(this.basemapProjection));
        console.log('After basemap projection transform extent is : ', extent, this.epsgCode, coordinateX, coordinateY);
         */
        this.imageRenderingOnMap(extent, jpgURL, imageData);
        // });
    });
  }
  private _getImageDimension(image): Observable<any> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = (event) => {
        const loadedImage: any = event.currentTarget;
        image.width = loadedImage.width;
        image.height = loadedImage.height;
        observer.next(image);
        observer.complete();
      };
      img.src = image.url;
    });
  }
  private imageRenderingOnMap(extent, jpgURL, imageData): any {
    /* let epsgCode = this.baseMapService.projection3857Code;
    const parser = new xml2js.Parser({ strict: false, trim: true });
    parser.parseString(xmlData, (err, result) => {
      const obj = result;
      console.log(result);
      if (this._commonService.isValid(obj)) {
        Object.entries(obj).forEach(data => {
          data[1]['METADATA'].forEach(xmlMetadata => {
            if (xmlMetadata.GEODATAXFORM !== undefined) {
              epsgCode = 'EPSG:' + xmlMetadata.GEODATAXFORM[0].SPATIALREFERENCE[0].LATESTWKID[0];
            }
          });
        });
      }
    });
    let extent = [left, top, left + (xScale * imageData.width), top + (yScale * imageData.height)];
    console.log('extent : ', extent);
    extent = transformExtent([left, top, left + (xScale * imageData.width), top + (yScale * imageData.height)],
      get(epsgCode), get(this._basemapProjection));*/
    // extent = transformExtent(extent, get('EPSG:4326'), get('EPSG:4326'));

    const imageProjection = new Projection({
      code: 'orto-image',
      // code: this.epsgCode,
      units: 'pixels',
      extent
    });
    const imagLayer = new ImageLayer({
      source: new Static({
        url: jpgURL,
        projection: imageProjection,
        imageExtent: extent,
        imageSize: [imageData.width, imageData.height],
        imageLoadFunction : (image) => {
          console.log(image);
          console.log(image.getImage());
          image.getImage().src = jpgURL;
          if (image.resolution === undefined) {
            image.resolution = (image.extent[3] - image.extent[1]) / image.image_.height;
          }
          image.state = 2; // ImageState.LOADED;
          image.unlistenImage_();
          image.changed();

        }
      })
    });
    console.log(imagLayer, this.basemap);
    imagLayer.set('name', this.jpgFileName);
    imagLayer.set('type', 'IMAGE');
    imagLayer.setOpacity(0.7);
    this.basemap.addLayer(imagLayer);
    // this.addLayerObjectsToTower();
    this.basemap.getLayers().forEach(currentLayer => {
      if (this.jpgFileName === currentLayer.values_.name) {
        console.log('image layer is ', currentLayer, imagLayer);
        const extentValue = currentLayer.values_.source.getImageExtent();
        this.basemap.getView().fit(extentValue);
      }
    });
  }
  private _readerAsPromise(streamContent: any, readType: string): any {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      if (readType === this.TEXT_CONSTANT) {
        fr.readAsText(streamContent);
      } else {
        fr.readAsArrayBuffer(streamContent);
      }
    });
  }
  pFileReaderAsText(file: any): any {
    return this._readerAsPromise(file, this.TEXT_CONSTANT);
  }
  getFile(files: any, fileType: string): any {
    return Array.from(files).find( (file: any) => {
      let fileExt = file.name.match(/\.[0-9a-z]+$/i);
      fileExt = fileExt ? fileExt[0] : '';
      return fileExt.toUpperCase() === fileType.toUpperCase();
    });
  }

  private xmlParser(xmlData): any {
    // xml prsing code here for getting the epsg code
    const parser = new xml2js.Parser({ strict: false, trim: true });
    parser.parseString(xmlData, (err, result) => {
      const obj: any[] = result;
      console.log(result, obj);
      if (this.commonService.isValid(obj)) {
        // this.printNode(obj, 'GROUNDOVERLAY');
        console.log('kml data', result.KML);
        (result.KML.DOCUMENT).forEach(documentData => {
          console.log('document data', documentData, documentData.FOLDER);
          (documentData.FOLDER).forEach(folderData => {
            console.log('folder data', folderData, folderData.GROUNDOVERLAY);
            (folderData.GROUNDOVERLAY).forEach(groundOverlayData => {
              console.log('groundOverlayData ', groundOverlayData, groundOverlayData.LATLONBOX);
              const extentVal = [
                parseFloat(groundOverlayData.LATLONBOX[0].WEST[0]),
                parseFloat(groundOverlayData.LATLONBOX[0].SOUTH[0]),
                parseFloat(groundOverlayData.LATLONBOX[0].EAST[0]),
                parseFloat(groundOverlayData.LATLONBOX[0].NORTH[0])
              ];
              let name = 'kml name';
              if (groundOverlayData.NAME === undefined) {
                name = 'groundOverLayData';
              } else {
                name = groundOverlayData.NAME[0];
              }
              const overlayData = {
                extent: extentVal,
                name,
                icon: groundOverlayData.ICON[0].HREF[0]
              };
              this.overlayDataArray.push(overlayData);
            });
          });
        });
        console.log('epsgCode checking ', this.imageExcelData);
      }
    });
  }
  private printNode(xml, key?): any {
    if (xml == null) {
        console.log(`Node is empty`);
        return;
    }

    if (Array.isArray(xml)) {
      return xml.forEach((v) => this.printNode(v, key));
    }

    if (typeof xml === 'object') {
      return Object.entries(xml).forEach(([key, v]) => this.printNode(v, key));
    }

    // console.log(`${key}:${xml}`);
    if (`${key}` === 'GROUNDOVERLAY') {
      this.imageExcelData = {
        name: `${xml}`,
        icon: `${xml.Icon}`
      };
      console.log('EPSG Code is ', `${key}`, `${xml}`, this.imageExcelData);
      return;
    }
  }
  private getProjDef(epsgCode): Observable<any> {
    return new Observable(observer => {
      let projdef = '+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118' +
    ' +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';
      fetch('https://epsg.io/?format=json&q=' + epsgCode.split(':')[1])
    .then((response) => {
      return response.json().then((jsonData) => {
      const results = jsonData.results;
      console.log('gettong proj4 result ', results);
      if (results && results.length > 0) {
        for (let i = 0, ii = results.length; i < ii; i++) {
          const result = results[i];
          if (result) {
            const code = result.code;
            const name = result.name;
            const proj4def = result.proj4;
            const bbox = result.bbox;
            if (proj4def && proj4def.length > 0) {
              console.log('find projedef ', proj4def);
              projdef = proj4def;
              observer.next(projdef);
              observer.complete();
              return;
            }
          }
        }
      } else {
        this.epsgCode = 'NO-EPSG';
        console.log('no result for epsg ', this.epsgCode);
      }
      observer.next(projdef);
      observer.complete();
      });
    });
    });
  }
  private getFirebaseUtil(file, overlayData): any {
    console.log('firebase url called');
    const firebaseUtil = new FirebaseUtil(this.firestorage);
    firebaseUtil.firebaseUtilCallback = (firebaseFileURL) => {
      // returnData.fileName = returnData.inputFiles.name;
      this.firebaseUrl = firebaseFileURL;
      console.log('what is firebase url inside settimeout ', this.firebaseUrl);
      if (this.firebaseUrl !== null && this.firebaseUrl !== undefined) {
        const extent = overlayData.extent;
        console.log('sending data to preview image ', extent, this.firebaseUrl);
        this.jpgImagePreviewPost(extent, this.firebaseUrl, 'xmlData');
      }
    };
    firebaseUtil.getFirebaseFileURL(file, 'jpg', 'returnData.metadata', this.progress);
  }
}
