import OlTileLayer from 'ol/layer/Tile';
import tiles from 'ol/source/TileWMS';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import KML from 'ol/format/KML.js';
import ImageLayer from 'ol/layer/Image.js';
import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import { Observable } from 'rxjs';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { ConfigServices } from 'src/app/config.service';
import { ConfigDataKeys } from 'src/app/config.enum';
import { BasemapService } from '../../basemap/basemap.service';
import { GeotowerService } from '../geotower.service';
import { CommonService } from '../../Services/common.service';
import { WMSCapabilities } from 'ol/format';
import JSON from 'ol/format/EsriJSON';
import {Fill, Stroke, Style, Text} from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import * as xml2js from 'xml2js';
// Here new lib for image rotation
import { addCoordinateTransforms } from 'ol/proj';
import { rotate } from 'ol/coordinate';
import { buffer, getCenter } from 'ol/extent';
import {fromLonLat, transform, addProjection, getTransform} from 'ol/proj';
import {getVectorContext} from 'ol/render';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { register } from 'ol/proj/proj4.js';
import { unByKey } from 'ol/Observable.js';
import proj4 from 'proj4';
import { fromArrayBuffer } from 'geotiff';
import $ from 'jquery';
export class LayerPreviewUtil {
  private PREVIEWISACTIVE_CONSTANT = 'previewIsActive';
  private LAYERDATA_CONSTANT = 'layerData';
  private ZIP_EXTENSION_CONSTANT = 'zip';
  private KML_EXTENSION_CONSTANT = 'kml';
  private KMZ_EXTENSION_CONSTANT = 'kmz';
  private JPG_EXTENSION_CONSTANT = 'jpg';
  private TIF_EXTENSION_CONSTANT = 'tif';
  private GEOJSON_EXTENSION_CONSTANT = 'geojson';
  private JSON_EXTENSION_CONSTANT = 'json';
  private PDF_EXTENSION_CONSTANT = 'pdf';
  private PNG_EXTENSION_CONSTANT = 'png';
  private URL_CONSTANT = 'url';
  private geotowerService;
  private basemapProjection;
  private sliderValue: number;  
  private fileName;
  Colors = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
  commonService: CommonService = new CommonService();
  constructor(private configService: ConfigServices, public baseMapService: BasemapService) {
    this.basemapProjection = this.baseMapService.getCurrentBasemap().getView().getProjection().code_;
  }

  public displayLayer(options): any {
    console.log('display layer on map ', options);
    this.geotowerService = options.geotowerService;
    this.sliderValue = options.sliderValue;
    this.setLayerVisibulity(options);
  }
  setWMSLayerUrlToMap(layerDataObj, options): any {
    if (layerDataObj.isServer) {
      if (options.previewIsActive) {
        // options.previewIsActiveEmit.emit({ [this.PREVIEWISACTIVE_CONSTANT]: true, [this.LAYERDATA_CONSTANT]: options.layerObj });
        // layerObj.setVisible(true);
        const layerFileType = layerDataObj.type;
        const firebaseURL = layerDataObj.url;
        const metadataInfo = layerDataObj.metadata;
        this.fileName = layerDataObj.name;
        if (layerFileType === this.JPG_EXTENSION_CONSTANT
          || layerFileType === this.PNG_EXTENSION_CONSTANT) {
          this._displayJpgImageLayer(layerDataObj, firebaseURL, metadataInfo);
        } else if (layerFileType === this.KML_EXTENSION_CONSTANT || layerFileType === this.KMZ_EXTENSION_CONSTANT) {
          this._displayKmlImageLayer(layerDataObj, firebaseURL);
        } else if (layerFileType === this.ZIP_EXTENSION_CONSTANT) {
          this.wmsServerZipLayer(layerDataObj);
        } else if (layerFileType === this.URL_CONSTANT) {
          this._displayWmlLayer(layerDataObj);
        } else if (layerFileType === this.TIF_EXTENSION_CONSTANT) {
          this.tFFImagePreview(layerDataObj.url, layerDataObj.metadata);
        } else if (layerFileType === this.PDF_EXTENSION_CONSTANT) {
          this.preview_PDF_File(layerDataObj.url);
        } else if (layerFileType === this.GEOJSON_EXTENSION_CONSTANT || layerFileType === this.JSON_EXTENSION_CONSTANT) {
          this.previewGeoJosn_Json_Files_new(layerDataObj, options.layerObj.type);
        } else {
          console.log('NOT IMPLEMENTED YET');
        }
      } else {
        // options.previewIsActiveEmit.emit({ [this.PREVIEWISACTIVE_CONSTANT]: false, [this.LAYERDATA_CONSTANT]: options.layerObj });
        // layerObj.setVisible(false);
        this.baseMapService.getCurrentBasemap().getLayers().forEach(layerObj => {
          if (layerObj.values_.name === layerDataObj.name) {
            console.log('what is it... ', layerObj, layerDataObj);
            // this.baseMapService.getCurrentBasemap().removeLayer(wmsLayer);
          }
        });
      }
    }
  }
  wmsServerZipLayer(layerDataObj): any {
    // const domainURLTrim = (layerDataObj.url).split('qa.fuse.earth:8282');
    // const changedDomainURL = 'https://qa.fuse.earth' + domainURLTrim[1];
    // console.log('URLs are : ', domainURLTrim, changedDomainURL);
    const wmsLayer = new OlTileLayer({
      source: new tiles({
        url: layerDataObj.url,
        serverType: 'geoserver'
      })
    });
    wmsLayer.set('name', layerDataObj.name);
    wmsLayer.set('type', 'URL');
    this.baseMapService.getCurrentBasemap().addLayer(wmsLayer);
    let extent;
    if (typeof layerDataObj.metadata === 'string') {
      extent = window.JSON.parse(layerDataObj.metadata);
    } else {
      extent = layerDataObj.metadata;
    }
    this.baseMapService.getCurrentBasemap().getView().fit(extent);
        this.baseMapService.getCurrentBasemap().getView().setZoom(this.baseMapService.getCurrentBasemap().getView().getZoom() - 1);
  }

  setKMLhiddenJPEGLayerVisibulity(kmlFileName, visibulity): any {
    this.baseMapService.getCurrentBasemap().getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        if (layerObj.values_.name === kmlFileName + '_jpg') {
          layerObj.setVisible(visibulity);
        }
      }
    });
  }
  // Here new code applying setvisibulity true/false instead of removing and adding
  private setLayerVisibulity(options): any {
    let isLayerAlreadyAdded = false;
    this.baseMapService.getCurrentBasemap().getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        if (layerObj.values_.name === options.layerObj.name) {
          isLayerAlreadyAdded = true;
          console.log('data ', layerObj);
          if (options.previewIsActive) {
            // options.previewIsActiveEmit.emit({ [this.PREVIEWISACTIVE_CONSTANT]: true, [this.LAYERDATA_CONSTANT]: options.layerObj });
            if (options.layerObj.fileType === '.kml' || options.layerObj.fileType === '.kmz' ||
                options.layerObj.fileType === 'kml' || options.layerObj.fileType === 'kmz') {
                  this.setKMLhiddenJPEGLayerVisibulity(options.layerObj.name, true);
            }
            layerObj.setVisible(true);
          } else {
            // options.previewIsActiveEmit.emit({ [this.PREVIEWISACTIVE_CONSTANT]: false, [this.LAYERDATA_CONSTANT]: options.layerObj });
            if (options.layerObj.fileType === '.kml' || options.layerObj.fileType === '.kmz' ||
                options.layerObj.fileType === 'kml' || options.layerObj.fileType === 'kmz') {
                  this.setKMLhiddenJPEGLayerVisibulity(options.layerObj.name, false);
            }
            layerObj.setVisible(false);
          }
        }
      }
    });
    if (!isLayerAlreadyAdded) {
      console.log('here new code for setting the geoserver wms url to map');
      this.setWMSLayerUrlToMap(options.layerObj, options);
    }
  }

  private _getImagedimension(images): Observable<any> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = (event) => {
        const loadedImage: any = event.currentTarget;
        images.width = loadedImage.width;
        images.height = loadedImage.height;
        observer.next(images);
        observer.complete();
      };
      img.src = images.url;
    });
  }

  private _displayJpgImageLayer(layerDataObj, firebaseURL, metadataInfo): any {
    console.log('metadata ', metadataInfo);
    const images = {
      url: firebaseURL
    };
    if (typeof metadataInfo === 'string' && metadataInfo.length > 0) {
      try{
        metadataInfo = window.JSON.parse(metadataInfo);
      } catch (e){
        console.log(e);
      }
    }
    console.log('after json metadata ', metadataInfo);
    this._getImagedimension(images).subscribe(imageData => {
      let epsgCode = 'EPSG:3857';
      let jgwxData = metadataInfo.geodata;
      const xmlData = metadataInfo.xmldata;
      const extentData = metadataInfo.extent;
      const maskData = metadataInfo.imageMask;
      console.log('data ', jgwxData, xmlData, extentData, maskData);
      let xScale;
      let yScale;
      let left;
      let top;
      let rotation1;
      let rotation2;
      if (this.commonService.isValid(jgwxData)) {
        jgwxData = jgwxData.split('\n');
        xScale = +jgwxData[0];
        yScale = +jgwxData[3];
        left = +jgwxData[4];
        top = +jgwxData[5];
        rotation1 = +jgwxData[1];
        rotation2 = +jgwxData[2];
      } else {
        xScale = '1';
        yScale = '1';
        left = '0';
        top = '0';
        rotation1 = '0';
        rotation2 = '0';
      }
      let extent;
      let extent3857;
      let imageExtent;
      let isGeorefData = true;
      if (extentData !== null && extentData !== undefined) {
        extent = extentData;
        // extent = [-117.02885845057754, 33.94372861605477, -117.00713253606895, 33.95118697032653];
        // rotation1 = 0;
        const projdef = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs';
        proj4.defs('EPSG:3857', projdef);
        register(proj4);
        // affine transformation giving image center point of geo referencing
        // Here extent prepared and image displaying as image center point
        extent = transformExtent([left - (xScale * imageData.width / 2),
          top - (yScale * imageData.height / 2),
          left + (xScale * imageData.width / 2),
          top + (yScale * imageData.height / 2)],
          get('EPSG:3857'), get('EPSG:4326'));
        extent3857 = [left - (xScale * imageData.width / 2),
          top - (yScale * imageData.height / 2),
          left + (xScale * imageData.width / 2),
          top + (yScale * imageData.height / 2)];
        imageExtent = extent3857;
      } else {
        isGeorefData = false;
        epsgCode = this.baseMapService.projection3857Code;
        const parser = new xml2js.Parser({ strict: false, trim: true });
        parser.parseString(xmlData, (err, result) => {
          const obj = result;
          console.log(result);
          if (this.commonService.isValid(obj)) {
            Object.entries(obj).forEach(data => {
              data[1]['METADATA'].forEach(xmlMetadata => {
                if (xmlMetadata.GEODATAXFORM !== undefined) {
                  epsgCode = 'EPSG:' + xmlMetadata.GEODATAXFORM[0].SPATIALREFERENCE[0].LATESTWKID[0];
                }
              });
            });
          }
        });
        extent = [left, top, left + (xScale * imageData.width), top + (yScale * imageData.height)];
        this.getProjDef(epsgCode).subscribe( projdef => {
          proj4.defs(epsgCode, projdef);
          register(proj4);
        
        // console.log('extent : ', extent, epsgCode, this.basemapProjection);
        // console.log('extent : ', get('EPSG:2230'), get(this.basemapProjection));
        /* extent = transformExtent([left, top, left + (xScale * imageData.width), top + (yScale * imageData.height)],
          get(epsgCode), get(this.basemapProjection)); */
          // console.log('extent : ', get(epsgCode), get(this.basemapProjection));
        extent = transformExtent([left - (xScale * imageData.width / 2),
          top - (yScale * imageData.height / 2),
          left + (xScale * imageData.width / 2),
          top + (yScale * imageData.height / 2)],
          get(epsgCode), get(this.basemapProjection));
          extent3857 = [left - (xScale * imageData.width / 2),
          top - (yScale * imageData.height / 2),
          left + (xScale * imageData.width / 2),
          top + (yScale * imageData.height / 2)];
        imageExtent = extent3857;
        // console.log('after conversion extent : ', extent, extent3857);
      });
      }
      setTimeout(() => {
        
      // console.log('final extent is ', extent, extentData, imageExtent, extent3857);
      const imageProjection = new Projection({
        code: 'orto-image',
        units: 'pixels',
        extent: buffer(extent, 512)
      });
      /* const imageProjectionNew = this.returnRotateProjection(
        imageProjection,
        // [extent[0], extent[1]],
        fromLonLat([left, top], 'EPSG:4326'),
        rotation1,
        extent
      ); */
      const imageProjectionNew = this.returnRotateProjection(
        epsgCode,
        rotation1,
        extent3857,
        isGeorefData
      );
      setTimeout(() => {
      // console.log('what is the projections ', imageProjection, imageProjectionNew);
      const imagLayer = new ImageLayer({
        className: 'clipped',
        source: new Static({
          url: firebaseURL,
          projection: imageProjectionNew,
          imageExtent,
          imageSize: [imageData.width, imageData.height],
          imageLoadFunction : (image) => {
            image.getImage().src = firebaseURL;
            if (image.resolution === undefined) {
              image.resolution = (image.extent[3] - image.extent[1]) / image.image_.height;
            }
            image.state = 2; // ImageState.LOADED;
            image.unlistenImage_();
            image.changed();
          }
        })
      });
      imagLayer.set('name', layerDataObj.name);
      imagLayer.set('type', 'IMAGE');
      imagLayer.setOpacity(0.7);
      if (!this._isLayerOnMap(layerDataObj)) {
        this.baseMapService.getCurrentBasemap().addLayer(imagLayer);
      }
      console.log('what is the extent data ', imageExtent, extent, extent3857);
      if(layerDataObj.isServer) {
        this.baseMapService.getCurrentBasemap().getView().fit(extent);
        this.baseMapService.getCurrentBasemap().getView().setZoom(this.baseMapService.getCurrentBasemap().getView().getZoom() - 1);
      } else {
        this.baseMapService.getCurrentBasemap().values_.view.setCenter(extent);
      } 
      
    }, 500);
    }, 200);
      console.log('mask data ', maskData, this._isLayerOnMap(layerDataObj));
      // Here need to apply crop image if mask enable
      if (maskData !== null && maskData !== undefined) {
        const polygonFeature = new Feature(new Polygon([maskData]));
        const source = new VectorSource({
          style: new Style({
            fill: new Fill({
              color: 'black'
            })
          })
        });
        source.addFeature(polygonFeature);
        const layer = new VectorLayer({
          source,
        });
        layer.set('name', 'polygonLayer');
        // layer.setZIndex(5);
        const style = new Style({
          fill: new Fill({
            color: 'black'
          })
        });
        /* const imageLayerSource = imagLayer.getSource();
        source.on('addfeature', () => {
          imagLayer.setExtent(source.getExtent());
        });
        imagLayer.on('postrender', (e) => {
          const vectorContext = getVectorContext(e);
          e.context.globalCompositeOperation = 'destination-in';
          source.forEachFeature((feature) => {
            vectorContext.drawFeature(feature, style);
          });
          e.context.globalCompositeOperation = 'source-over';
        }); */
        setTimeout(() => {
          this.baseMapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
            console.log('what is here current layer ', currentLayer, layerDataObj.name, currentLayer.values_.name);
            if (layerDataObj.name === currentLayer.values_.name) {
              const imageLayerSource = currentLayer.getSource();
              source.on('addfeature', () => {
                currentLayer.setExtent(source.getExtent());
              });
              currentLayer.on('postrender', (e) => {
                const vectorContext = getVectorContext(e);
                e.context.globalCompositeOperation = 'destination-in';
                source.forEachFeature((feature) => {
                  vectorContext.drawFeature(feature, style);
                });
                e.context.globalCompositeOperation = 'source-over';
              });
            }
          });
        }, 1500);
      }
    });
  }

  private _displayKmlImageLayer(layerDataObj, firebaseURL): any {
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: firebaseURL,
        format: new KML()
      })
    });
    vectorLayer.set('name', layerDataObj.name);
    if (!this._isLayerOnMap(layerDataObj)) {
      this.baseMapService.getCurrentBasemap().addLayer(vectorLayer);
      setTimeout(() => {
        if (vectorLayer.getSource().featuresRtree_.rbush_.data['minX'] !== 'Infinity') {
          const extent = [vectorLayer.getSource().featuresRtree_.rbush_.data.maxX, vectorLayer.getSource().featuresRtree_.rbush_.data.maxY];
          this.baseMapService.getCurrentBasemap().values_.view.setCenter(extent);
          this.baseMapService.getCurrentBasemap().getView().setZoom(12);
        }
      }, 5000);
    }
  }

  private _isLayerOnMap(layerDataObj): any {
    let isLayerOnMap: boolean = false;
    const layersLength = this.baseMapService.getCurrentBasemap().getLayers().getLength();
    if (layersLength > 0) {
      this.baseMapService.getCurrentBasemap().getLayers().forEach(layerObj => {
        if (layerObj !== undefined) {
          if (layerObj.values_.name === layerDataObj.name) {
            isLayerOnMap = true;
          }
        }
      });
    }
    return isLayerOnMap;
  }


  public _displayWmlLayer(layerDataObj): any {
    const imagSrc = '';
    const fileUrl = layerDataObj.firebaseUrl;

    // condition-1: is input url have query & json
    if (fileUrl.indexOf('query') > 0 || fileUrl.indexOf('=json') > 0) {
      let fetchURL = fileUrl;
      console.log('its inside query or json');
      fetchURL = fileUrl + '&outSR=4326&f=json';
      this.fetchURLProcess(fetchURL, layerDataObj, false);
    } else if (fileUrl.indexOf('.geojson') > 0) {
      // condition-2: is input url have only geojson
      const fetchURL = fileUrl;
      console.log('its inside geojson');
      this.fetchURLProcess(fetchURL, layerDataObj, true);
    } else {
      // condition-3: is input url have Layer(its wms service)
      // const parser = new WMSCapabilities();
      // fetch(fileUrl + '&REQUEST=GetCapabilities').then(function (response) {
      //   console.log(response);
      //   return response.text();
      // }).then((text) => {
      //   const result = parser.read(text);
      //   console.log('results ', result);
      //   // const extent = result.Capability.Layer.Layer.find(l => l.Name === layerName).EX_GeographicBoundingBox;
      //   const extent = result.Capability.Layer.EX_GeographicBoundingBox;
      //   console.log('extent ', extent);
      //   if (extent === undefined || extent === 'undefined') {
      //     imagSrc = fileUrl
      //     + '&REQUEST=GetCapabilities&request=GetMap&FORMAT=image/png&width=768&height=755&version=1.1.0&srs=EPSG:4326&styles=';
      //   } else {
      //     imagSrc = fileUrl + '&bbox=' + extent[0] + ',' + extent[1] + ',' + extent[2]
      //     + ',' + extent[3]
      //     + '&request=GetMap&FORMAT=image/png&width=768&height=755&version=1.1.0&srs=EPSG:4326&styles=';
      //   }
      // const extent = layerDataObj.metadata;
      let extent: Array<number> = [];
      if (typeof layerDataObj.metadata === 'string') {
        extent = window.JSON.parse(layerDataObj.metadata);
      } else {
        extent = layerDataObj.metadata;
      }
      const wmsSource = new tiles({
        url: fileUrl,
        projection: this.baseMapService.getBaseMapProjection(),
        serverType: 'geoserver',
        extent
      });
      const wmsLayer = new OlTileLayer({
        extent,
        source: wmsSource,
        name: layerDataObj.name
      });

      if (!this._isLayerOnMap(layerDataObj)) {
        this.baseMapService.getCurrentBasemap().addLayer(wmsLayer);
        if (this.commonService.isValid(extent)) {
          this.baseMapService.getCurrentBasemap().getView().fit(extent);
          this.baseMapService.getCurrentBasemap().getView().setZoom(this.baseMapService.getCurrentBasemap().getView().getZoom() - 1);
        }
      }
      // });

    }

  }

  private fetchURLProcess(fetchURL, layerDataObj, isGeojson): any {
    console.log('IN fetchURLProcess');
    console.log(fetchURL);
    console.log(isGeojson);

    let featureCollection = {};
    if (!this._isLayerOnMap(layerDataObj)) {
      if (this.commonService.isValid(layerDataObj['metadata'])) {
        featureCollection = layerDataObj['metadata'];
        console.log('results ', featureCollection);
        this._layerPreview(featureCollection, isGeojson);
      }
    }

  }
  private _layerPreview(geoJsonMapshaper, isGeojson): any {
    console.log('IN _layerPreview');
    console.log(geoJsonMapshaper);
    console.log(isGeojson);
    if (geoJsonMapshaper.length > 0) {
      geoJsonMapshaper.forEach((jsonObj) => {
        this._setLayerToMap(jsonObj, isGeojson);
      });
    } else {
      this._setLayerToMap(geoJsonMapshaper, isGeojson);
    }
  }

  private _setLayerToMap(geoJson, isGeojson): any {
    console.log('IN _setLayerToMap');
    console.log(geoJson);
    console.log(isGeojson);
    let featuresTypes = new GeoJSON();
    if (!isGeojson) {
      featuresTypes = new JSON();
    }
    const vectorSource = new VectorSource({
      features: (featuresTypes).readFeatures(geoJson, {
        featureProjection: this.basemapProjection
      })
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    vectorLayer.set('name', geoJson.fileName);
    this.baseMapService.getCurrentBasemap().addLayer(vectorLayer);

    this.baseMapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      // console.log(currentLayer);
      if (geoJson.fileName === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getExtent();
        this.baseMapService.getCurrentBasemap().getView().fit(extentValue);
        this.baseMapService.getCurrentBasemap().getView().setZoom(this.baseMapService.getCurrentBasemap().getView().getZoom() - 1);
      }
    });
  }

  // Here New code for rotation image raster
  returnRotateProjection(projection, rotation, extent, isGeorefData): any {
    // console.log('values are ', extent);
    // Its temp value.. i need to change to back
    console.log('changed to hard coded value ', extent, rotation, rotation * (180 / Math.PI));
    // rotation = rotation * (180 / Math.PI);
    // projection = 'EPSG:3857';
    const normalProjection = get('EPSG:4326');
    const rotatedProjection = new Projection({
      code: normalProjection.getCode() + ':' + rotation + ':' + extent,
      units: normalProjection.getUnits(),
      extent
    });
    addProjection(rotatedProjection);
    addCoordinateTransforms(
      'EPSG:4326',
      rotatedProjection,
      coordinate => {
        return this.rotateTransform(transform(coordinate, 'EPSG:4326', projection), rotation, extent);
        // return this.rotateTransform(coordinate, rotation, extent);
      },
      coordinate => {
        return this.normalTransform(transform(coordinate, projection, 'EPSG:4326'), rotation, extent);
      }
    );
    if(isGeorefData) {
      addCoordinateTransforms(
        projection,
        rotatedProjection,
        coordinate => {
          return this.rotateTransform(transform(coordinate, projection, 'EPSG:4326'), rotation, extent);
        },
        coordinate => {
          return transform(this.normalTransform(coordinate, rotation, extent), 'EPSG:4326', projection);
        }
      );  
    } else {
      this.getProjDef(projection).subscribe( projdef => {
      proj4.defs(projection, projdef);
      register(proj4);
      addCoordinateTransforms(
        projection,
        rotatedProjection,
        coordinate => {
          return this.rotateTransform(transform(coordinate, projection, 'EPSG:4326'), rotation, extent);
        },
        coordinate => {
          return transform(this.normalTransform(coordinate, rotation, extent), 'EPSG:4326', projection);
        }
      );    
    });
  }
    console.log('projection value ', proj4, rotatedProjection);
    if (typeof proj4 !== 'undefined') {
      const projCodes = Object.keys(proj4.defs);
      projCodes.forEach((code) => {
        if(isGeorefData) {
          let proj4Projection = get(code);
          if (!getTransform(proj4Projection, rotatedProjection)) {
            addCoordinateTransforms(
              proj4Projection,
              rotatedProjection,
              (coordinate) => {
                return this.rotateTransform(
                  transform(coordinate, proj4Projection, projection), rotation, extent);
              },
              (coordinate) => {
                return transform(
                  this.normalTransform(coordinate, rotation, extent), projection, proj4Projection);
              }
            );
          }
        } else {
          this.getProjDef(code).subscribe( projdef => {
            proj4.defs(code, projdef);
            register(proj4);
            let proj4Projection = get(code);
            if (!getTransform(proj4Projection, rotatedProjection)) {
              addCoordinateTransforms(
                proj4Projection,
                rotatedProjection,
                (coordinate) => {
                  return this.rotateTransform(
                    transform(coordinate, proj4Projection, projection), rotation, extent);
                },
                (coordinate) => {
                  return transform(
                    this.normalTransform(coordinate, rotation, extent), projection, proj4Projection);
                }
              );
            }
          });
        }
      });
    }
    return rotatedProjection;
  }
  rotateTransform(coordinate, rotation, extent): any {
    // console.log('rotateTransform ', extent);
    return this.rotateCoordinate(coordinate, rotation, getCenter(extent));
  }
  normalTransform(coordinate, rotation, extent): any {
    /* console.log('what is inside NT ',  coordinate, rotation, getCenter(extent));
    console.log(coordinate); */
    return this.rotateCoordinate(coordinate, -rotation, getCenter(extent));
  }
  rotateCoordinate(coordinate, angle, anchor): any {
    // console.log('what is inside RC ', coordinate, angle, anchor);
    const coord = rotate(
      [coordinate[0] - anchor[0], coordinate[1] - anchor[1]],
      angle
    );
    return [coord[0] + anchor[0], coord[1] + anchor[1]];
  }

  // new method added for projdef text getting from epsg.io
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
       // this.epsgCode = 'NO-EPSG';
       // console.log('no result for epsg ', this.epsgCode);
      }
      observer.next(projdef);
      observer.complete();
      });
    });
    });
  }

  tFFImagePreview(jpgURL, metadata) :any {
    /* const image = {
      url: jpgURL
    };
    console.log(jpgURL);
    console.log(metadata);
    let jgwxData = metadata.geodata;
    const xmlData = metadata.xmldata;
    this.xmlParser(xmlData); */

    let width, height, extent;

    fetch(jpgURL)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => {
      return fromArrayBuffer(arrayBuffer);
    })
    .then((tiff) => {
      return tiff.getImage();
    })
    .then((image) => {
      width = image.getWidth();
      height = image.getHeight();
      extent = image.getBoundingBox();
      const rg = image.readRGB();
      console.log('what i am getting here?? ', image, rg, extent)
      /* const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      context.drawImage(image.data, 0, 0, c.width, c.height);
var base64String = c.toDataURL(); */
      
      return image.readRGB();
    })
    .then((rgb) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      let data = context.getImageData(0, 0, width, height);
      console.log('what is data, ', data, rgb);
      let rgba = data.data;
      let j = 0;
      console.log('start time ', new Date().getTime())
      for (let i = 0; i < rgb.length; i += 3) {
        // console.log(rgb[i], ' :: ', rgba);
        data.data[j] = rgb[i] as number;
        data.data[j + 1] = 255;
        data.data[j + 2] = rgb[i + 2] as number;
        data.data[j + 3] = 255;
        j += 4;
      }
      // data.data = rgba;
      console.log('end time ', new Date().getTime())
      context.putImageData(data, 0, 0);

      this.baseMapService.getCurrentBasemap().addLayer(
        new ImageLayer({
          source: new Static({
            url: canvas.toDataURL(),
            imageExtent: extent,
            // Projection: this.basemapService.projection3857Code,
          }),
          name: this.fileName,
        })
      );
      console.log('Final time ', new Date().getTime())
      this.baseMapService.getCurrentBasemap().getView().fit(extent);
    }).catch((error) => {
      console.log(error);
      alert(error);
    });
  }

  private randomRainbowColor(min, max): any {
    return this.Colors[Math.floor(Math.random() * (max - min + 1)) + min];
  }

  private previewGeoJosn_Json_Files_new(layerObj, fileType): any {
    const tempThis = this;
    $.getJSON(layerObj.url, function(data){
      console.log('state data is ', data);
      tempThis.previewGeoJosn_Json_Files(data, fileType);
    });
  }

  private previewGeoJosn_Json_Files(metadata, fileType): any {   
    // let geojson_json_Data = window.JSON.parse(metadata).geodata;
    let geojson_json_Data = metadata;
    if (this.commonService.isValid(geojson_json_Data)) {
      console.log('VALID geojson_json : ', geojson_json_Data);
      // console.log('parsing ', JSON.parse(geojson_json_Data));
      let featureCollection;
      if(fileType === this.JSON_EXTENSION_CONSTANT) {
        featureCollection = {
          "type": "FeatureCollection",
          // "features": JSON.parse(geojson_json_Data)
          "features": geojson_json_Data
        }
      } else {
        featureCollection = geojson_json_Data;
      }
      console.log('featureCollection: ', featureCollection);
      const vectorSource = new VectorSource({
        features: (new GeoJSON()).readFeatures(featureCollection, {
          featureProjection: this.basemapProjection
        })
      });
      const fill = new Fill({
        color: 'rgba(255, 255, 255, 1)'
      });
      const stroke = new Stroke({
        // color: '#319FD3',
        color: this.randomRainbowColor(0, 6),
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
      vectorLayer.set('name', this.fileName);
      // vectorLayer.setStyle(vectorLayer.getStyle());
      vectorLayer.setOpacity(0.7);
      this.baseMapService.getCurrentBasemap().addLayer(vectorLayer);
      console.log('getting the styles ', vectorLayer.getStyle().defaultStyles, vectorLayer.getStyleFunction());
      // new code for zoom to extent
      this.baseMapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
        if (this.fileName === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.baseMapService.getCurrentBasemap().getView().fit(extentValue);
          this.baseMapService.getCurrentBasemap().getView().setZoom(this.baseMapService.getCurrentBasemap().getView().getZoom() - 1);
        }
      });

    }
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
