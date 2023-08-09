import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamMgmtComponent } from './team-mgmt.component';

describe('TeamMgmtComponent', () => {
  let component: TeamMgmtComponent;
  let fixture: ComponentFixture<TeamMgmtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamMgmtComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamMgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
