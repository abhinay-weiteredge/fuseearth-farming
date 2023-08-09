import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeWindowComponent } from './prototype-window.component';

describe('PrototypeWindowComponent', () => {
  let component: PrototypeWindowComponent;
  let fixture: ComponentFixture<PrototypeWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrototypeWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
