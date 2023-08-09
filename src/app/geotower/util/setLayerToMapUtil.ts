import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML.js';
import ImageLayer from 'ol/layer/Image.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import { Observable, Subject } from 'rxjs';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import { BasemapService } from '../../basemap/basemap.service';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import * as xml2js from 'xml2js';
import { Fill, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { CommonService } from '../../Services/common.service';
import { AuthObservableService } from '../../Services/authObservableService';
// Here new lib for image rotation
import { addCoordinateTransforms } from 'ol/proj';
import { rotate } from 'ol/coordinate';
import { buffer, getCenter, getWidth } from 'ol/extent';
import { fromLonLat, transform, addProjection, getTransform } from 'ol/proj';
import { isConstructorDeclaration } from 'typescript';
import { fromArrayBuffer } from 'geotiff';
import GeoTIFF from 'ol/source';
import TileLayer from 'ol/layer';
// import {PDFExtract, PDFExtractOptions} from 'pdf.js-extract';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Circle } from 'ol/style.js';
import $ from 'jquery';
import { OnChanges, SimpleChanges } from '@angular/core';

export class SetLayerTOMapUtil {
  private basemapProjection;
  private basemap;
  private ZIP_EXTENSION_CONSTANT = '.zip';
  private KML_EXTENSION_CONSTANT = '.kml';
  private KMZ_EXTENSION_CONSTANT = '.kmz';
  private JPG_EXTENSION_CONSTANT = '.jpg';
  private TIF_EXTENSION_CONSTANT = '.tif';
  private PRJ_EXTENSION_CONSTANT = '.prj';
  private DBF_EXTENSION_CONSTANT = '.dbf';
  private GEOJSON_EXTENSION_CONSTANT = '.geojson';
  private JSON_EXTENSION_CONSTANT = '.json';
  private PNG_EXTENSION_CONSTANT = '.png';
  private ALERT_CONSTANT = 'alert';
  private TEXT_CONSTANT = 'text';
  private XLSX_EXTENSION_CONSTANT = '.xlsx';
  private PDF_EXTENSION_CONSTANT = '.pdf';
  private CSV_EXTENSION_CONSTANT = '.csv';
  fileName;
  private epsgCode = 'NO-EPSG';
  private alertComponent;
  private geotowerService;
  layerObj;
  Colors = [
    '#9400D3',
    '#4B0082',
    '#0000FF',
    '#00FF00',
    '#FFFF00',
    '#FF7F00',
    '#FF0000',
  ];
  /* Colors.names = {
    Violet: '#9400D3',
    Indigo: '#4B0082',
    Blue: '#0000FF',
    Green: '#00FF00',
    Yellow: '#FFFF00',
    Orange: '#FF7F00',
    Red: '#FF0000',
  }; */
  setcolor3 = '#9400D3';
  blobSource: any;
  imageExtent: any;

  constructor(
    private basemapService: BasemapService,
    private commonService: CommonService
  ) {
    this.basemap = this.basemapService.getCurrentBasemap();
    this.basemapProjection = this.basemap.getView().getProjection().code_;
  }

  public layerPreview(options): any {
    console.log('client obj is ', options);
    const filetype = options.layerObj.fileType;
    this.layerObj = options.layerObj;
    this.fileName = options.layerObj.name;
    this.alertComponent = options.geotower.alertComponent;
    this.geotowerService = options.geotower.geotowerService;
    if (filetype === this.ZIP_EXTENSION_CONSTANT) {
      this.shpLayerPreview(options.layerObj);
    } else if (
      filetype === this.KML_EXTENSION_CONSTANT ||
      filetype === this.KMZ_EXTENSION_CONSTANT
    ) {
      this.kmlImagePreview(this.layerObj.firebaseUrl);
    } 
    // else if (filetype === this.TIF_EXTENSION_CONSTANT) {
    //   this.tFFImagePreview(this.layerObj.firebaseUrl, this.layerObj.metadata);
    // }
     else if (
      filetype === this.JPG_EXTENSION_CONSTANT ||
      filetype === this.PNG_EXTENSION_CONSTANT
    ) {
      this.jpgImagePreview(this.layerObj.firebaseUrl, this.layerObj.metadata);
    } else if (
      filetype === this.GEOJSON_EXTENSION_CONSTANT ||
      filetype === this.JSON_EXTENSION_CONSTANT
    ) {
      this.previewGeoJosn_Json_Files_new(
        this.layerObj,
        options.layerObj.fileType
      );
    } else if (filetype === this.PDF_EXTENSION_CONSTANT) {
      this.preview_PDF_File(this.layerObj.firebaseUrl);
    } else if (
      filetype === this.XLSX_EXTENSION_CONSTANT ||
      filetype === this.CSV_EXTENSION_CONSTANT
    ) {
      this.preview_XLSX_CSV_File(this.layerObj);
    } else if (filetype === 'url') {
      console.log('its url type no need to add map, its already added');
      this.addLayerObjectsToTower();
    } else {
      this.shpLayerPreview(options.layerObj);
    }
  }

  // Here new code for shp layer adding to map
  private shpLayerPreview(layerObj): any {
    const geoJsonMapshaper = layerObj.metadata;
    if (geoJsonMapshaper.length > 0) {
      geoJsonMapshaper.forEach((jsonObj) => {
        this.setLayerToMap(jsonObj);
      });
    } else {
      this.setLayerToMap(geoJsonMapshaper);
    }
  }

  private setLayerToMap(geoJson): any {
    let isVisible = true;
    console.log('file name ', geoJson.fileName);
    if (
      geoJson.fileName === 'City_PopRanks' ||
      geoJson.fileName === 'County_PopRanks' ||
      geoJson.fileName === 'CollegeTowns' ||
      geoJson.fileName === 'StatewideShapes_IHE_Data' ||
      geoJson.fileName === 'CollocateSymbolData' ||
      geoJson.fileName === 'AlabamaCounties' ||
      geoJson.fileName === 'AlabamaStateOnly'
    ) {
      isVisible = false;
    }
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geoJson, {
        featureProjection: this.basemapProjection,
      }),
    });
    console.log(geoJson, vectorSource, 'veryimportant');
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)',
    });
    const stroke = new Stroke({
      // color: '#319FD3',
      color: this.randomRainbowColor(0, 6),
      width: 1,
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      visible: isVisible,
      /* style: this.getShapeStyle() */
      style: new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: 5,
        }),
        fill,
        stroke,
      }),
    });
    vectorLayer.set('name', geoJson.fileName);
    // vectorLayer.setStyle(vectorLayer.getStyle());
    vectorLayer.setOpacity(0.7);
    this.basemap.addLayer(vectorLayer);
    this.addLayerObjectsToTower();
    console.log(
      'getting the styles ',
      vectorLayer.getStyle().defaultStyles,
      vectorLayer.getStyleFunction()
    );
    // new code for zoom to extent
    if (
      geoJson.fileName === 'City_PopRanks' ||
      geoJson.fileName === 'County_PopRanks' ||
      geoJson.fileName === 'CollegeTowns' ||
      geoJson.fileName === 'StatewideShapes_IHE_Data' ||
      geoJson.fileName === 'CollocateSymbolData' ||
      geoJson.fileName === 'AlabamaCounties' ||
      geoJson.fileName === 'AlabamaStateOnly'
    ) {
    } else {
      this.basemap.getLayers().forEach((currentLayer) => {
        if (geoJson.fileName === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.basemap.getView().fit(extentValue);
          this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
        }
      });
    }
  }

  private setLayerToMap_StaticForPrototype(geoJson): any {
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)',
    });
    const stroke = new Stroke({
      // color: '#319FD3',
      color: this.randomRainbowColor(0, 6),
      width: 1,
    });
    const style = new Style({
      image: new CircleStyle({
        fill,
        stroke,
        radius: 5,
      }),
      fill,
      stroke,
    });
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geoJson, {
        featureProjection: this.basemapProjection,
      }),
    });
    vectorSource.getFeatures().forEach((feature) => {
      const r = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const g = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const b = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      const a = 0 + Math.floor(Math.random() * (255 - 0 + 1));
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            fill: new Fill({
              color: 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')',
            }),
            stroke,
            radius: 5,
          }),
          fill: new Fill({
            color: 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')',
          }),
          stroke,
        })
      );
    });
    console.log(vectorSource, vectorSource.getFeatures());
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      /* style: this.getShapeStyle() */
      /* style: new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: 5
        }),
        fill,
        stroke,
      }), */
    });
    const vector = new HeatmapLayer({
      source: new VectorSource({
        url: 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/.kml%2F1663110430690_2012_Earthquakes_Mag5.kml?alt=media&token=64c8ba78-0731-4ea8-9af8-88d9d97ef285',
        format: new KML({
          extractStyles: false,
        }),
        /* features: (new GeoJSON()).readFeatures(geoJson, {
          featureProjection: this.basemapProjection
        }) */
      }),
      blur: parseInt('5', 10),
      radius: parseInt('5', 10),
      weight: function (feature) {
        // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
        // standards-violating <magnitude> tag in each Placemark.  We extract it from
        // the Placemark's name instead.
        const name = feature.get('name');
        const magnitude = parseFloat(name.substr(2));
        return magnitude - 5;
      },
    });
    vectorLayer.set('name', geoJson.fileName);
    // vectorLayer.setStyle(vectorLayer.getStyle());
    vectorLayer.setOpacity(0.7);
    this.basemap.addLayer(vectorLayer);
    this.basemap.addLayer(vector);
    this.addLayerObjectsToTower();
    console.log(
      'getting the styles ',
      vectorLayer.getStyle().defaultStyles,
      vectorLayer.getStyleFunction()
    );
    // new code for zoom to extent
    this.basemap.getLayers().forEach((currentLayer) => {
      if (geoJson.fileName === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getExtent();
        this.basemap.getView().fit(extentValue);
        this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
      }
    });
  }
  // ----------------- end shp layer file adding to map
  // new code for adding kml/kmz file to map
  private kmlImagePreview(kmlURL): any {
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: kmlURL,
        format: new KML(),
        crossOrigin: 'anonymous',
      }),
    });
    vectorLayer.set('name', this.fileName);
    vectorLayer.setOpacity(0.7);
    this.basemap.addLayer(vectorLayer);
    // this.setUploadStatusInPercentage(80);
    this.addLayerObjectsToTower();
    setTimeout(() => {
      this.basemap.getLayers().forEach((currentLayer) => {
        if (this.fileName === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          console.log(
            'kml/kmz extend value is ',
            extentValue,
            currentLayer.values_.source
          );
          this.basemap.getView().fit(extentValue);
          // this.setUploadStatusInPercentage(100);
          this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
        }
      });
    }, 5000);

    /* const vector = new HeatmapLayer({
      source: new VectorSource({
        url: kmlURL,
        format: new KML({
          extractStyles: false,
        }),
      }),
      blur: parseInt('5', 10),
      radius: parseInt('5', 10),
      weight: function (feature) {
        // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
        // standards-violating <magnitude> tag in each Placemark.  We extract it from
        // the Placemark's name instead.
        const name = feature.get('name');
        const magnitude = parseFloat(name.substr(2));
        return magnitude - 5;
      },
    });
    this.basemap.addLayer(vector); */
  }
  // ----------------- end kml/kmz layer file adding to map
  // new code for adding jpeg/tiff file to map
  private _getImageDimension(image): Observable<any> {
    return new Observable((observer) => {
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

  // new method added for xml reding for getting epsg code
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
    if (`${key}` === 'LATESTWKID') {
      this.epsgCode = 'EPSG:' + `${xml}`;
      console.log('EPSG Code is ', `${key}`, `${xml}`, this.epsgCode);
      return;
    }
  }

  // new method added for projdef text getting from epsg.io
  private getProjDef(epsgCode): Observable<any> {
    return new Observable((observer) => {
      let projdef =
        '+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118' +
        ' +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';
      fetch('https://epsg.io/?format=json&q=' + epsgCode.split(':')[1]).then(
        (response) => {
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
        }
      );
      /* .then((json) => {
      const results = json.results;
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
    }); */
    });
  }
  private xmlParser(xmlData): any {
    // xml prsing code here for getting the epsg code
    const parser = new xml2js.Parser({ strict: false, trim: true });
    parser.parseString(xmlData, (err, result) => {
      const obj: any[] = result;
      console.log(result);
      if (this.commonService.isValid(obj)) {
        this.printNode(obj, 'LATESTWKID');
        console.log('epsgCode checking ', this.epsgCode);
      }
    });
  }

  private imgProjCoordinateSysCal(
    translationX,
    translationY,
    xScale,
    yScale,
    rotateConditionOne,
    rotateConditionTwo,
    imageData,
    jpgURL
  ): any {
    /* x1 = Ax + By + C
      y1 = Dx + Ey + F
      image-to-world transformation Calculation */
    this.getProjDef(this.epsgCode).subscribe((projdef) => {
      if (this.epsgCode === 'NO-EPSG') {
        const msg =
          'Sorry! Cannot add the file ' +
          this.fileName +
          ' due to unrecognized coordinate system.';
      }
      console.log(
        'projection def is ',
        projdef,
        jpgURL,
        imageData,
        xScale,
        yScale,
        this.epsgCode
      );
      proj4.defs(this.epsgCode, projdef);
      register(proj4);
      let imageExtent = transformExtent(
        [
          translationX,
          translationY + yScale * imageData.height,
          translationX + xScale * imageData.width,
          translationY,
        ],
        get(this.epsgCode),
        get(this.basemapProjection)
      );
      let imageExtentProjection = [
        translationX,
        translationY + yScale * imageData.height,
        translationX + xScale * imageData.width,
        translationY,
      ];
      // ------above working fine ------
      /* const imageExtent = transformExtent([translationX, translationY + (yScale * imageData.height),
          translationX + (xScale * imageData.width), translationY],
        get(this.epsgCode), get(this.basemapProjection));
        const imageExtentProjection = [translationX, translationY  + (yScale * imageData.height),
          translationX + (xScale * imageData.width), translationY]; */

      /* const mX1 = (xScale * 0) + (rotateConditionTwo * 0) + translationX;
        const mY1 = (rotateConditionOne * 0) + (yScale * 0) + translationY;
        const mX2 = (xScale * imageData.width) + (rotateConditionTwo * imageData.height) + translationX;
        const mY2 = (rotateConditionOne * imageData.width) + (yScale * imageData.height) + translationY; */
      /* const mX1 = parseFloat(((xScale * 0) + (rotateConditionTwo * 0) + translationX).toFixed(4));
        const mY1 = parseFloat(((rotateConditionOne * imageData.width) + (yScale * imageData.height) + translationY).toFixed(4));
        const mX2 = parseFloat(((xScale * imageData.width) + (rotateConditionTwo * imageData.height) + translationX).toFixed(4));
        const mY2 = parseFloat(((rotateConditionOne * 0) + (yScale * 0) + translationY).toFixed(4));
        const imageExtentProjection = [mX1, mY2, mX2, mY1];
        let imageExtent = transformExtent(imageExtentProjection, 
          get(this.epsgCode), get(this.basemapProjection)); */
      // imageExtentProjection = [-117.19920039368107,33.54801166329121,-117.19650585449564,33.54850946796737];
      let isSingleImage = false;
      if (translationX === '0' && translationY === '0') {
        imageExtent = imageExtent;
        imageExtentProjection = imageExtent;
        isSingleImage = true;
      }

      this.imagePreviewProcess(
        imageExtent,
        imageExtentProjection,
        imageData,
        rotateConditionOne,
        rotateConditionTwo,
        isSingleImage
      );
    });
  }

  private jpgImagePreview(jpgURL, metadata): any {
    const image = {
      url: jpgURL,
    };
    console.log(jpgURL);
    console.log(metadata);
    let jgwxData = metadata.geodata;
    const xmlData = metadata.xmldata;
    this.xmlParser(xmlData);
    this._getImageDimension(image).subscribe((imageData) => {
      let xScale;
      let yScale;
      let translationX;
      let translationY;
      let rotateConditionOne;
      let rotateConditionTwo;
      if (this.commonService.isValid(jgwxData)) {
        console.log('VALID jgwxData : ', jgwxData);
        jgwxData = jgwxData.split('\n');
        xScale = +jgwxData[0];
        rotateConditionOne = +jgwxData[1];
        rotateConditionTwo = +jgwxData[2];
        yScale = +jgwxData[3];
        translationX = +jgwxData[4];
        translationY = +jgwxData[5];
      } else {
        console.log('INVALID jgwxData : ', jgwxData);
        xScale = '1';
        yScale = '1';
        translationX = '0';
        translationY = '0';
        rotateConditionOne = '0';
        rotateConditionTwo = '0';
        // const msg = 'Cannot add ' + this.fileName + ' file due to unrecognized coordinate system. Please check your data';
        const msg =
          'Sorry! Cannot add the file ' +
          this.fileName +
          ' due to unrecognized coordinate system.';
        // this._getAlertMessage(this.alertComponent, msg);
        // return;
      }

      // ADDING THIS TO SUPPORT ONLY IMAGE TO LOAD ON MAP
      if (this.epsgCode === 'NO-EPSG') {
        console.log('INVALID epsg : ', jgwxData);
        xScale = '1';
        yScale = '1';
        translationX = '0';
        translationY = '0';
        rotateConditionOne = '0';
        rotateConditionTwo = '0';
        this.epsgCode = this.basemapService.projection3857Code;
      }

      const extent = this.imgProjCoordinateSysCal(
        translationX,
        translationY,
        xScale,
        yScale,
        rotateConditionOne,
        rotateConditionTwo,
        imageData,
        jpgURL
      );
    });
  }

  private imagePreviewProcess(
    imageExtent,
    imageExtentProjection,
    imageData,
    rotateConditionOne,
    rotateConditionTwo,
    isSingleImage
  ): any {
    console.log('Data is ', imageExtent, imageExtentProjection);
    // imageExtent = [imageExtent[1], imageExtent[0], imageExtent[3], imageExtent[2]];
    // imageExtentProjection = [imageExtentProjection[1], imageExtentProjection[0], imageExtentProjection[3], imageExtentProjection[2]];
    const imageProjection = new Projection({
      code: 'orto-image',
      units: 'pixels',
      extent: buffer(imageExtent, 512),
    });
    const imageProjectionNew = this.returnRotateProjection(
      this.epsgCode,
      -(rotateConditionOne + rotateConditionTwo),
      imageExtentProjection
    );
    const imageSource = new Static({
      url: imageData.url,
      // projection: imageProjectionNew,
      Projection: isSingleImage === true ? imageProjection : imageProjectionNew,
      imageExtent: imageExtentProjection,
      imageSize: [imageData.width, imageData.height],
      imageSmoothing: true,
      imageLoadFunction: (image) => {
        image.getImage().src = imageData.url;
        console.log(
          'image resolution is ',
          image.resolution,
          getWidth(image.extent),
          image.image_.width
        );
        if (image.resolution === undefined) {
          // image.resolution = (image.extent[3] - image.extent[1]) / image.image_.height;
          image.resolution = getWidth(image.extent) / image.image_.width;
        }
        console.log(
          'image resolution-2 is ',
          image.resolution,
          imageData.width,
          image.image_
        );
        image.state = 2; // ImageState.LOADED;
        image.unlistenImage_();
        image.changed();
      },
    });
    const imagLayer = new ImageLayer({
      className: 'clipped',
      source: imageSource,
    });
    console.log(imagLayer);
    imagLayer.set('name', this.fileName);
    imagLayer.set('type', 'IMAGE');
    // imagLayer.setZIndex(1);
    imagLayer.setOpacity(0.7);
    this.basemap.addLayer(imagLayer);
    this.addLayerObjectsToTower();
    this.basemap.getLayers().forEach((currentLayer) => {
      if (this.fileName === currentLayer.values_.name) {
        console.log(
          'image layer is ',
          currentLayer,
          imagLayer,
          currentLayer.values_.source
        );
        const extentValue = currentLayer.values_.source.getImageExtent();
        console.log('what is ectent value ', extentValue, imageExtent);
        // this.basemap.values_.view.setCenter(imageExtent);
        this.basemap.getView().fit(imageExtent);
        /* if(extentValue === undefined) {
          this.basemap.getView().fit(extent);
        } */
      }
    });
    // this.setUploadStatusInPercentage(90);

    /* setTimeout(() => {
      // this.setUploadStatusInPercentage(100);
    }, 1000); */
  }
  // ------------------------ ending jpeg/tiff file adding to map
  private _getAlertMessage(alertComponent, alertMessage): any {
    const alert = alertComponent;
    alert.setAlertMessage(alertMessage);
    // this.removeLayerFromClientList();
  }
  private removeLayerFromClientList(): any {
    this.geotowerService.clientObjList.forEach((obj, index) => {
      if (obj.name === this.fileName) {
        this.geotowerService.clientObjList.splice(index, 1);
      }
    });
    this.geotowerService.geotowerLayersList.forEach((obj, index) => {
      if (obj.name === this.fileName) {
        this.geotowerService.geotowerLayersList.splice(index, 1);
      }
    });
  }
  // this code for adding Layer obj after showing the layer on map..
  private addLayerObjectsToTower(): any {
    this.geotowerService.clientObjList.push(this.layerObj);
    this.geotowerService.geotowerLayersList.push(this.layerObj);
  }
  private randomRainbowColor(min, max): any {
    return this.setcolor3;
  }
  // Here New code for rotation image raster
  returnRotateProjection(projection, angle, extent): any {
    // extent = [extent[1], extent[0], extent[3], extent[2]];
    function rotateCoordinate(coordinate, angle, anchor) {
      var coord = rotate(
        [coordinate[0] - anchor[0], coordinate[1] - anchor[1]],
        angle
      );
      return [coord[0] + anchor[0], coord[1] + anchor[1]];
    }
    function rotateTransform(coordinate) {
      return rotateCoordinate(coordinate, angle, getCenter(extent));
    }
    function normalTransform(coordinate) {
      return rotateCoordinate(coordinate, -angle, getCenter(extent));
    }
    var normalProjection = get(projection);
    var rotatedProjection = new Projection({
      code:
        normalProjection.getCode() +
        ':' +
        angle.toString() +
        ':' +
        extent.toString(),
      units: normalProjection.getUnits(),
      extent: extent,
    });
    addProjection(rotatedProjection);
    addCoordinateTransforms(
      projection,
      rotatedProjection,
      rotateTransform,
      normalTransform
    );
    addCoordinateTransforms(
      'EPSG:4326',
      rotatedProjection,
      function (coordinate) {
        console.log(coordinate, extent);
        return rotateTransform(transform(coordinate, 'EPSG:4326', projection));
      },
      function (coordinate) {
        return transform(normalTransform(coordinate), projection, 'EPSG:4326');
      }
    );
    addCoordinateTransforms(
      'EPSG:3857',
      rotatedProjection,
      function (coordinate) {
        return rotateTransform(transform(coordinate, 'EPSG:3857', projection));
      },
      function (coordinate) {
        return transform(normalTransform(coordinate), projection, 'EPSG:3857');
      }
    );
    if (typeof proj4 !== 'undefined') {
      const projCodes = Object.keys(proj4.defs);
      projCodes.forEach((code) => {
        const proj4Projection = get(code);
        console.log(
          'Condition for getTrnas?: ',
          code,
          getTransform(proj4Projection, rotatedProjection)
        );
        if (!getTransform(proj4Projection, rotatedProjection)) {
          console.log(
            'which projection doing trans: ',
            proj4Projection,
            rotatedProjection
          );
          addCoordinateTransforms(
            proj4Projection,
            rotatedProjection,
            (coordinate) => {
              return rotateTransform(
                transform(coordinate, proj4Projection, projection)
              );
            },
            (coordinate) => {
              return transform(
                normalTransform(coordinate),
                projection,
                proj4Projection
              );
            }
          );
        }
      });
    }
    return rotatedProjection;
  }

  // tFFImagePreview(jpgURL, metadata) :any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //   .then((response) => {
  //     return response.arrayBuffer();
  //   })
  //   .then((arrayBuffer) => {
  //     return fromArrayBuffer(arrayBuffer);
  //   })
  //   .then((tiff) => {
  //     return tiff.getImage();
  //   })
  //   .then((image) => {
  //     width = image.getWidth();
  //     height = image.getHeight();
  //     extent = image.getBoundingBox();
  //     const rg = image.readRGB();
  //     console.log('what i am getting here?? ', rg, extent, image.geoKeys, image)
  //     epsg = this.processGetTiffEpsg(image);
  //     isTiffHaveProjection = false;
  //     if(image.geoKeys !== null) {
  //       isTiffHaveProjection = true;
  //     }
  //     return image;
  //   })
  //   .then((image) => {
  //     const rgb = image.readRGB();
  //     const canvas = document.createElement("canvas");
  //     canvas.width = width;
  //     canvas.height = height;
  //     const context = canvas.getContext("2d");
  //     const data = context.getImageData(0, 0, width, height);
  //     console.log('what is data, ', data, rgb, epsg, this.epsgCode, image.source, image.source.arrayBuffer);
  //     var byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //     let rgba = data.data;
  //     console.log(byteArray, rgba)
  //     let j = 0;
  //     let shift = 0;
  //     if (rgb instanceof Uint16Array) {
  //       shift = 8;
  //     }
  //     console.log('start time ', new Date().getTime())
  //     for (let i = 0; i < byteArray.length; i += 3) {
  //       rgba[j] = byteArray[i] as number;
  //       rgba[j + 1] = byteArray[i + 1] as number;
  //       rgba[j + 2] = byteArray[i + 2] as number;
  //       rgba[j + 3] = byteArray[i + 3] as number;
  //       j += 4;
  //     }
  //     console.log(byteArray, rgba)
  //     let newExtent = transformExtent(extent, get(this.epsgCode), get(this.basemapProjection));
  //     if(!isTiffHaveProjection) {
  //       newExtent = extent;
  //     }
  //     setTimeout(() => {
  //     console.log('end time ', new Date().getTime(), rgba, data)
  //     context.putImageData(data, 0, 0);

  //     this.basemap.addLayer(
  //       new ImageLayer({
  //         source: new Static({
  //           url: canvas.toDataURL(),
  //           imageExtent: newExtent,
  //         }),
  //         name: this.fileName,
  //       })
  //     );
  //     console.log('Final time ', new Date().getTime(), this.basemap.getLayers())
  //     this.basemap.getView().fit(newExtent);
  //     this.addLayerObjectsToTower();

  //   }, 1000);
  //   }).catch((error) => {
  //     console.log(error);
  //     alert(error);
  //   });
  // }
  // tFFImagePreview(jpgURL, metadata): any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //     .then((response) => {
  //       return response.arrayBuffer();
  //     })
  //     .then((arrayBuffer) => {
  //       return fromArrayBuffer(arrayBuffer);
  //     })
  //     .then((tiff) => {
  //       return tiff.getImage();
  //     })
  //     .then((image) => {
  //       width = image.getWidth();
  //       height = image.getHeight();
  //       extent = image.getBoundingBox();
  //       epsg = this.processGetTiffEpsg(image);
  //       isTiffHaveProjection = false;
  //       if (image.geoKeys !== null) {
  //         isTiffHaveProjection = true;
  //       }
  //       return image;
  //     })
  //     .then((image) => {
  //       const canvas = document.createElement("canvas");
  //       canvas.width = width;
  //       canvas.height = height;
  //       const context = canvas.getContext("2d");

  //       // Read the elevation values from the DEM layer
  //       image.readRasters({ samples: [0] }).then((rasters) => {
  //         const elevation = rasters[0];
  //         console.log("Elevation values:", elevation);
  //         const data = context.getImageData(0, 0, width, height);
  //         const rgba = data.data;

  //         let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //         let j = 0;
  //         let shift = 0;
  //         if (rgba instanceof Uint16Array) {
  //           shift = 8;
  //         }
  //         for (let i = 0; i < byteArray.length; i += 3) {
  //           rgba[j] = byteArray[i] as number;
  //           rgba[j + 1] = byteArray[i + 1] as number;
  //           rgba[j + 2] = byteArray[i + 2] as number;
  //           rgba[j + 3] = byteArray[i + 3] as number;
  //           j += 4;
  //         }

  //         let newExtent = transformExtent(extent, get(this.epsgCode), get(this.basemapProjection));
  //         if (!isTiffHaveProjection) {
  //           newExtent = extent;
  //         }
  //         setTimeout(() => {
  //           context.putImageData(data, 0, 0);

  //           this.basemap.addLayer(
  //             new ImageLayer({
  //               source: new Static({
  //                 url: canvas.toDataURL(),
  //                 imageExtent: newExtent,
  //               }),
  //               name: this.fileName,
  //             })
  //           );
  //           this.basemap.getView().fit(newExtent);
  //           this.addLayerObjectsToTower();
  //         }, 1000);
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       alert(error);
  //     });
  // }

  // tFFImagePreview(jpgURL, metadata): any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //     .then((response) => {
  //       return response.arrayBuffer();
  //     })
  //     .then((arrayBuffer) => {
  //       return fromArrayBuffer(arrayBuffer);
  //     })
  //     .then((tiff) => {
  //       return tiff.getImage();
  //     })
  //     .then((image) => {
  //       width = image.getWidth();
  //       height = image.getHeight();
  //       extent = image.getBoundingBox();
  //       epsg = this.processGetTiffEpsg(image);
  //       isTiffHaveProjection = false;
  //       if (image.geoKeys !== null) {
  //         isTiffHaveProjection = true;
  //       }
  //       return image;
  //     })
  //     .then((image) => {
  //       const canvas = document.createElement("canvas");
  //       const tileWidth = image.getTileWidth();
  //       const tileHeight = image.getTileHeight();
  //       canvas.width = tileWidth;
  //       canvas.height = tileHeight;
  //       const context = canvas.getContext("2d");

  //       // Read the elevation values from the DEM layer
  //       image.readRasters({ samples: [0] }).then((rasters) => {
  //         const elevation = rasters[0];
  //         console.log("Elevation values:", elevation);
  //         const data = context.getImageData(0, 0, tileWidth, tileHeight);
  //         const rgba = data.data;

  //         let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //         let j = 0;
  //         let shift = 0;
  //         if (rgba instanceof Uint16Array) {
  //           shift = 8;
  //         }
  //         for (let i = 0; i < byteArray.length; i += 3) {
  //           rgba[j] = byteArray[i] as number;
  //           rgba[j + 1] = byteArray[i + 1] as number;
  //           rgba[j + 2] = byteArray[i + 2] as number;
  //           rgba[j + 3] = byteArray[i + 3] as number;
  //           j += 4;
  //         }

  //         let newExtent = transformExtent(extent, get(this.epsgCode), get(this.basemapProjection));
  //         if (!isTiffHaveProjection) {
  //           newExtent = extent;
  //         }
  //         setTimeout(() => {
  //           context.putImageData(data, 0, 0);

  //           this.basemap.addLayer(
  //             new ImageLayer({
  //               source: new Static({
  //                 url: canvas.toDataURL(),
  //                 imageExtent: newExtent,
  //               }),
  //               name: this.fileName,
  //             })
  //           );
  //           this.basemap.getView().fit(newExtent);
  //           this.addLayerObjectsToTower();

  //           // Add event listener for left click
  //           canvas.addEventListener("mousedown", (event) => {
  //             const x = event.offsetX;
  //             const y = event.offsetY;
  //             const col = Math.floor(x / image.getTileSize());
  //             const row = Math.floor(y / image.getTileSize());
  //             const elevationValue = elevation[row * width + col];
  //             console.log("Clicked elevation value:", elevationValue);
  //             // You can do whatever you want with the elevation value here
  //           });
  //         }, 1000);
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       alert(error);
  //     });
  // }

  // tFFImagePreview(jpgURL, metadata): any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //     .then((response) => {
  //       return response.arrayBuffer();
  //     })
  //     .then((arrayBuffer) => {
  //       return fromArrayBuffer(arrayBuffer);
  //     })
  //     .then((tiff) => {
  //       return tiff.getImage();
  //     })
  //     .then((image) => {
  //       width = image.getWidth();
  //       height = image.getHeight();
  //       extent = image.getBoundingBox();
  //       epsg = this.processGetTiffEpsg(image);
  //       isTiffHaveProjection = false;
  //       if (image.geoKeys !== null) {
  //         isTiffHaveProjection = true;
  //       }
  //       return image;
  //     })
  //     .then((image) => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = width;
  //       canvas.height = height;
  //       const context = canvas.getContext('2d');
  //       // Read the elevation values from the DEM layer
  //       image.readRasters({ samples: [0] }).then((rasters) => {
  //         const elevation = rasters[0];
  //         console.log('Elevation values:', elevation);
  //         // Add a mouse click event listener to the canvas
  //         canvas.addEventListener('click', (event) => {
  //           const x = event.offsetX;
  //           const y = event.offsetY;
  //           //const elevationValue = elevation[y * width + x];
  //           const elevationValue = elevation[x * height + y];
  //           console.log('Clicked elevation value:', elevationValue);
  //         });
  //         const data = context.getImageData(0, 0, width, height);
  //         const rgba = data.data;
  //         let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //         let j = 0;
  //         let shift = 0;
  //         if (rgba instanceof Uint16Array) {
  //           shift = 8;
  //         }
  //         for (let i = 0; i < byteArray.length; i += 3) {
  //           rgba[j] = byteArray[i] as number;
  //           rgba[j + 1] = byteArray[i + 1] as number;
  //           rgba[j + 2] = byteArray[i + 2] as number;
  //           rgba[j + 3] = byteArray[i + 3] as number;
  //           j += 4;
  //         }
  //         let newExtent = transformExtent(
  //           extent,
  //           get(this.epsgCode),
  //           get(this.basemapProjection)
  //         );
  //         if (!isTiffHaveProjection) {
  //           newExtent = extent;
  //         }
  //         setTimeout(() => {
  //           context.putImageData(data, 0, 0);
  //           const tileSize = [image.getTileWidth, image.getTileHeight];
  //           this.basemap.addLayer(
  //             new ImageLayer({
  //               source: new Static({
  //                 url: canvas.toDataURL(),
  //                 imageExtent: newExtent,
  //                 tileSize: tileSize,
  //               }),
  //               name: this.fileName,
  //             })
  //           );
  //           this.basemap.getView().fit(newExtent);
  //           this.addLayerObjectsToTower();
  //         }, 1000);
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       alert(error);
  //     });
  // }

  // tFFImagePreview(jpgURL, metadata): any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //     .then((response) => {
  //       return response.arrayBuffer();
  //     })
  //     .then((arrayBuffer) => {
  //       return fromArrayBuffer(arrayBuffer);
  //     })
  //     .then((tiff) => {
  //       return tiff.getImage();
  //     })
  //     .then((image) => {
  //       width = image.getWidth();
  //       height = image.getHeight();
  //       extent = image.getBoundingBox();
  //       epsg = this.processGetTiffEpsg(image);
  //       isTiffHaveProjection = false;
  //       if (image.geoKeys !== null) {
  //         isTiffHaveProjection = true;
  //       }
  //       return image;
  //     })
  //     .then((image) => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = width;
  //       canvas.height = height;
  //       const context = canvas.getContext('2d');

  //       // Read the elevation values from the DEM layer
  //       image.readRasters({ samples: [0] }).then((rasters) => {
  //         const elevation = rasters[0];
  //         console.log('Elevation values:', elevation);
  //         const data = context.getImageData(0, 0, width, height);
  //         const rgba = data.data;
  //         let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //         let j = 0;
  //         let shift = 0;
  //         if (rgba instanceof Uint16Array) {
  //           shift = 8;
  //         }
  //         for (let i = 0; i < byteArray.length; i += 3) {
  //           rgba[j] = byteArray[i] as number;
  //           rgba[j + 1] = byteArray[i + 1] as number;
  //           rgba[j + 2] = byteArray[i + 2] as number;
  //           rgba[j + 3] = byteArray[i + 3] as number;
  //           j += 4;
  //         }
  //         let newExtent = transformExtent(
  //           extent,
  //           get(this.epsgCode),
  //           get(this.basemapProjection)
  //         );
  //         if (!isTiffHaveProjection) {
  //           newExtent = extent;
  //         }
  //         setTimeout(() => {
  //           context.putImageData(data, 0, 0);
  //           const tileSize = [image.getTileWidth, image.getTileHeight];
  //           this.basemap.addLayer(
  //             new ImageLayer({
  //               source: new Static({
  //                 url: canvas.toDataURL(),
  //                 imageExtent: newExtent,
  //                 tileSize: tileSize,
  //               }),
  //               name: this.fileName,
  //             })
  //           );
  //           this.basemap.getView().fit(newExtent);
  //           this.addLayerObjectsToTower();
  //         }, 1000);
  //       });
  //             // Add a mouse click event listener to the canvas
  //             canvas.addEventListener('click', (event) => {
  //               const x = event.offsetX;
  //               const y = event.offsetY;
  //               image.readRasters({ samples: [0], bbox: [x, y, x + 1, y + 1] }).then((rasters) => {
  //                 const elevationValue = rasters[0][0];
  //                 console.log('Clicked elevation value:', elevationValue);
  //               });
  //             });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       alert(error);
  //     });
  // }

  // tFFImagePreview(jpgURL, metadata): any {
  //   let width, height, extent, epsg, isTiffHaveProjection;

  //   fetch(jpgURL)
  //     .then((response) => {
  //       return response.arrayBuffer();
  //     })
  //     .then((arrayBuffer) => {
  //       return fromArrayBuffer(arrayBuffer);
  //     })
  //     .then((tiff) => {
  //       return tiff.getImage();
  //     })
  //     .then((image) => {
  //       width = image.getWidth();
  //       height = image.getHeight();
  //       extent = image.getBoundingBox();
  //       epsg = this.processGetTiffEpsg(image);
  //       isTiffHaveProjection = false;
  //       if (image.geoKeys !== null) {
  //         isTiffHaveProjection = true;
  //       }
  //       return image;
  //     })
  //     .then((image) => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = width;
  //       canvas.height = height;
  //       const context = canvas.getContext('2d');

  //       // Add a mouse click event listener to the canvas
  //       canvas.addEventListener('click', (event) => {
  //         const x = event.offsetX;
  //         const y = event.offsetY;
  //         const data = context.getImageData(x, y, 1, 1).data;
  //         const elevationValue = (data[0] << 16) | (data[1] << 8) | data[2]; // Combine RGB values to get a single elevation value
  //         console.log('Clicked elevation value:', elevationValue);
  //       });

  //       // Read the elevation values from the DEM layer
  //       image.readRasters({ samples: [0] }).then((rasters) => {
  //         const elevation = rasters[0];
  //         console.log('Elevation values:', elevation);
  //         const rgba = context.createImageData(width, height);
  //         let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
  //         let j = 0;
  //         let shift = 0;
  //         if (rgba instanceof Uint16Array) {
  //           shift = 8;
  //         }
  //         for (let i = 0; i < byteArray.length; i += 3) {
  //           rgba.data[j] = byteArray[i] as number;
  //           rgba.data[j + 1] = byteArray[i + 1] as number;
  //           rgba.data[j + 2] = byteArray[i + 2] as number;
  //           rgba.data[j + 3] = byteArray[i + 3] as number;
  //           j += 4;
  //         }
  //         let newExtent = transformExtent(
  //           extent,
  //           get(this.epsgCode),
  //           get(this.basemapProjection)
  //         );
  //         if (!isTiffHaveProjection) {
  //           newExtent = extent;
  //         }
  //         setTimeout(() => {
  //           context.putImageData(rgba, 0, 0);
  //           const tileSize = [image.getTileWidth, image.getTileHeight];
  //           this.basemap.addLayer(
  //             new ImageLayer({
  //               source: new Static({
  //                 url: canvas.toDataURL(),
  //                 imageExtent: newExtent,
  //                 tileSize: tileSize,
  //               }),
  //               name: this.fileName,
  //             })
  //           );
  //           this.basemap.getView().fit(newExtent);
  //           this.addLayerObjectsToTower();
  //         }, 1000);
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       alert(error);
  //     });
  // }

//   tFFImagePreview(jpgURL, metadata): any {
//     let width, height, extent, epsg, isTiffHaveProjection;

//     fetch(jpgURL)
//       .then((response) => {
//         return response.arrayBuffer();
//       })
//       .then((arrayBuffer) => {
//         return fromArrayBuffer(arrayBuffer);
//       })
//       .then((tiff) => {
//         return tiff.getImage();
//       })
//       .then((image) => {
//         width = image.getWidth();
//         height = image.getHeight();
//         extent = image.getBoundingBox();
//         epsg = this.processGetTiffEpsg(image);
//         isTiffHaveProjection = false;
//         if (image.geoKeys !== null) {
//           isTiffHaveProjection = true;
//         }
//         return image;
//       })
//       .then((image) => {
//         const canvas = document.createElement('canvas');
//         canvas.width = width;
//         canvas.height = height;
//         const context = canvas.getContext('2d');
//         // Add a mouse click event listener to the canvas
// canvas.addEventListener('click', (event) => {
//   const x = event.offsetX;
//   const y = event.offsetY;
//   const data = context.getImageData(x, y, 1, 1).data;
//   console.log('Clicked RGB values:', data[0], data[1], data[2]);
// });
//         // Read the elevation values from the DEM layer
//         image.readRasters({ samples: [0] }).then((rasters) => {
//           const elevation = rasters[0];
//           console.log('Elevation values:', elevation);
//           const rgba = context.createImageData(width, height);
//           let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
//           let j = 0;
//           let shift = 0;
//           if (rgba instanceof Uint16Array) {
//             shift = 8;
//           }
//           for (let i = 0; i < byteArray.length; i += 3) {
//             rgba.data[j] = byteArray[i] as number;
//             rgba.data[j + 1] = byteArray[i + 1] as number;
//             rgba.data[j + 2] = byteArray[i + 2] as number;
//             rgba.data[j + 3] = byteArray[i + 3] as number;
//             j += 4;
//           }
//           let newExtent = transformExtent(
//             extent,
//             get(this.epsgCode),
//             get(this.basemapProjection)
//           );
//           if (!isTiffHaveProjection) {
//             newExtent = extent;
//           }
//           setTimeout(() => {
//             context.putImageData(rgba, 0, 0);
//             const tileSize = [image.getTileWidth, image.getTileHeight];
//             this.basemap.addLayer(
//               new ImageLayer({
//                 source: new Static({
//                   url: canvas.toDataURL(),
//                   imageExtent: newExtent,
//                   tileSize: tileSize,
//                 }),
//                 name: this.fileName,
//               })
//             );
//             this.basemap.getView().fit(newExtent);
//             this.addLayerObjectsToTower();
//           }, 1000);
//         });
//         // Add a mouse click event listener to the canvas
//         // canvas.addEventListener('click', (event) => {
//         //   const x = event.offsetX;
//         //   const y = event.offsetY;
//         //   const data = context.getImageData(x, y, 1, 1).data;
//         //   const r = data[0];
//         //   const g = data[1];
//         //   const b = data[2];
//         //   const elevationValue = r * 256 * 256 + g * 256 + b - 32768;
//         //   console.log('Clicked elevation value:', data);
//         // });
//       })
//       .catch((error) => {
//         console.log(error);
//         alert(error);
//       });
//   }

// tFFImagePreview(jpgURL, metadata): any {
//   let width, height, extent, epsg, isTiffHaveProjection;

//   // jpgURL = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif"

//   console.log(extent, jpgURL, 'extent');
//   fetch(jpgURL)
//     .then((response) => response.blob())
//     .then((blob) => {
//       const blobSource = new GeoTIFF({
//         sources: [
//           {
//             blob: blob,
//           },
//         ],
//       });
//       this.blobSource = blobSource
//       console.log(this.blobSource,blobSource, 'blob');
//       const tiffsource = new GeoTIFF({
//         sources: [
//           {
//             url: jpgURL,
//           },
//         ],
//         wrapX: true,
//       });
//       const tiffLayer = new TileLayer({
//         source: tiffsource,
//       });
//       this.basemap.addLayer(tiffLayer);
  
//       this.addLayerObjectsToTower();
//       this.tiffForSlopeFinder(this.blobSource, jpgURL)
//     });


// }
// tiffForSlopeFinder(blobSource, jpgURL){
//   let width, height, extent, epsg, isTiffHaveProjection;

//     console.log(blobSource, 'blob2');

//     console.log(this.imageExtent, 'imageextent');


//     fetch(jpgURL)
//       .then((response) => {
//         console.log(response, 'response')
//         return response.arrayBuffer();
//       })
//       .then((arrayBuffer) => {
//         return fromArrayBuffer(arrayBuffer);
//       })
//       .then((tiff) => {
//         return tiff.getImage();
//       })
//       .then((image) => {
//         width = image.getWidth();
//         height = image.getHeight();
//         extent = image.getBoundingBox();
//         epsg = this.processGetTiffEpsg(image);
//         console.log(image.readRasters, extent, 'image');
//         isTiffHaveProjection = false;
//         if (image.geoKeys !== null) {
//           isTiffHaveProjection = true;
//         }
//         return image;
//       })

//       .then((image) => {
//         console.log(image, extent, 'image');
//         const canvas = document.createElement('canvas');
//         canvas.width = width;
//         canvas.height = height;

//         // Read the elevation values from the DEM layer
//         image.readRasters({ samples: [0] }).then((rasters) => {
//           const elevation = rasters[0];
//           console.log('Elevation values:', elevation, extent);

//           // extent of the tiff file and assigning them to the values
//           const coordinateArray = [];
//           const xmin = extent[0];
//           const ymin = extent[1];
//           const xmax = extent[2];
//           const ymax = extent[3];

//           // Get the number of rows and columns in the image
//           const numRows = height;
//           const numCols = width;

//           console.log(numRows, numCols, 'height and width')
//           // Calculate the step size for latitude and longitude
//           const cellSize = (ymax - ymin) / (numRows - 1); // cell size
//           const stepLon = (xmax - xmin) / (numCols - 1);
//           console.log(cellSize, stepLon, 'steplat and steplan size');

//           const stepLat1 = (ymax - ymin) / (numRows + 1); // cell size
//           const stepLon2 = (xmax - xmin) / (numCols + 1);
//           console.log(stepLat1, stepLon2, 'steplat and steplan size 2');

//           // Loop through each pixel and calculate the corresponding coordinate
//           for (let row = 0; row < numRows; row++) {
//             for (let col = 0; col < numCols; col++) {
//               const lat = ymax - cellSize * row;
//               const lon = xmin + stepLon * col;
//               coordinateArray.push({ lat, lon });
//               // Now you have the latitude (lat) and longitude (lon) for each pixel in the TIFF image
//               // You can use these coordinates as needed for your application
//               console.log('Coordinate at row', row, 'column', col, ':', lat, lon);
//             }
//           }
//           // calculating LLC and TRC from the extent
//           const LLC = [extent[0], extent[1]]
//           const TRC = [extent[2], extent[3]]
//           console.log(LLC, TRC, 'lowerleft and topright corner')

//           console.log('Coordinate ', coordinateArray);
//           const projectionEPSG = blobSource.projection
//           // Object data to be sent to slope finder tool
//           var farmingObj = { cellSize, elevation, coordinateArray, LLC, TRC, projectionEPSG, };
//           console.log(blobSource.projection, 'blob projection')

//           // Allowing the object only if it satisfies eligibility criteria
//           if((blobSource.projection!= null || undefined) && (blobSource.tileGrid.extent_!= null || undefined) && (image.readRasters != null || undefined)){
//             this.commonService.slopefinderPreview(farmingObj)
//             console.log(farmingObj, 'farming object');
//           }

//           // const rgba = context.createImageData(width, height);
//     //       let byteArray = new Uint8ClampedArray(image.source.arrayBuffer);
//     //       let j = 0;
//     //       let shift = 0;
//     //       if (rgba instanceof Uint16Array) {
//     //         shift = 8;
//     //       }
//     //       for (let i = 0; i < byteArray.length; i += 3) {
//     //         rgba.data[j] = byteArray[i] as number;
//     //         rgba.data[j + 1] = byteArray[i + 1] as number;
//     //         rgba.data[j + 2] = byteArray[i + 2] as number;
//     //         rgba.data[j + 3] = byteArray[i + 3] as number;
//     //         j += 4;
//     //       }
//     //       let newExtent = transformExtent(
//     //         extent,
//     //         get(this.epsgCode),
//     //         get(this.basemapProjection)
//     //       );
//     //       if (!isTiffHaveProjection) {
//     //         newExtent = extent;
//     //       }
//         });
//       });
//     this.basemap.getView().fit(extent);
// }



  async processGetTiffEpsg(image) {
    let code = 4326;
    let epsg = `EPSG:${code}`;
    if (image.geoKeys !== null) {
      code =
        image.geoKeys.ProjectedCSTypeGeoKey ||
        image.geoKeys.GeographicTypeGeoKey;
      epsg = `EPSG:${code}`;
      if (!proj4.defs(epsg)) {
        const response = await fetch(`//epsg.io/${code}.proj4`);
        proj4.defs(epsg, await response.text());
      }
    }
    this.epsgCode = 'EPSG:' + code;
    return epsg;
  }

  private previewGeoJosn_Json_Files_new(layerObj, fileType): any {
    const tempThis = this;
    console.log(layerObj);
    $.getJSON(layerObj.firebaseUrl, function (data) {
      console.log('state data is ', data);
      tempThis.previewGeoJosn_Json_Files(data, fileType);
    });
  }

  private previewGeoJosn_Json_Files(metadata, fileType): any {
    // let geojson_json_Data = metadata.geodata;
    let geojson_json_Data = metadata;
    if (this.commonService.isValid(geojson_json_Data)) {
      // console.log('VALID geojson_json : ', geojson_json_Data);
      // console.log('parsing ', JSON.parse(geojson_json_Data));
      let featureCollection;
      if (fileType === this.JSON_EXTENSION_CONSTANT) {
        featureCollection = {
          type: 'FeatureCollection',
          // "features": JSON.parse(geojson_json_Data)
          features: geojson_json_Data,
        };
      } else {
        featureCollection = geojson_json_Data;
      }
      console.log('featureCollection: ', featureCollection);
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(featureCollection, {
          featureProjection: this.basemapProjection,
        }),
      });
      const fill = new Fill({
        color: 'rgba(255, 255, 255, 1)',
      });
      const stroke = new Stroke({
        // color: '#319FD3',
        color: this.randomRainbowColor(0, 6),
        width: 1,
      });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        /* style: this.getShapeStyle() */
        style: new Style({
          image: new CircleStyle({
            fill,
            stroke,
            radius: 5,
          }),
          fill,
          stroke,
        }),
      });
      vectorLayer.set('name', this.fileName);
      // vectorLayer.setStyle(vectorLayer.getStyle());
      vectorLayer.setOpacity(0.7);
      this.basemap.addLayer(vectorLayer);
      this.addLayerObjectsToTower();
      console.log(
        'getting the styles ',
        vectorLayer.getStyle().defaultStyles,
        vectorLayer.getStyleFunction()
      );
      // new code for zoom to extent
      this.basemap.getLayers().forEach((currentLayer) => {
        if (this.fileName === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.basemap.getView().fit(extentValue);
          this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
        }
      });
    } else {
      console.log('INVALID jgwxData : ', geojson_json_Data);
      // const msg = 'Cannot add ' + this.fileName + ' file due to unrecognized coordinate system. Please check your data';
      const msg =
        'Sorry! Cannot add the file ' +
        this.fileName +
        ' due to geojson not valid.';
      this._getAlertMessage(this.alertComponent, msg);
      // return;
    }
  }

  private preview_XLSX_CSV_File(layerObject): any {
    console.log(
      'preview data ',
      layerObject.metadata,
      JSON.parse(layerObject.metadata)
    );
    const places = JSON.parse(layerObject.metadata).data;
    const name = layerObject.files.name; //.split('.')[0] + layerObject.metadata.id + '.' + layerObject.files.name.split('.')[1];
    let placesFeatures = [];
    places.forEach((p) => {
      placesFeatures.push(
        new Feature({
          geometry: new Point([p.Longitude, p.Latitude]),
          // id: p.Name + ' : ' + p.Address + ' : ' + p.City	+ ' : ' + p.State	+ ' : ' + p.Zip
          id: p,
        })
      );
    });
    var styleGreen = new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color: 'blue',
        }),
      }),
    });
    setTimeout(() => {
      let placesSource = new VectorSource({ features: placesFeatures });
      const vectorLayer = new VectorLayer({
        source: placesSource,
        name: name,
        style: styleGreen,
      });
      this.basemapService.getCurrentBasemap().addLayer(vectorLayer);
      this.addLayerObjectsToTower();
      // new code for zoom to extent
      this.basemap.getLayers().forEach((currentLayer) => {
        if (name === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.basemap.getView().fit(extentValue);
          this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
        }
      });
    }, 500);
  }

  private preview_PDF_File(url): any {
    // var fs = require('fs');
    /* var PDFExtract = require('../../../../node_modules/pdf.js-extract/lib').PDFExtract;
    var pdfExtract = new PDFExtract();
    pdfExtract.extract('url', {} , function (err, data) {
        if (err) return console.log(err);
        
        console.log(JSON.stringify(data, null, '\t'));
    }); */
  }

  // End Main Class
}
