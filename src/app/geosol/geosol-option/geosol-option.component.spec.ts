import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeosolOptionComponent } from './geosol-option.component';

describe('GeosolOptionComponent', () => {
  let component: GeosolOptionComponent;
  let fixture: ComponentFixture<GeosolOptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeosolOptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeosolOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
