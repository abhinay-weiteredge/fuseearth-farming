import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawSketchComponent } from './draw-sketch.component';

describe('DrawSketchComponent', () => {
  let component: DrawSketchComponent;
  let fixture: ComponentFixture<DrawSketchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrawSketchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawSketchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
