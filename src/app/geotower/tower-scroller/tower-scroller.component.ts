import {
  Component, OnInit, ViewChild, Input, EventEmitter, AfterViewInit,
  HostListener, Output, SimpleChange, OnChanges, ElementRef
} from '@angular/core';
@Component({
  selector: 'app-tower-scroller',
  templateUrl: './tower-scroller.component.html',
  styleUrls: ['./tower-scroller.component.scss']
})
export class TowerScrollerComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() towerOrderEle: any;
  @Input() towerEle: any;
  @Input() towerOrderEleEmit: EventEmitter<any>;
  @Input() refreshTowerScroll: String = '';
  @ViewChild('scrollouter') scrollOuterEle: any;
  @ViewChild('scroll') scrollEle: ElementRef<HTMLDivElement>;
  @Output() towerEleEmit: EventEmitter<any> = new EventEmitter<boolean>();
  _scrollOuter: any = 'scroll-outer-hide';
  scrollHeightAdjustDynamic: string;

  constructor() { }

  ngOnInit() {
    this.towerOrderEleEmit.subscribe(towerOrderElement => {
      console.log('IN SUBSCRIBE');
      console.log(towerOrderElement);
      this.scrollHeightAdjustDynamic = towerOrderElement.nativeElement.scrollHeight + 'px';
      this._getScroll();
      this.setTowerScrollHeight();
    });
  }

  ngAfterViewInit() {
    console.log(this);
    setTimeout(() => {
      this._getScroll();
      this.setTowerScrollHeight();
    }, 1000);
  }
  setTowerScrollHeight(){
    try{
      this._scrollOuter = 'scroll-outer';
      const scrollHeight: String = this.scrollHeightAdjustDynamic;
      let height: number;
      try {
        height = Number(scrollHeight.substring(0, scrollHeight.indexOf('px')));
      } catch (e) {
        height = 235;
      }
      this.scrollEle.nativeElement.scrollTop = height - this.towerOrderEle.nativeElement.offsetHeight - 20;
      console.log('IN VIEW INIT : ', height, this.towerOrderEle.nativeElement.offsetHeight);
    } catch (e){
      console.log(e);
    }
  }
  ngOnChanges(changes: { [propkey: string]: SimpleChange }) {
    console.log(changes);
    if (changes.refreshTowerScroll) {
      console.log('REFRESHING TOWER SCROLL...');
      this._getScroll();
      this._scrollOuter = 'scroll-outer';
      this.setTowerScrollHeight();
    }
  }

  private _getScroll() {
    try{
      const offheight = this.towerOrderEle.nativeElement.offsetHeight;
      const target_height = this.towerOrderEle.nativeElement.offsetHeight;
      const target_parent_height = this.towerEle.nativeElement.offsetHeight;
      console.log(target_parent_height - 20 + '-' + target_height, this.towerOrderEle, this.towerEle);
      if (target_parent_height - 20 <= target_height) {
        this.scrollOuterEle.nativeElement.className = 'active';
      } else {
        this.scrollOuterEle.nativeElement.className = ' ';
      }
      this.scrollHeightAdjustDynamic = offheight + /*35*/ 5 + 'px';
    } catch (e) {
      console.log(e);
    }
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    this.towerEleEmit.emit({ emitData: event.target.scrollTop });
  }
}
