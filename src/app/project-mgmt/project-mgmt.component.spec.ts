import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMgmtComponent } from './project-mgmt.component';

describe('ProjectMgmtComponent', () => {
  let component: ProjectMgmtComponent;
  let fixture: ComponentFixture<ProjectMgmtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectMgmtComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
