import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-team-mgmt',
  templateUrl: './team-mgmt.component.html',
  styleUrls: ['./team-mgmt.component.scss']
})
export class TeamMgmtComponent implements OnInit {

  @Input() userProfile: any = {};
  constructor() { }

  ngOnInit(): void {
  }

}
