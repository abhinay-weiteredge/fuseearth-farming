import { Component, OnInit, ViewChild, ElementRef ,VERSION, HostListener} from '@angular/core';
import Overlay from 'ol/Overlay';
import { TowerItemComponent } from '../../tower-item/tower-item.component';
import { Style, Fill, Stroke ,Icon} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import * as ol from 'ol';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { BasemapService } from 'src/app/basemap/basemap.service';
// import * as chroma from 'chroma-js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-depiction',
  templateUrl: './depiction.component.html',
  styleUrls: ['./depiction.component.scss']
})
export class DepictionComponent implements OnInit {
  color1;
  
  pickerStatus = "none";
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  depProperties = [];
  depictionforlayer: any;
  static setoutlinecolorforMP= "#000000";
  layerobj: any;
  showoutlinethicknesspopup=false
  symbols=['../../../../assets/images/geo-alt-fill.svg','../../../../assets/images/square.svg','../../../../assets/images/star.svg','../../../../assets/images/circle.svg','../../../../assets/images/triangle.svg','../../../../assets/images/pentagon.svg'];
  
  lineWidths = [
    { name: '1px', value: 1, icon: 'fas fa-minus' },
    { name: '2px', value: 2, icon: 'fas fa-minus' },
    { name: '3px', value: 3, icon: 'fas fa-minus' }
  ];
  selectedStrokeWidth = 3;
  selectedthickness: any;
  selectedlinestyle=[1];
  showoutlinestylepopup=false;
  setfillcolor='rgba(255, 255, 255, 1)';
  selectedsymbolurl: string;
  outlinecolor: string;
  setfillcolor3: any;
  svg: string;
  firstsymbol: string;
  showsymbolpopup=false
  static setoutlinecolorforMP1: string;
  outlinecolor1: string;
  selectedthickness1=false;
  selectedlinestyle1: number[];
  showoutlinestylepopup1=false;
  showoutlinethicknesspopup1=false;
  
  selectStrokeWidth(width: number) {
    this.selectedStrokeWidth = width;
    // Do something with the selected stroke width value
  }
  constructor(private basmapservice: BasemapService,private http: HttpClient ) {}
  colorList = ['#ff0000', '#00ff00', '#0000ff'];
  ngOnInit() { 
    DepictionComponent.setoutlinecolorforMP='';
    this.firstsymbol=this.symbols[0];
    
  }
  ngOnChange(){
    this.depictionforlayer=TowerItemComponent.selectedLayergeometrictype;
    this.layerobj=TowerItemComponent.towertodepiction;
    console.log(this.depictionforlayer)
    var select = document.querySelector("select");

select.addEventListener("change", function() {
    var selected = document.querySelector("option:checked");
    var selectedFontSize = getComputedStyle(selected, null).getPropertyValue("font-size");
    select.style.fontSize = selectedFontSize;
    console.log(selectedFontSize,"importantfontsize")
});
  }
  getDepctionPopup() {
    console.log(TowerItemComponent.selectedLayergeometrictype)
    console.log(TowerItemComponent.towertodepiction,"Layerindepiction")
    this.depictionforlayer=TowerItemComponent.selectedLayergeometrictype;
    console.log(this.depictionforlayer == 'MultiPolygon')
    this.layerobj=TowerItemComponent.towertodepiction;
    this._popupOverlay = new Overlay({
      element: this._containerEl.nativeElement,
      offset: [-600, 250],
      autoPan: true,
      autoPanAnimation: {
          duration: 250
      }
  });
    this._closerEl.nativeElement.onclick = () => {
      this.close();
    };
    return this._popupOverlay;
  }

  public close() {
    this._popupOverlay.setPosition(undefined);
    this._closerEl.nativeElement.blur();
    return false;
  }

  setPropertyValues(depProperties) {
    this.depProperties = [];
    Object.entries(depProperties).forEach(entry => {
      const jsonObj = {
        title : entry[0],
        value : entry[1]
      };
      this.depProperties.push(jsonObj);
  });
  }
  selectedColor = "#0000ff";
  selectedColor3="#000000";
  selectColor2='rgba(255, 255, 255, 1)';

  selectOutlineColorFun(color: string) {
    console.log(color,"checking color");
    console.log(this.layerobj,"layerinsetcolor")
    DepictionComponent.setoutlinecolorforMP=color;
    this.outlinecolor=color;
    // logic to update color value
    console.log( DepictionComponent.setoutlinecolorforMP,"checking color");
    
      /* We are using two different styles for the polygons:
       *  - The first style is for the polygons themselves.
       *  - The second style is to draw the vertices of the polygons.
       *    In a custom `geometry` function the vertices of a polygon are
       *    returned as `MultiPoint` geometry, which will be used to render
       *    the style.
       */
      const polystyle=new Style({
        stroke: new Stroke({
          color: color,
          width: 3,
          lineDash: this.selectedlinestyle,
        }),
        fill: new Fill({
          color:  this.setfillcolor,
        }),
      })
      
    
    this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (this.layerobj.name === currentLayer.values_.name) {
        console.log(currentLayer,"inbasemapservice")
        currentLayer.setStyle(polystyle)
      }
    });
    // const geojsonObject =this.layerobj.metadata[0]
    // const source = new VectorSource({
    //   features: new GeoJSON().readFeatures(geojsonObject),
    // });
   
    // const layer = new VectorLayer({
    //   source: source,
    //   style: styles,
    // });
    
    
// Set the new style on the vector layer

    
}
selectOutlineColorFun4(color: string) {
  console.log(color,"checking color");
  console.log(this.layerobj,"layerinsetcolor")
  DepictionComponent.setoutlinecolorforMP1=color;
  this.outlinecolor1=color;
  // logic to update color value
  console.log( DepictionComponent.setoutlinecolorforMP1,"checking color");
  
    /* We are using two different styles for the polygons:
     *  - The first style is for the polygons themselves.
     *  - The second style is to draw the vertices of the polygons.
     *    In a custom `geometry` function the vertices of a polygon are
     *    returned as `MultiPoint` geometry, which will be used to render
     *    the style.
     */
    const polystyle=new Style({
      stroke: new Stroke({
        color: color,
        width: this.selectedthickness1,
        lineDash: this.selectedlinestyle1,
      }),
      fill: new Fill({
        color:  this.setfillcolor,
      }),
    })
    
  
  this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
    if (this.layerobj.name === currentLayer.values_.name) {
      console.log(currentLayer,"inbasemapservice")
      currentLayer.setStyle(polystyle)
    }
  });
  // const geojsonObject =this.layerobj.metadata[0]
  // const source = new VectorSource({
  //   features: new GeoJSON().readFeatures(geojsonObject),
  // });
 
  // const layer = new VectorLayer({
  //   source: source,
  //   style: styles,
  // });
  
  
// Set the new style on the vector layer

  
}
selectfillColorFun(fillcolor){
  this.setfillcolor=fillcolor
  const polystyle=new Style({
    stroke: new Stroke({
      color: DepictionComponent.setoutlinecolorforMP,
      width: 3,
      lineDash: this.selectedlinestyle,
    }),
    fill: new Fill({
      color: fillcolor,
    }),
  })
  

this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
  if (this.layerobj.name === currentLayer.values_.name) {
    console.log(currentLayer,"inbasemapservice")
    currentLayer.setStyle(polystyle)
  }
});

}
setlinethickness(thickness){
this.selectedthickness=thickness;
console.log(this.selectedthickness,"selected thickness")
this.showoutlinethicknesspopup=!this.showoutlinethicknesspopup
if(this.showoutlinestylepopup==true){
  this.showoutlinestylepopup=!this.showoutlinestylepopup
}
const polystyle=new Style({
  stroke: new Stroke({
    color: DepictionComponent.setoutlinecolorforMP,
    width: this.selectedthickness,
    lineDash: this.selectedlinestyle,
  }),
  fill: new Fill({
    color: this.setfillcolor,
  }),
})


this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
if (this.layerobj.name === currentLayer.values_.name) {
  console.log(currentLayer,"inbasemapservice")
  currentLayer.setStyle(polystyle)
}
});
}
setlinethickness1(thickness){
  this.showoutlinestylepopup1=false
  this.selectedthickness1=thickness;
  console.log(this.selectedthickness1,"selected thickness")
  this.showoutlinethicknesspopup=!this.showoutlinethicknesspopup
  if(this.showoutlinestylepopup==true){
    this.showoutlinestylepopup=!this.showoutlinestylepopup
  }
  const polystyle=new Style({
    stroke: new Stroke({
      color: DepictionComponent.setoutlinecolorforMP1,
      width: this.selectedthickness1,
      lineDash: this.selectedlinestyle1,
    }),
    fill: new Fill({
      color: this.setfillcolor,
    }),
  })
  
  this.showoutlinethicknesspopup1=!this.showoutlinethicknesspopup1;
  this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
  if (this.layerobj.name === currentLayer.values_.name) {
    console.log(currentLayer,"inbasemapservice")
    currentLayer.setStyle(polystyle)
  }
  });
 
    
  
  }
setlinestyle(linestyle){
  console.log(linestyle)
  if(linestyle=='dashed'){
    this.selectedlinestyle=[12,11]
    console.log(linestyle)
  }
  else if(linestyle=='dotted'){
    this.selectedlinestyle=[1,6]
    console.log(linestyle)
  }
  else if(linestyle=='line'){
    this.selectedlinestyle=[0];
    console.log(linestyle)
  }
  const polystyle=new Style({
    stroke: new Stroke({
      color: DepictionComponent.setoutlinecolorforMP,
      width: this.selectedthickness,
      lineDash: this.selectedlinestyle,
    }),
    fill: new Fill({
      color: this.setfillcolor,
    }),
  })
  
  
  this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
  if (this.layerobj.name === currentLayer.values_.name) {
    console.log(currentLayer,"inbasemapservice")
    currentLayer.setStyle(polystyle)
  }
  });
  console.log(this.selectedlinestyle,"selected thickness")
  this.showoutlinestylepopup=!this.showoutlinestylepopup
  if(this.showoutlinethicknesspopup==true){
    this.showoutlinethicknesspopup=!this.showoutlinethicknesspopup
  }

}
setlinestyle1(linestyle){
  console.log(linestyle)
  if(linestyle=='dashed'){
    this.selectedlinestyle1=[12,11]
    console.log(linestyle)
  }
  else if(linestyle=='dotted'){
    this.selectedlinestyle1=[1,6]
    console.log(linestyle)
  }
  else if(linestyle=='line'){
    this.selectedlinestyle1=[0];
    console.log(linestyle)
  }
  const polystyle=new Style({
    stroke: new Stroke({
      color: DepictionComponent.setoutlinecolorforMP1,
      width: this.selectedthickness1,
      lineDash: this.selectedlinestyle1,
    }),
    fill: new Fill({
      color: this.setfillcolor,
    }),
  })
  
  
  this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
  if (this.layerobj.name === currentLayer.values_.name) {
    console.log(currentLayer,"inbasemapservice")
    currentLayer.setStyle(polystyle)
  }
  });
  console.log(this.selectedlinestyle,"selected thickness")
  this.showoutlinestylepopup1=!this.showoutlinestylepopup1
  if(this.showoutlinethicknesspopup1==true){
    this.showoutlinethicknesspopup1=!this.showoutlinethicknesspopup1
  }

}
selectsymbol(id){
  console.log(id,"selectedimageid")
  this.selectedsymbolurl=this.symbols[id]
  this.firstsymbol=this.selectedsymbolurl
  this.http.get( this.selectedsymbolurl, {responseType: 'text'}).subscribe(svg => {
   
    svg = svg.replace(/fill="[^"]*"/, `fill="${this.setfillcolor3}"`);
      this.svg=svg
      const polystyle=new Style({
 
        image: new Icon({
         
          src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(this.svg),
          scale: 1.5
        })
      })
      this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
        if (this.layerobj.name === currentLayer.values_.name) {
          console.log(currentLayer,"inbasemapservice")
          currentLayer.setStyle(polystyle)
        }
        });
});

this.showsymbolpopup=!this.showsymbolpopup;

}


selectsymbolColorFun(fillcolor){
  this.setfillcolor3=fillcolor
  console.log( this.setfillcolor3)

  this.http.get( this.selectedsymbolurl, {responseType: 'text'}).subscribe(svg => {
   
    svg = svg.replace(/fill="[^"]*"/, `fill="${fillcolor}"`);
      this.svg=svg
      const polystyle=new Style({
 
        image: new Icon({
         
          src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(this.svg),
          scale: 1.5
        })
      })
      this.basmapservice.getCurrentBasemap().getLayers().forEach(currentLayer => {
        if (this.layerobj.name === currentLayer.values_.name) {
          console.log(currentLayer,"inbasemapservice")
          currentLayer.setStyle(polystyle)
        }
        });
});


 
    
}

}
