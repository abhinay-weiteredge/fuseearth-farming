import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeotrayMenuComponent } from './geotray-menu.component';

describe('GeotrayMenuComponent', () => {
  let component: GeotrayMenuComponent;
  let fixture: ComponentFixture<GeotrayMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeotrayMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeotrayMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
