import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFileSelectorComponent } from './cloud-file-selector.component';

describe('CloudFileSelectorComponent', () => {
  let component: CloudFileSelectorComponent;
  let fixture: ComponentFixture<CloudFileSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFileSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFileSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
