import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeobarAlertComponent } from './geobar-alert.component';

describe('GeobarAlertComponent', () => {
  let component: GeobarAlertComponent;
  let fixture: ComponentFixture<GeobarAlertComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeobarAlertComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeobarAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
