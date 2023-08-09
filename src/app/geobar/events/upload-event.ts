import OlMap from 'ol/Map';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { NgProgress } from 'ngx-progressbar';
import KML from 'ol/format/KML.js';
import ImageLayer from 'ol/layer/Image.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, Subject } from 'rxjs';
import { FileUtil } from '../util/fileUtil';
import { MapshaperUtil } from '../util/mapshaperUtil';
import { FirebaseUtil } from '../util/firebaseUtil';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import { BasemapService } from '../../basemap/basemap.service';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import * as xml2js from 'xml2js';
import { CommonService } from '../../Services/common.service';
import { Injectable } from '@angular/core';
import { AuthObservableService } from '../../Services/authObservableService';
import { Fill, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import {
  addCoordinateTransforms,
  addProjection,
  transform,
} from 'ol/proj';
import OlView from 'ol/View';
import { LayersService } from 'src/app/Services/layers.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { GeotowerService } from 'src/app/geotower/geotower.service';
import * as XLSX from 'xlsx';
import { GeobarService } from '../geobar.service';
declare let zip;

export class UploadEvent {
  private _fileName: string;
  private ZIP_EXTENSION_CONSTANT = '.zip';
  private KML_EXTENSION_CONSTANT = '.kml';
  private KMZ_EXTENSION_CONSTANT = '.kmz';
  private JPG_EXTENSION_CONSTANT = '.jpg';
  private TIF_EXTENSION_CONSTANT = '.tif';
  private PRJ_EXTENSION_CONSTANT = '.prj';
  private DBF_EXTENSION_CONSTANT = '.dbf';
  private XLSX_EXTENSION_CONSTANT = '.xlsx';
  private PDF_EXTENSION_CONSTANT = '.pdf';
  private CSV_EXTENSION_CONSTANT = '.csv';
  private GEOJSON_EXTENSION_CONSTANT = '.geojson';
  private JSON_EXTENSION_CONSTANT = '.json';
  private PNG_EXTENSION_CONSTANT = '.png';
  private ALERT_CONSTANT = 'alert';
  private TEXT_CONSTANT = 'text';
  downloadURL: any;
  private _basemapProjection;
  private _commonService: CommonService;
  private epsgCode = 'NO-EPSG';

  progress: Subject<any> = new Subject<any>();
  uploadOptions: any;
  constructor(private basemap: OlMap,
              private ngProgress: NgProgress,
              private firestorage: AngularFireStorage,
              private basemapService: BasemapService, private authObsr: AuthObservableService,
              private layerService: LayersService, private geoTowerService: GeotowerService,
              private geobarService: GeobarService) {
    this._basemapProjection = this.basemap.getView().getProjection().code_;
    this._commonService = new CommonService();
    this.progress.subscribe(prog => {
      console.log('IN PROGRESS');
      console.log(prog);
      this.setUploadStatusInPercentage(10 + (prog / 2));
    });
  }

  setUploadStatusInPercentage(num) {
    this.uploadOptions.geobar.setLayerUploadStatus(num);
  }
  hideLayerUploadStatus() {
    this.uploadOptions.geobar.closeLayerUploadStatus(); // hideLayerUploadStatus();
  }

  public processUploadedFiles(options) {
    this.uploadOptions = options;
    console.log(options);
    // this.ngProgress.start();
    this.ngProgress.ref().start();
    const files = options.files;
    this._fileName = files[0].name.split('.')[0];
    const fileUtil = new FileUtil(this.basemapService, this.firestorage);
    fileUtil.fileUtilCallback = (returnData) => {
      console.log('fileUtilCallback : ', returnData);
      this.setUploadStatusInPercentage(10);
      if (returnData.filetype === this.ZIP_EXTENSION_CONSTANT) {
        // fileUtil._createZipFile(returnData.inputFiles);
        this._getMapshaperUtil(returnData);
      } else if (returnData.filetype === this.ALERT_CONSTANT) {
        // this._getAlertMessage(options.alertComponent);
        let msg = '';
        if (returnData.message === 'WRONG_FILE') {
          // msg = 'Wrong file added. Please select zip or .shp, .prj, .dbf files or .jpg, .jgwx, .xml files';
          msg = 'Sorry! currently, fuse™ can read kml/z, zip, (shp, dbf, prj), or (jpg, jpgw, jpg.aux.xml) combinations';
        } else if (returnData.message === 'LARGE_FILE') {
          msg = 'File size should be less than 100 MB';
        } else {
          msg = 'Please select shape file of size less than 100Mb either as zip or .shp, .prj, .dbf files.';
        }
        this.authObsr.updateErrors(msg);
        this.ngProgress.ref().complete();
        this.hideLayerUploadStatus();
      } else if (returnData.filetype === this.JPG_EXTENSION_CONSTANT
        || returnData.filetype === this.TIF_EXTENSION_CONSTANT
        || returnData.filetype === this.PNG_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      } else if (returnData.filetype === this.KML_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      } else if (returnData.filetype === this.KMZ_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      }else if (returnData.filetype === this.GEOJSON_EXTENSION_CONSTANT
        || returnData.filetype === this.JSON_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      } 
      else if (returnData.filetype === this.XLSX_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
        // options.geobar.showExcelData = true;
      }
      else if (returnData.filetype === this.CSV_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      }
      else if (returnData.filetype === this.PDF_EXTENSION_CONSTANT) {
        this._getFirebaseUtil(returnData, returnData.filetype);
      }
      // this.ngProgress.done();
      this.ngProgress.ref().complete();
    };
    fileUtil.validationUploadedFile(files, options);
  }

  processAwsUrlFiles(options) {
    this.uploadOptions = options;
    // this.ngProgress.start();
    this.ngProgress.ref().start();
    // const files = options.files;
    const selectedFileUrls: any[] = options.fileUrls;
    // const fileUrl = options.fileUrl;
    // this._fileName = options.fileUrl;
    let fileWithExtenstion = '';
    console.log('what are options ', selectedFileUrls);
    // if (fileUrl.lastIndexOf('/') !== -1 ){
    //    fileWithExtenstion =  fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    fileWithExtenstion = selectedFileUrls[0].name;
    if ( this._commonService.isValid(fileWithExtenstion)) {
      if ( fileWithExtenstion.split('.').length > 0) {
        this._fileName = fileWithExtenstion.split('.')[0];
      }
    }
    // }
    const fileUtil = new FileUtil(this.basemapService, this.firestorage);
    fileUtil.fileUtilCallback = (returnData) => {
      console.log('fileUtilCallback : ', returnData);
      this.setUploadStatusInPercentage(10);
      if (returnData.filetype === this.ZIP_EXTENSION_CONSTANT) {
        console.log('GET MAP SHAPER UTIL');
        this._getMapshaperUtil(returnData);
      } else if (returnData.filetype === this.ALERT_CONSTANT) {
        // this._getAlertMessage(options.alertComponent);
        let msg = '';
        if (returnData.message === 'READ_ERROR') {
          // this.authObsr.updateErrors('Selected file do not have permission to read.');
          msg = 'Selected file do not have permission to read.';
        } else if (returnData.message === 'WRONG_FILE') {
          // msg = 'Wrong file added. Please select zip or .shp, .prj, .dbf files or .jpg, .jgwx, .xml files';
          msg = 'Sorry! currently, fuse™ can read kml/z, zip, (shp, dbf, prj), or (jpg, jpgw, jpg.aux.xml) combinations';
        } else if (returnData.message === 'LARGE_FILE') {
          msg = 'File size should be less than 100 MB';
        } else {
          msg = 'Please select shape file of size less than 100Mb either as zip or .shp, .prj, .dbf files.';
        }
        this.authObsr.updateErrors(msg);
        this.ngProgress.ref().complete();
        this.hideLayerUploadStatus();
      } else if (returnData.filetype === this.JPG_EXTENSION_CONSTANT
        || returnData.filetype === this.TIF_EXTENSION_CONSTANT
        || returnData.filetype === this.KML_EXTENSION_CONSTANT
        || returnData.filetype === this.KMZ_EXTENSION_CONSTANT
        || returnData.filetype === this.XLSX_EXTENSION_CONSTANT
        || returnData.filetype === this.CSV_EXTENSION_CONSTANT
        || returnData.filetype === this.PDF_EXTENSION_CONSTANT) {

        console.log(returnData);
        console.log(selectedFileUrls);
        const fileIndex = selectedFileUrls.findIndex(file => file.name === returnData.inputFiles.name);
        console.log(fileIndex);
        if (fileIndex === -1) {
          // NO IMG/KML FILE URL AVAILALE. SO, GET FIREBASE URL
          console.log('NO IMG/KML FILE URL AVAILALE. SO, GET FIREBASE URL');
          this._getFirebaseUtil(returnData, returnData.filetype);
        } else {
          // IMG/KML FILE URL AVAILALE. SO, USE THAT DIRECTLY.
          console.log('IMG/KML FILE URL AVAILALE. SO, USE THAT DIRECTLY.');
          this.setUploadStatusInPercentage(70);
          returnData.fileName = returnData.inputFiles.name;
          returnData.firebaseUrl = selectedFileUrls[fileIndex].url;
          this.basemapService.setLayerToGeotower(returnData);
          this.setUploadStatusInPercentage(90);
          setTimeout(() => {
            this.setUploadStatusInPercentage(100);
          }, 1000);
        }


      }
      // this.ngProgress.done();
      this.ngProgress.ref().complete();
    };
    fileUtil.validationAwsUrl(options);
  }
  getFileType(files: any, fileType: string) {
    let fileExt = files.name.match(/\.[0-9a-z]+$/i);
    fileExt = fileExt ? fileExt[0] : '';
    return (fileExt === fileType) ? true : false;
  }
  getFile(files: any, fileType: string): any {
    return Array.from(files).find( (file: any) => {
      let fileExt = file.name.match(/\.[0-9a-z]+$/i);
      fileExt = fileExt ? fileExt[0] : '';
      if (fileExt === fileType) {
        console.log('found the shp file ');
        return file;
      }
    });
  }
  private _getMapshaperUtil(returnData) {
    const mapshaperUtil = new MapshaperUtil();
    mapshaperUtil.mapshaperUtilCallback = (featureCollection, files) => {
      console.log('what is here project file data', files, files['input.shp'], returnData);
      // Here taking shp file name as zip file name, because of geoserver taking shp file from zip.
      if (returnData.inputFiles.length > 0 && returnData.filetype === this.ZIP_EXTENSION_CONSTANT) {
        const shpFileName = this.getFile(returnData.inputFiles, '.shp').name.split('.')[0];
        this._fileName = shpFileName;
        const fileUtil = new FileUtil(this.basemapService, this.firestorage);
        let createZipFile = false;
        try{
          if (this._commonService.isValid(returnData.zipfile) && returnData.zipfile instanceof File) {
            if (returnData.zipfile.length <= 0) {
              createZipFile = true;
            }
          } else {
            createZipFile = true;
          }
        } catch (e) {
          console.log(e);
          createZipFile = true;
        }
        if (createZipFile) {
          console.log('Creating zip file');
          fileUtil._createZipFile(returnData.inputFiles, (res) => {
            // returnData.zipfile =  new File([res], `${returnData.name}.zip`);
            const file =  new File([res], `${returnData.fileName}${returnData.filetype}`,
                                      {type: 'application/x-zip-compressed', lastModified: new Date().getTime()});
            console.log(returnData.zipfile);
            console.log(file);
            returnData.zipfile =  file;
            console.log(returnData);
            this.geoTowerService.geotowerLayersList.filter(item => {
              if (item.name === returnData.fileName) {
                item.zipfile = file;
              }
            });
          });
        } else {
          console.log('Zip file already present');
        }
      }
      if (this._commonService.isValid(files['input.prj'])) {
        returnData.proj = files['input.prj'];
      }
      if (this._commonService.isValid(files['input.dbf'])) {
        returnData.dbf = files['input.dbf'];
      }
      console.log('Feature Collections ');
      const arrayJson = [];
      featureCollection.fileName = this._fileName;
      arrayJson.push(featureCollection);
      // this._layerPreview(arrayJson);
      returnData.metadata = arrayJson;
      returnData.fileName = this._fileName;
      this.basemapService.setLayerToGeotower(returnData);
      this.setUploadStatusInPercentage(90);
      setTimeout(() => {
        this.setUploadStatusInPercentage(100);
      }, 1000);
    };
    mapshaperUtil.getFeatureCollection(returnData.inputFiles, this);
    // this.setUploadStatusInPercentage(20);
  }

  private _getFirebaseUtil(returnData, filetype) {
    const firebaseUtil = new FirebaseUtil(this.firestorage);
    /* returnData.firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/geomocus-cdef5.appspot.com/o/HBCUs_Lat_long.xlsx?alt=media&token=fdfb42e3-fbb1-466d-b037-43343c68d7ab';
    returnData.fileName = returnData.inputFiles.name;
    if(filetype === this.XLSX_EXTENSION_CONSTANT || filetype === this.CSV_EXTENSION_CONSTANT
      || filetype === this.PDF_EXTENSION_CONSTANT) {
        this.geobarService.returnDataToGeobar = returnData;
        // this.basemapService.setLayerToGeotower(returnData);
        console.log('upalod-event - return data ', returnData)
        this.basemapService.setGeobarDataToPopup(returnData);
    } else {
      this.basemapService.setLayerToGeotower(returnData);
    }
    this.setUploadStatusInPercentage(90);
    setTimeout(() => {
      this.setUploadStatusInPercentage(100);
    }, 1000); */
    firebaseUtil.firebaseUtilCallback = (firebaseFileURL) => {
      this.setUploadStatusInPercentage(70);
      returnData.fileName = returnData.inputFiles.name;
      returnData.firebaseUrl = firebaseFileURL;      
      this.geobarService.returnDataToGeobar = returnData;
      console.log('firebase util ', returnData, filetype)
      if(filetype === this.XLSX_EXTENSION_CONSTANT || filetype === this.CSV_EXTENSION_CONSTANT
        || filetype === this.PDF_EXTENSION_CONSTANT) {
          this.geobarService.returnDataToGeobar = returnData;
          // this.basemapService.setLayerToGeotower(returnData);
          console.log('upalod-event - return data ', returnData)
          this.basemapService.setGeobarDataToPopup(returnData);
      } else {
        this.basemapService.setLayerToGeotower(returnData);
      }
      this.setUploadStatusInPercentage(90);
      setTimeout(() => {
        this.setUploadStatusInPercentage(100);
      }, 1000);
    };
    firebaseUtil.getFirebaseFileURL(returnData.inputFiles, returnData.filetype, returnData.metadata, this.progress);
  }

  private _layerPreview(geoJson_mapshaper) {
    if (geoJson_mapshaper.length > 0) {
      geoJson_mapshaper.forEach((jsonObj) => {
        this._setLayerToMap(jsonObj);
      });
    } else {
      this._setLayerToMap(geoJson_mapshaper);
    }
  }

  private _setLayerToMap(geoJson) {
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson, {
        featureProjection: this._basemapProjection
      })
    });
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)'
    });
    const stroke = new Stroke({
      color: '#319FD3',
      width: 1
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      /* style: this.getShapeStyle() */
      style: new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: 5
        }),
        fill,
        stroke,
      }),
    });
    vectorLayer.set('name', geoJson.fileName);
    // vectorLayer.setStyle(vectorLayer.getStyle());
    vectorLayer.setOpacity(0.7);
    this.basemap.addLayer(vectorLayer);
    console.log('getting the styles ', vectorLayer.getStyle().defaultStyles, vectorLayer.getStyleFunction());
    // new code for zoom to extent
    this.basemap.getLayers().forEach(currentLayer => {
      if (geoJson.fileName === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getExtent();
        this.basemap.getView().fit(extentValue);
        this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
      }
    });
  }

  private _kmlImagePreview(kmlURL) {
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: kmlURL,
        format: new KML(),
        crossOrigin: 'anonymous'
      })
    });
    vectorLayer.set('name', this._fileName + this.KML_EXTENSION_CONSTANT);
    vectorLayer.setOpacity(0.7);
    this.basemap.addLayer(vectorLayer);
    this.setUploadStatusInPercentage(80);
    setTimeout(() => {
      this.basemap.getLayers().forEach(currentLayer => {
        if (this._fileName + this.KML_EXTENSION_CONSTANT === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.basemap.getView().fit(extentValue);
          this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
          this.setUploadStatusInPercentage(100);
        }
      });
    }, 3000);
  }

  private _getImageDimension(image): Observable<any> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = function(event) {
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
  private printNode(xml, key?) {
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
    return new Observable(observer => {
      let projdef = '+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118' +
    ' +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';
      fetch('https://epsg.io/?format=json&q=' + epsgCode.split(':')[1])
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
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
      }
      observer.next(projdef);
      observer.complete();
    });
    });
  }
  private getProjDef_temp(epsgCode) {
    let projdef = '+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118' +
    ' +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';
    fetch('https://epsg.io/?format=json&q=' + epsgCode.split(':')[1])
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
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
                return projdef;
              }
            }
          }
        }
      });
    return projdef;
  }

  private xmlParser(xmlData) {
    // xml prsing code here for getting the epsg code
    const parser = new xml2js.Parser({ strict: false, trim: true });
    parser.parseString(xmlData, (err, result) => {
      const obj: any[] = result;
      console.log(result);
      if (this._commonService.isValid(obj)) {
        this.printNode(obj, 'LATESTWKID');
        console.log('epsgCode checking ', this.epsgCode);
      }
    });
  }

  private imgProjCoordinateSysCal(translation_x, translation_y, xScale, yScale, rotateConditionOne, rotateConditionTwo, imageData, jpgURL) {
    /* x1 = Ax + By + C
      y1 = Dx + Ey + F
      image-to-world transformation Calculation */
      let extent = [translation_x, translation_y, translation_x + (xScale * imageData.width), translation_y + (yScale * imageData.height)];
      // new calculation for jpeg image conversion
      const coordinate_x = (xScale * imageData.width) + (rotateConditionTwo * imageData.height) + translation_x;
      const coordinate_y = (rotateConditionOne * imageData.width) + (yScale * imageData.height) + translation_y;
      // const projdef = this.getProjDef(this.epsgCode);
      this.getProjDef(this.epsgCode).subscribe( projdef => {
        console.log('projection def is ', projdef, jpgURL, imageData);
        proj4.defs(this.epsgCode, projdef);
        register(proj4);
        extent = transformExtent([translation_x, translation_y,
        translation_x + (xScale * imageData.width), translation_y + (yScale * imageData.height)],
        get(this.epsgCode), get(this._basemapProjection));
        /* const extent = transformExtent([coordinate_x, coordinate_y, coordinate_x + (xScale * imageData.width),
            coordinate_y + (yScale * imageData.height)], get(this.epsgCode), get(this._basemapProjection)); */
        console.log('After basemap projection transform extent is : ', extent, this.epsgCode, coordinate_x, coordinate_y);
        this.imagePreviewProcess(extent, jpgURL, imageData);
      });
      // setTimeout(() => {
      // return extent;
      // }, 500);
  }

  private _jpgImagePreview(jpgURL, metadata) {
    const image = {
      url: jpgURL
    };
    console.log(jpgURL);
    console.log(metadata);
    let jgwxData = metadata.geodata;
    const xmlData = metadata.xmldata;
    this.xmlParser(xmlData);
    this.setUploadStatusInPercentage(80);
    this._getImageDimension(image).subscribe(imageData => {
      // console.log(imageData.width, imageData.height, jgwxData);
      let xScale, yScale, translation_x, translation_y, rotateConditionOne, rotateConditionTwo;
      if (this._commonService.isValid(jgwxData)) {
        console.log('VALID jgwxData : ', jgwxData);
        jgwxData = jgwxData.split('\n');
        xScale = +jgwxData[0];
        rotateConditionOne = +jgwxData[1];
        rotateConditionTwo = +jgwxData[2];
        yScale = +jgwxData[3];
        translation_x = +jgwxData[4];
        translation_y = +jgwxData[5];
      } else {
        console.log('INVALID jgwxData : ', jgwxData);
        xScale = '1';
        yScale = '1';
        translation_x = '0';
        translation_y = '0';
        rotateConditionOne = '0';
        rotateConditionTwo = '0';
      }
      if (this.epsgCode === 'NO-EPSG') {
        console.log('INVALID epsg : ', jgwxData);
        xScale = '1';
        yScale = '1';
        translation_x = '0';
        translation_y = '0';
        rotateConditionOne = '0';
        rotateConditionTwo = '0';
        this.epsgCode = this.basemapService.projection3857Code;
      }
      const extent = this.imgProjCoordinateSysCal(translation_x, translation_y, xScale, yScale,
         rotateConditionOne, rotateConditionTwo, imageData, jpgURL);
      /* setTimeout(() => {
        this.imagePreviewProcess(extent, jpgURL, imageData);
      }, 1000); */
    });
  }

  private imagePreviewProcess(extent, jpgURL, imageData) {
    const imageProjection = new Projection({
      code: 'orto-image',
      units: 'pixels',
      extent
    });
    const imagLayer = new ImageLayer({
      source: new Static({
        url: jpgURL,
        projection: imageProjection,
        imageExtent: extent,
        imageSize: [imageData.width, imageData.height],
      })
    });
    imagLayer.set('name', this._fileName + this.JPG_EXTENSION_CONSTANT);
    imagLayer.setOpacity(0.7);
    this.basemap.addLayer(imagLayer);
    this.basemap.getLayers().forEach(currentLayer => {
      if (this._fileName + this.JPG_EXTENSION_CONSTANT === currentLayer.values_.name) {
        console.log('image layer is ', currentLayer, imagLayer);
        const extentValue = currentLayer.values_.source.getImageExtent();
        this.basemap.getView().fit(extentValue);
      }
    });
    this.setUploadStatusInPercentage(90);

    setTimeout(() => {
      this.setUploadStatusInPercentage(100);
    }, 1000);
  }
  private _tiffImagePreview(tiffURL, metadata) {
    const image = {
      url: tiffURL
    };
    let jgwxData = metadata.geodata;
    const xmlData = metadata.xmldata;
    const epsgCode = this.basemapService.projection3857Code;
    jgwxData = jgwxData.split('\n');
    const xScale = +jgwxData[0];
    const yScale = +jgwxData[3];
    const left = +jgwxData[4];
    const top = +jgwxData[5];
    // const extent = transformExtent([68.195, 37.079], get(epsgCode), get('EPSG:4326'));
    const extent = [68.195, 37.079];
    const imageProjection = new Projection({
      code: 'orto-image',
      units: 'pixels',
      extent
    });
    this.setUploadStatusInPercentage(80);
    const imagLayer = new ImageLayer({
      source: new Static({
        url: image,
        projection: imageProjection,
        imageExtent: extent,
        imageSize: [3505, 3640],
        crossOrigin: 'anonymous'
      })
    });
    this.basemap.addLayer(imagLayer);
    this.basemap.values_.view.setCenter(extent);
    this.basemap.getView().setZoom(6);
    this.setUploadStatusInPercentage(90);
    setTimeout(() => {
      this.setUploadStatusInPercentage(100);
    }, 1000);
  }

  private _getAlertMessage(alertComponent) {
    const alertMessage = 'Please select shape file of size less than 100Mb either as zip or .shp, .prj, .dbf files.';
    const alert = alertComponent;
    alert.setAlertMessage(alertMessage);
    // this.ngProgress.done();
    this.ngProgress.ref().complete();
  }
}
