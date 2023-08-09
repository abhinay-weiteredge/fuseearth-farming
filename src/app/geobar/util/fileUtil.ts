import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { CommonService } from '../../Services/common.service';
import { KMLGroundOverlayParsing } from './kmlGroundOverlayParsing';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { AngularFireStorage } from '@angular/fire/storage/storage';
import * as XLSX from 'xlsx';
import { displayPartsToString } from 'typescript';
import { Extractor } from '@angular/compiler';
import jsPDF from 'jspdf';


export class FileUtil {
  private TEXT_CONSTANT = 'text';
  private SHP_EXTENSION_CONSTANT = '.shp';
  private DBF_EXTENSION_CONSTANT = '.dbf';
  private PRJ_EXTENSION_CONSTANT = '.prj';
  private ZIP_EXTENSION_CONSTANT = '.zip';
  private KML_EXTENSION_CONSTANT = '.kml';
  private KMZ_EXTENSION_CONSTANT = '.kmz';
  private JPG_EXTENSION_CONSTANT = '.jpg';
  private TIF_EXTENSION_CONSTANT = '.tif';
  private TIF_TIFW_EXTENSION_CONSTANT = '.tfw';
  private JPG_JGWX_EXTENSION_CONSTANT = '.jgwx';
  private JPG_XML_EXTENSION_CONSTANT = '.xml';
  private ALERT_CONSTANT = 'alert';
  private XLSX_EXTENSION_CONSTANT = '.xlsx';
  private PDF_EXTENSION_CONSTANT = '.pdf';
  private CSV_EXTENSION_CONSTANT = '.csv';
  private GEOJSON_EXTENSION_CONSTANT = '.geojson';
  private JSON_EXTENSION_CONSTANT = '.json';
  private PNG_EXTENSION_CONSTANT = '.png';
  private _inputFiles: any;
  static ExcelSheets; 
  static ExcelData ;
  static checkUpload = false
  static checkUploadExcel = false;
  static PdfData ;
  public fileUtilCallback: (returnData) => any;

  private _commonService: CommonService;
  kmlParsingProcess: KMLGroundOverlayParsing;
  baseService: BasemapService;

  zipWriter: any = null;
  filePreview: string;
  constructor(private basemapService: BasemapService, private firestorage: AngularFireStorage) {
    this._processZipFilesList = this._processZipFilesList.bind(this);
    this._commonService = new CommonService();
    this.baseService = basemapService;
    this.kmlParsingProcess = new KMLGroundOverlayParsing(this.baseService, this.firestorage);
  }

  private _returnFileUtil(inputFile, fileType, metaData, zipFile, msg = '') {
    return {
      inputFiles: inputFile,
      filetype: fileType,
      metadata: metaData,
      zipfile: zipFile,
      message: msg
    };
  }
  static checkExcelData(data){
    console.log(data, "check static function")
  }
  static checkPdfData(data){
    console.log(data, "check static function")
  }


  validationUploadedFile(inputFiles, options) {
    this._inputFiles = inputFiles;
    // Checking files size its any file
    if (!this._ckeckFileSize(inputFiles)) {
      // checking is zip file or single files
      if (this._isZipFile(inputFiles)) {
        console.log('Proceed!!! from zip file');
        return this._zipFileReader(inputFiles[0], this._processZipFilesList, options, this.ZIP_EXTENSION_CONSTANT);
        // single selected files validation
      } else if (this._validateSingleUnZipFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files');
        const files = [];
        console.log(inputFiles);
        Object.entries(inputFiles).forEach(file => {
          files.push(file[1]);
        });
        // this._createZipFile(this._inputFiles); // -- its not working correctly
        this.fileUtilCallback(this._returnFileUtil(files, this.ZIP_EXTENSION_CONSTANT, '', this._inputFiles));
      } else if (this._validateKMLFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files KML');
        this.fileUtilCallback(this._returnFileUtil(inputFiles[0], this.KML_EXTENSION_CONSTANT, '', this._inputFiles));
      } else if (this._validateJPGFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files JPG');
        this._processJPGTIFImageMetadata(inputFiles);
      } else if (this._validatePNGFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files PNG');
        this._processJPGTIFImageMetadata(inputFiles);
      } else if (this._validateTifFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files TIF');
        this._processJPGTIFImageMetadata(inputFiles);
      }
      else if (this._validateXlsxFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files XLSX');
        this._processXLSXFilesList(inputFiles);
      }  
      else if (this._validateCsvFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files CSV');
        this._processCSVFilesList(inputFiles, options);
      } 
      else if (this._validatePDFFiles(inputFiles)) {
        console.log('Proceed!!! from PDF');
        this._processPDFFilesList(inputFiles);
        
        
      } else if (this._validateGEOJSONFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files GEOJSON');
        this._processGEOJSON_JSON_FIles(inputFiles);
      } else if (this._validateJSONFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files JSON');
        this._processGEOJSON_JSON_FIles(inputFiles);
      } 
      else if (this._validateZipKMLFiles(inputFiles)) {
        console.log('Proceed!!! from Zipped selected Files KML');
        return this._zipFileReader(inputFiles[0], this._processZipFilesList, options, this.KMZ_EXTENSION_CONSTANT);
      } else {
        this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'WRONG_FILE'));
      }
    } else {
      this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'LARGE_FILE'));
    }
  }
  validationAwsUrl(options) {
    console.log('IN validationAwsUrl');
    console.log(options);
    const inputFiles = options.fileUrls;
    this._inputFiles = [];
    if (!this._ckeckFileSize(inputFiles)) {
      console.log('NOT LARGE FILE');
      // checking is zip file or single files
      if (this._isZipFile(inputFiles)) {
        console.log('Proceed!!! from zip file');
        // return this._zipFileReader(inputFiles[0], this._processZipFilesList, options, this.ZIP_EXTENSION_CONSTANT);
        return this._zipFileReaderForAws(inputFiles[0], this._processZipFilesList, options, this.ZIP_EXTENSION_CONSTANT);
        // single selected files validation
      } else if (this._validateSingleUnZipFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files');
        return this.multiFileReaderForAws(inputFiles, options, this.ZIP_EXTENSION_CONSTANT);
      }
      else if (this._validateKMLFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files KML');
        return this.multiFileReaderForAws(inputFiles, options, this.KML_EXTENSION_CONSTANT);
      } else if (this._validateJPGFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files JPG');
        return this.multiFileReaderForAws(inputFiles, options, this.JPG_EXTENSION_CONSTANT);
      } else if (this._validateTifFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files TIF');
        return this.multiFileReaderForAws(inputFiles, options, this.JPG_EXTENSION_CONSTANT);
      } else if (this._validateZipKMLFiles(inputFiles)) {
        console.log('Proceed!!! from Zipped selected Files KML');
        return this._zipFileReaderForAws(inputFiles[0], this._processZipFilesList, options, this.KMZ_EXTENSION_CONSTANT);
      }
      else if (this._validateXlsxFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files XLSX');
        return this.multiFileReaderForAws(inputFiles, options, this.XLSX_EXTENSION_CONSTANT);
      }
      else if (this._validateCsvFiles(inputFiles)) {
        console.log('Proceed!!! from single selected Files CSV');
        return this.multiFileReaderForAws(inputFiles, options, this.CSV_EXTENSION_CONSTANT);
      }
      else if (this._validatePDFFiles(inputFiles)) {
        console.log('Proceed!!! from PDF');
        return this.multiFileReaderForAws(inputFiles, options, this.PDF_EXTENSION_CONSTANT);
      }
      
      else {
        this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'WRONG_FILE'));
      }
    } else {
      this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'LARGE_FILE'));
    }
    // return this._zipFileReaderForAws(options.fileUrl, this._processZipFilesList, options, this.ZIP_EXTENSION_CONSTANT);
  }

  private multiFileReaderForAws(inputfiles, options, fileType) {
    console.log('In multiFileReaderForAws');
    console.log(inputfiles);
    console.log(zip);
    const filesList = [];
    let totalFilesCount = 0;
    const destination = [];
    const allFiles = [];
    inputfiles.forEach(file => {

      // THIS IS TO SKIP UN-NECESSARY DOWNLOAD OF JPG/TIFF/KML/KMZ FILES
      // WE CAN USE AWS URLs DIRECTLY...
      if (file.extension === this.JPG_EXTENSION_CONSTANT
        || file.extension === this.TIF_EXTENSION_CONSTANT
        || file.extension === this.KML_EXTENSION_CONSTANT
        || file.extension === this.KMZ_EXTENSION_CONSTANT
        || file.extension === this.XLSX_EXTENSION_CONSTANT
        || file.extension === this.CSV_EXTENSION_CONSTANT
        || file.extension === this.PDF_EXTENSION_CONSTANT){
        console.log('SKIPPING DOWNLOADING OF JPG/ KML/ KMZ/ TIFF/XLSX/CSV/PDF');
        allFiles.push(file);
      } else {
        destination.push(fetch(file.url));
        totalFilesCount++;
      }
    });
    Promise.all(destination).then((res: Array<Response>) => {
      console.log('ALL FILES RES');
      console.log(res);
      let currentFileNum = 0;
      res.forEach((fileRes: Response) => {
        console.log(fileRes);
        if (fileRes.status === 200) {
          fileRes.blob().then(blobRes => {
            const fileUrl = fileRes.url;
            let fileWithExtenstion = '';
            if (fileUrl.lastIndexOf('/') !== -1 ){
              fileWithExtenstion =  fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
              console.log(fileWithExtenstion);
            }
            const file =  new File([blobRes], fileWithExtenstion, {lastModified: new Date().getTime()});
            // Object.defineProperty(file, 'awsUrl', fileUrl);
            allFiles.push(file);
            console.log(blobRes);
            currentFileNum++;
            if (currentFileNum >= totalFilesCount) {
              console.log('All files loaded...');
              console.log(allFiles);
              if (fileType === this.ZIP_EXTENSION_CONSTANT) {
                this.fileUtilCallback(this._returnFileUtil(allFiles, fileType, '', []));
              } else {
                this.checkOtherFormatsForAws(allFiles, options);
              }
            } else {
              console.log('Few files pending...');
            }
          });
        } else{
          this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'READ_ERROR'));
        }
      });
      if (res.length === 0){
        this.checkOtherFormatsForAws(allFiles, options);
      }
    }).catch( error => {
      console.log(error);
      this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'READ_ERROR'));
    });

  }

  checkOtherFormatsForAws(inputFiles, options): void{
    if (this._validateKMLFiles(inputFiles)) {
      console.log('Proceed!!! from single selected Files KML');
      this.fileUtilCallback(this._returnFileUtil(inputFiles[0], this.KML_EXTENSION_CONSTANT, '', []));
    } else if (this._validateJPGFiles(inputFiles)) {
      console.log('Proceed!!! from single selected Files JPG');
      this._processJPGTIFImageMetadata(inputFiles);
    } else if (this._validateTifFiles(inputFiles)) {
      console.log('Proceed!!! from single selected Files TIF');
      this._processJPGTIFImageMetadata(inputFiles);
    } else if (this._validateZipKMLFiles(inputFiles)) {
      console.log('Proceed!!! from Zipped selected Files KML');
      return this._zipFileReader(inputFiles[0], this._processZipFilesList, options, this.KMZ_EXTENSION_CONSTANT);
    }
    
    // else if (this._validateCsvFiles(inputFiles)) {
    //   console.log('Proceed!!! from single selected Files CSV');
    //   this._processCSVFilesList(inputFiles);
    // } 
  }

  private _zipFileReaderForAws(inputfile, _processZipFilesList, options, fileType) {
    console.log('In _zipFileReaderForAws');
    console.log(inputfile);
    console.log(zip);
    const filesList = [];
    fetch(inputfile.url)
    .then( (response) => {
      console.log('got file');
      console.log(response);
      if (response.status === 200) {
        response.blob().then(blobRes => {
          console.log(blobRes);
          zip.createReader(new zip.BlobReader(blobRes) , (reader) => {
                reader.getEntries((entries) => {
                  entries.forEach(async (entry, index) => {
                    const filename = entry.filename;
                    entry.getData(new zip.BlobWriter(), (blob) => {
                      blob.name = filename;
                      filesList.push(blob);
                      if (filesList.length === entries.length) {
                        const jsonObj = {
                          FilesList: filesList
                        };
                        _processZipFilesList(filesList, options, fileType, inputfile);
                      }
                    });
                  });
                });
              });
        });
      } else{
        this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'READ_ERROR'));
      }

    });

  }
  // #TODO - still working on this creating zip and add uploaded files
  _createZipFile(inputFiles, callback): void{
    // const _zip = new JSZip();
    this.getZipFileMethod1(inputFiles, callback);
    // this.getZipFileMethod2(inputFiles, callback);
  }

  getZipFileMethod1(files, callback): void{
      const writ = new zip.BlobWriter('application/zip');
      console.log(writ);
      zip.createWriter(writ, (writer) => {
          console.log(writer);
          this.zipWriter = writer;
          if (files.length > 0) {
            this.addNextFileToZip(0, files, (onSuccess) => {
              console.log(onSuccess);
              this.zipWriter.close((blob) => {
                // this.saveZipBlob(blob, callback);
                callback(blob);
                this.zipWriter = null;
              });
            });
          }
      });
  }

  addNextFileToZip(currentCount, files, onSuccess): void{
    // console.log('addNextFile', currentCount, files);
    this.zipWriter.add(files[currentCount].name,
      new zip.BlobReader(files[currentCount]),
      () => {
        currentCount++;
        if (currentCount < files.length) {
          console.log('files exist');
          this.addNextFileToZip(currentCount, files, onSuccess);
        } else {
          console.log('All are done...');
          onSuccess('success');
        }
    });
  }

  getZipFileMethod2(inputFiles, finalCallback): void{
    const model = (() => {
      const obj: any = window;
      let zipWriter; let writer;
      const URL = obj.webkitURL || obj.mozURL || obj.URL;

      return {

        addFiles : function addFiles(files, oninit, onadd, onprogress, onend): void{
              let addIndex = 0;
              function nextFile(): void{
                const file = files[addIndex];
                onadd(file);
                zipWriter.add(file.name, new zip.BlobReader(file), () => {
                  console.log('File added');
                  addIndex++;
                  if (addIndex < files.length) {
                    nextFile();
                  } else {
                    onend();
                  }
                }, onprogress);
              }

              function createZipWriter(): void{
                console.log('createZipWriter : ', writer);
                zip.createWriter(writer, (inWriter) => {
                  console.log('create writer callback');
                  zipWriter = inWriter;
                  // console.log(writer, ' : ', zipWriter);
                  // oninit();
                  nextFile();
                }, (error) => {});
              }
              writer = new zip.BlobWriter('application/zip');
              createZipWriter();
        },
        getBlobURL : (callback) => {
              zipWriter.close((blob) => {
                const blobURL = URL.createObjectURL(blob);
                callback(blobURL);
                zipWriter = null;
              });
        },
        getBlob : (callback) => {
              zipWriter.close(callback);
        }
      };
    })();

    model.addFiles(inputFiles, () => { }, (file) => { }, (current, total) => { },
      () => {
        console.log('All files read complete...');
        model.getBlob((blob) => {
          console.log(blob);
          finalCallback(blob);
          this.zipWriter = null;
          // this.saveZipBlob(blob);
        });
    });
  }

  saveZipBlob(blob): void{
    console.log('In saveZip');
    console.log(blob);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = 'shapeFile.zip';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    this.zipWriter = null;
  }

  private _readerAsPromise(streamContent: any, readType: string) {
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

  pFileReaderAsText(file: any) {
    return this._readerAsPromise(file, this.TEXT_CONSTANT);
  }

  pFileReaderAsArrayBuffer(file: any) {
    return this._readerAsPromise(file, 'buffer-array');
  }

  pBufferReaderAsText(buffer: any) {
    const blob = new Blob([new Uint8Array(buffer)]);
    return this._readerAsPromise(blob, this.TEXT_CONSTANT);
  }

  private _processJPGTIFImageMetadata(inputFiles) {
    let jpg_tiff_geodata: any;
    let geodataFileType: any;
    let jpgXMLFile: any;
    let fileType: any;
    if (this.getFile(inputFiles, this.JPG_EXTENSION_CONSTANT)
    || this.getFile(inputFiles, this.PNG_EXTENSION_CONSTANT)) {
      geodataFileType = this.JPG_JGWX_EXTENSION_CONSTANT;
      jpgXMLFile = this.JPG_XML_EXTENSION_CONSTANT;
      fileType = this.JPG_EXTENSION_CONSTANT;
      if(this.getFile(inputFiles, this.PNG_EXTENSION_CONSTANT)) {
        fileType = this.PNG_EXTENSION_CONSTANT;
      }
    } else {
      geodataFileType = this.TIF_TIFW_EXTENSION_CONSTANT;
      fileType = this.TIF_EXTENSION_CONSTANT;
      jpgXMLFile = this.JPG_XML_EXTENSION_CONSTANT;
    }
    const jpgXMLFileStream = this.getFile(inputFiles, jpgXMLFile);
    const inputFilesStream = this.getFile(inputFiles, fileType);
    const geoDataFilesStream = this.getFile(inputFiles, geodataFileType);
    console.log('checking the jpgXMLFileStream : ', jpgXMLFileStream, inputFilesStream,
      geoDataFilesStream, jpgXMLFile, fileType, geodataFileType);
    if (!this._commonService.isValid(jpgXMLFileStream) && !this._commonService.isValid(geoDataFilesStream)) {
      // here upload the firebase
      jpg_tiff_geodata = {
        geodata: '',
        xmldata: 'result'
      };
      this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, jpg_tiff_geodata, this._inputFiles));
      // Here getting error if no geodata file
    } else if (!this._commonService.isValid(geoDataFilesStream) && this._commonService.isValid(jpgXMLFileStream)) {
      this.pFileReaderAsText(jpgXMLFileStream)
      .then((value) => {
        // here upload the firebase
        jpg_tiff_geodata = {
          geodata: '',
          xmldata: value
        };
        this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, jpg_tiff_geodata, this._inputFiles));
      });
    } else if (this._commonService.isValid(geoDataFilesStream) && !this._commonService.isValid(jpgXMLFileStream)) {
      this.pFileReaderAsText(geoDataFilesStream)
        .then((value) => {
          // here upload the firebase
          jpg_tiff_geodata = {
            geodata: value,
            xmldata: 'result'
          };
          this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, jpg_tiff_geodata, this._inputFiles));
        });
    } else {
      this.pFileReaderAsText(geoDataFilesStream)
        .then((value) => {
          // here upload the firebase
          this.pFileReaderAsText(jpgXMLFileStream).then((result) => {
            jpg_tiff_geodata = {
              geodata: value,
              xmldata: result
            };
            this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, jpg_tiff_geodata, this._inputFiles));
          });
        });
    }
  }

  private _processZipFilesList(filesList, options, fileType, inputfile) {
    console.log(filesList);
    if (fileType === this.KMZ_EXTENSION_CONSTANT) {
      if (this._validateKMLFiles(filesList)) {
        const kmzFile: any = this.getFile(filesList, this.KML_EXTENSION_CONSTANT);
        kmzFile.name = inputfile.name.split('.')[0] + this.KML_EXTENSION_CONSTANT;
        // here we need to find jpg/png related files and display on map
        this.kmlParsingProcess.processKMLParsing(filesList, kmzFile.name, kmzFile);
        setTimeout(() => {
          return this.fileUtilCallback(this._returnFileUtil(kmzFile, this.KMZ_EXTENSION_CONSTANT, '', this._inputFiles));
        }, 20000);
      }
    } else {
      if (this._validateSingleUnZipFiles(filesList)) {
        console.log('In _processZipFilesList : _validateSingleUnZipFiles_TRUE');
        this.fileUtilCallback(this._returnFileUtil(filesList, this.ZIP_EXTENSION_CONSTANT, '', inputfile));
      } else {
        console.log('In _processZipFilesList : _validateSingleUnZipFiles_FALSE');
        this.fileUtilCallback(this._returnFileUtil('', this.ALERT_CONSTANT, '', this._inputFiles, 'WRONG_FILE'));
      }
    }
  }

  private _zipFileReader(inputfile, _processZipFilesList, options, fileType) {
    const filesList = [];
    zip.createReader(new zip.BlobReader(inputfile), (reader) => {
      reader.getEntries((entries) => {
        entries.forEach(async (entry, index) => {
          const filename = entry.filename;
          entry.getData(new zip.BlobWriter(), (blob) => {
            blob.name = filename;
            filesList.push(blob);
            if (filesList.length === entries.length) {
              const jsonObj = {
                FilesList: filesList
              };
              _processZipFilesList(filesList, options, fileType, inputfile);
            }
          });
        });
      });
    });
  }
  ////XLSX=======================================================================
  public _processXLSXFilesList(inputFile) {    
    let workBook = null;
    let jsonData = null;
    let xlsx_json_data: any;    
    const reader = new FileReader();
    const file = inputFile[0];
    const inputFilesStream = this.getFile(inputFile, this.XLSX_EXTENSION_CONSTANT);
    reader.onload = (event) => {
      const data = reader.result;      
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = workBook.SheetNames.reduce((initial, name) => {
        FileUtil.ExcelSheets = workBook.SheetNames
        console.log(workBook.SheetNames)
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet); 
        FileUtil.checkUploadExcel = true
        FileUtil.ExcelData = initial        
        FileUtil.checkExcelData(initial)
        console.log(initial);
        // return initial; 
      }, {});      
      const dataString = JSON.stringify(jsonData);
      console.log(dataString) 
      xlsx_json_data= {
        geodata: dataString,
        xmldata: 'result'
      };      
  };
  reader.readAsBinaryString(file);
  console.log('returning ', xlsx_json_data)
  this.fileUtilCallback(this._returnFileUtil(inputFilesStream, this.XLSX_EXTENSION_CONSTANT, xlsx_json_data, this._inputFiles));
  }
  
// CSV=============================================================================================================
public _processCSVFilesList(inputFile, option){
  let workBook = null;
  let jsonData = null;
  let xlsx_json_data: any;
  
  const reader = new FileReader();
  const file = inputFile[0];
  const inputFilesStream = this.getFile(inputFile, this.CSV_EXTENSION_CONSTANT);
  reader.onload = (event) => {
    const data = reader.result;
    
    workBook = XLSX.read(data, { type: 'binary' });
    /* jsonData = workBook.SheetNames.reduce((initial, name) => {
      FileUtil.ExcelSheets = workBook.SheetNames
      console.log(workBook.SheetNames)
      const sheet = workBook.Sheets[name];
      initial[name] = XLSX.utils.sheet_to_json(sheet); 
      FileUtil.checkUploadExcel = true
      FileUtil.ExcelData = initial
      
      
    FileUtil.checkExcelData(initial)
      console.log(initial); 
      
      
      
      return initial; 
    }, {}); */
    console.log(option,"check option")
    option.geobar.showExcelData = true;
    
    
    const dataString = JSON.stringify(jsonData);
    console.log(dataString)
  
    xlsx_json_data= {
      geodata: dataString,
      xmldata: 'result'
    };
    
};
reader.readAsBinaryString(file);


  this.fileUtilCallback(this._returnFileUtil(inputFilesStream, this.CSV_EXTENSION_CONSTANT, xlsx_json_data, this._inputFiles));

}
  // PDF-PROCESS======================================================================================
  
  private _processPDFFilesList(inputFile){
    let reader = new FileReader();
    
    
    
    // let workBook = null;
     let pdf_json_data: any;
    // let jsonData = null;
    
    let file = inputFile[0];
    
    console.log(file,"00000000000000000000000000000000000");
    FileUtil.checkUpload = true
        FileUtil.PdfData = file
      FileUtil.checkPdfData(file)
   
    
    const inputFilesStream = this.getFile(inputFile, this.PDF_EXTENSION_CONSTANT);
    

    reader.onload = (event) => {
      const data = reader.result;
      console.log(data,"ffffffffffffffffffffffff");
      
      var fileName = file.name + " " + file.type;  
    console.log(fileName,"sssssssssssssssssssssssssssssssssss");
      const doc = new jsPDF();  
      let base64ImgString = (data as string).split(',')[1];  
      console.log((base64ImgString),"kkkkkkkkkkkkkkkkkkkkkk");
      doc.addImage(base64ImgString,15, 40, 50, 50);  
      this.filePreview = 'data:image/png' + ';base64,' + base64ImgString;  
      doc.save('TestPDF');
      console.log(doc,"ssssssssssssssssssssssssssssssssssssssssssssss");  
 
  };
  reader.readAsDataURL(file);
  
 
    this.fileUtilCallback(this._returnFileUtil(inputFilesStream, this.PDF_EXTENSION_CONSTANT, pdf_json_data, this._inputFiles));
  }
 


  getFile(files: any, fileType: string) {
    return Array.from(files).find( (file: any) => {
      let fileExt = file.name.match(/\.[0-9a-z]+$/i);
      fileExt = fileExt ? fileExt[0] : '';
      return fileExt.toUpperCase() === fileType.toUpperCase();
    });
  }

  private _isZipFile(inputFiles) {
    console.log('isZipFile ', inputFiles);
    if (this.getFile(inputFiles, this.ZIP_EXTENSION_CONSTANT)) {
      return true;
    }
    return false;
  }

  private _ckeckFileSize(inputFiles) {
    let isLargFile = false;
    Array.from(inputFiles).forEach((file: any) => {
      const _convertedSize = (file.size / (1024 * 1024)).toFixed(1);
      if (Number(_convertedSize) > 100) {
        isLargFile = true;
      }
    });
    return isLargFile;
  }

  private _validateSingleUnZipFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.SHP_EXTENSION_CONSTANT)
      || !this.getFile(inputFiles, this.DBF_EXTENSION_CONSTANT)
      || !this.getFile(inputFiles, this.PRJ_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }

  private _validateKMLFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.KML_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }

  private _validateZipKMLFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.KMZ_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  

  private _validateJPGFiles(inputFiles) {
    // if (!this.getFile(inputFiles, this.JPG_EXTENSION_CONSTANT)
    //    || !this.getFile(inputFiles, this.JPG_JGWX_EXTENSION_CONSTANT)
    //    || !this.getFile(inputFiles, this.JPG_XML_EXTENSION_CONSTANT)) {
    //    return false;
    // }
    // return true;
    if (this.getFile(inputFiles, this.JPG_EXTENSION_CONSTANT) ||
          ( this.getFile(inputFiles, this.JPG_EXTENSION_CONSTANT) &&
            this.getFile(inputFiles, this.JPG_JGWX_EXTENSION_CONSTANT ) &&
            this.getFile(inputFiles, this.JPG_XML_EXTENSION_CONSTANT)
        )
      ) {
      return true;
    }
    return false;
  }

  private _validatePNGFiles(inputFiles) {
    if (this.getFile(inputFiles, this.PNG_EXTENSION_CONSTANT) ||
          ( this.getFile(inputFiles, this.PNG_EXTENSION_CONSTANT) &&
            this.getFile(inputFiles, this.JPG_JGWX_EXTENSION_CONSTANT ) &&
            this.getFile(inputFiles, this.JPG_XML_EXTENSION_CONSTANT)
        )
      ) {
      return true;
    }
    return false;
  }

  private _validateTifFiles(inputFiles) {
    /* if (!this.getFile(inputFiles, this.TIF_EXTENSION_CONSTANT)
      || !this.getFile(inputFiles, this.TIF_TIFW_EXTENSION_CONSTANT)) {
      return false;
    } */
    if (!this.getFile(inputFiles, this.TIF_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  private _validateGEOJSONFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.GEOJSON_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  private _validateJSONFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.JSON_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  private _validateXlsxFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.XLSX_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  private _validateCsvFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.CSV_EXTENSION_CONSTANT)) {
      return false;
    }
    return true;
  }
  private _validatePDFFiles(inputFiles) {
    if (!this.getFile(inputFiles, this.PDF_EXTENSION_CONSTANT)) {
      return false;
    }
    
    return true;
  }
/* function typeOf(data: string | ArrayBuffer): any {
  throw new Error('Function not implemented.');
}

function afterLoadComplete(pdf: any, PDFDocumentProxy: any) {
  throw new Error('Function not implemented.');
} */
private _processGEOJSON_JSON_FIles(inputFiles) {
    let geojson_json_geodata: any;
    let geojson_json_File: any;
    let fileType: any;
    if (this.getFile(inputFiles, this.GEOJSON_EXTENSION_CONSTANT)) {
      geojson_json_File = this.GEOJSON_EXTENSION_CONSTANT;
      fileType = this.GEOJSON_EXTENSION_CONSTANT;
    } else if (this.getFile(inputFiles, this.JSON_EXTENSION_CONSTANT)) {
      geojson_json_File = this.JSON_EXTENSION_CONSTANT;
      fileType = this.JSON_EXTENSION_CONSTANT;
    }
    const geojson_json_FileStream = this.getFile(inputFiles, geojson_json_File);
    const inputFilesStream = this.getFile(inputFiles, fileType);
    console.log('checking the jpgXMLFileStream : ', geojson_json_FileStream, inputFilesStream,
    geojson_json_File, fileType);
    if (!this._commonService.isValid(geojson_json_FileStream)) {
      // here upload the firebase
      geojson_json_geodata = {
        geodata: '',
        xmldata: 'result'
      };
      this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, geojson_json_geodata, this._inputFiles));
      // Here getting error if no geodata file
    } else {
      this.pFileReaderAsText(geojson_json_FileStream).then((result) => {
        geojson_json_geodata = {
              geodata: '',
              xmldata: 'result'
            };
            this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, geojson_json_geodata, this._inputFiles));
          });
    }
  }

  private _process_PDF_FIles(inputFiles) {
    let pdf_geodata: any;
    let pdf_File: any;
    let fileType: any;
    if (this.getFile(inputFiles, this.PDF_EXTENSION_CONSTANT)) {
      pdf_File = this.PDF_EXTENSION_CONSTANT;
      fileType = this.PDF_EXTENSION_CONSTANT;
    }
    const geojson_json_FileStream = this.getFile(inputFiles, pdf_File);
    const inputFilesStream = this.getFile(inputFiles, fileType);
    console.log('checking the pdfStream : ', geojson_json_FileStream, inputFilesStream, fileType);
    if (!this._commonService.isValid(geojson_json_FileStream)) {
      // here upload the firebase
      pdf_geodata = {
        geodata: '',
        xmldata: 'result'
      };
      this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, pdf_geodata, this._inputFiles));
      // Here getting error if no geodata file
    } else {
      this.pFileReaderAsText(geojson_json_FileStream).then((result) => {
        console.log('Here PDF extraction ', result);
        pdf_geodata = {
              geodata: result,
              xmldata: 'result'
            };
            this.fileUtilCallback(this._returnFileUtil(inputFilesStream, fileType, pdf_geodata, this._inputFiles));
          });
    }
  }
}
