import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { AuthObservableService } from '../Services/authObservableService';
import { GeoNotePadService } from '../Services/geo-notepad.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-geo-notepad',
  templateUrl: './geo-notepad.component.html',
  styleUrls: ['./geo-notepad.component.scss']
})
export class GeoNotepadComponent implements OnInit {

  savedNotes: any = [];
  operation = 'add';
  errorMsg: String = '';
  @ViewChild('notes') notes: ElementRef<HTMLInputElement>;
  selectedNote: any = {};
  @Input() showNotePad: boolean = false;
  @Output() close: EventEmitter<any> = new EventEmitter<any>();

  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  positionMarkObserver: Subject<any> = new Subject<any>();
  goingToMarkPosition: boolean = false;
  minimizedWindow: boolean = false;
  // locationCollected:boolean=false;
  locationData: any = null;


  constructor(private authObsr: AuthObservableService, private notePadService: GeoNotePadService) {
    this.positionMarkObserver.subscribe(res => {
      console.log('POSITION MARKED');
      console.log(res);
      const coords = res['co-ordinates'];
      this.locationData = coords;
      this.goingToMarkPosition = false;
      // this.locationCollected=true;
      // this.saveLatLong(coords);
    });
  }

  ngOnInit() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#656565', // '#C9C9C9',
      barOpacity: '0.7',
      barWidth: '7', // '10',
      barBorderRadius: '5', // '20',
      barMargin: '0',
      gridBackground: '#D9D9D9',
      gridOpacity: '1',
      gridWidth: '2',
      gridBorderRadius: '20',
      gridMargin: '0',
      alwaysVisible: true,
      visibleTimeout: 1000,
      // scrollSensitivity: 1
    };
  }
  // isValid(str) {
  //   if (str == null || str === undefined || str === 'null' || str === 'undefined' || str === '' || str === ' ') {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // }
  // markPosition() {
  //   this.goingToMarkPosition = !this.goingToMarkPosition;
  //   if (this.goingToMarkPosition) {
  //     console.log('SUBSCRIBED FOR MARK MAP');
  //     this.notePadService.setIconToSelectLocationInMap(this.positionMarkObserver);
  //   } else {
  //     console.log('UN SUBSCRIBED FOR MARK MAP');
  //     // this.locationCollected=false;
  //     this.locationData = null;
  //     this.notePadService.unSetIconToSelectLocationInMap();
  //   }
  // }
  // clearLocation() {
  //   this.locationData = null;
  //   this.notePadService.unSetIconToSelectLocationInMap();
  //   this.goingToMarkPosition = false;
  // }
  // saveNote(notes, from) {
  //   console.log('IN save notes');
  //   console.log(notes);
  //   console.log(this);
  //   this.notePadService.unSetIconToSelectLocationInMap();
  //   // let type='text';
  //   // if(this.locationCollected)
  //   //   type='location';
  //   console.log(this.locationData);
  //   if (this.operation === 'add') {
  //     if (from === 'input') {
  //       if (!this.isValid(notes.target.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       console.log(notes.target.value);
  //       this.savedNotes.push({
  //         time: new Date().getTime(),
  //         msg: notes.target.value,
  //         locationData: this.locationData,
  //         // type:type
  //       });
  //       notes.target.value = '';
  //     } else {
  //       if (!this.isValid(notes.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       console.log(notes.value);
  //       this.savedNotes.push({
  //         time: new Date().getTime(),
  //         msg: notes.value,
  //         locationData: this.locationData,
  //         // type:type
  //       });
  //       notes.value = '';
  //     }
  //   } else {
  //     if (from === 'input') {
  //       if (!this.isValid(notes.target.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       const index = this.savedNotes.findIndex(val => val.time === this.selectedNote.time);
  //       if (index !== -1) {
  //         this.savedNotes[index].msg = notes.target.value;
  //         this.savedNotes[index].locationData = this.locationData;
  //       }
  //       notes.target.value = '';
  //     } else {
  //       if (!this.isValid(notes.value)) {
  //         this.showError('Null value not accepted');
  //         return;
  //       }
  //       const index = this.savedNotes.findIndex(val => val.time === this.selectedNote.time);
  //       if (index !== -1) {
  //         this.savedNotes[index].msg = notes.value;
  //         this.savedNotes[index].locationData = this.locationData;
  //       }
  //       notes.value = '';
  //     }
  //   }
  //   console.log(this.savedNotes);
  //   this.reset();
  // }
  // reset() {
  //   this.operation = 'add';
  //   this.selectedNote = {};
  //   this.notes.nativeElement.value = '';
  //   this.clearLocation();
  // }
  // showError(msg) {
  //   this.errorMsg = msg;
  //   setTimeout(() => {
  //     this.errorMsg = '';
  //   }, 3000);
  // }
  // editNotes(e, notes) {
  //   console.log('IN editNotes');
  //   console.log(e);
  //   console.log(notes);
  //   this.operation = 'update';
  //   this.selectedNote = notes;
  //   this.notes.nativeElement.value = notes.msg;
  //   this.locationData = notes.locationData;
  // }
  // deleteNotes(e, notes) {
  //   console.log('IN deleteNotes');
  //   console.log(e);
  //   console.log(notes);
  //   if (this.isValid(notes.locationData)) {
  //     this.notePadService.closeMarker(notes.time);
  //   }
  //   const index = this.savedNotes.findIndex(val => val.time === notes.time);
  //   if (index !== -1) {
  //     this.savedNotes.splice(index, 1);
  //   }
  //   this.reset();
  // }
  // closeNotePage() {
  //   this.close.emit();
  //   this.showNotePad = false;
  //   this.reset();
  //   this.savedNotes.forEach(element => {
  //     if (this.isValid(element.locationData)) {
  //       this.notePadService.closeMarker(element.time);
  //     }
  //   });
  //   this.savedNotes = [];
  //   this.minimizedWindow = false;
  // }
  // minimizeNotePage() {
  //   // console.log('IN minimizeNotePage');
  //   this.minimizedWindow = true;
  // }
  // maximizeNotePage() {
  //   // console.log('IN maximizeNotePage');
  //   this.minimizedWindow = false;
  // }
  // gotoLocation(note) {
  //   console.log('IN gotoLocation');
  //   console.log(note);
  //   this.notePadService.addMarker(note.locationData[0], note.locationData[1], note.time);
  // }

}
