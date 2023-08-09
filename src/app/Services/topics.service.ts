import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TopicsService {

  serverUrl = environment.serverUrl;
  serverUrlV2 = environment.serverUrlV2;
  constructor(private http: HttpClientService) { }

  // getting the projects API
  getProjectsList(type = 'INDEPENDENT', orgId = 0, topicType = 'project'): any {
    console.log('get projectsList API calling');
    let url = '';
    if (type === 'INDEPENDENT') {
      // url = this.serverUrl + '/api/topics/projects';
      // url = this.serverUrl + '/api/organization/projects';
      url = this.serverUrlV2 + '/api/v2/topics?topicType=' + topicType;
    } else if (type === 'ORG') {
      // url = this.serverUrl + '/api/organization/projects';
      url = this.serverUrlV2 + '/api/v2/topics?topicType=' + topicType;
    } else if (type === 'COVID19') {
      url = this.serverUrl + '/api/organization/' + orgId + '/projects';
    }
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // save multiple sites i.e. multiple observations list
  saveNewProjectForOrg(data): Observable<any>{
    console.log('saveNewProjectForOrg ', data);
    const url = this.serverUrl + '/api/organization/project/save';
    return this.http.post(url, data)
      .pipe(map((response: any) => {
          return response;
        }), catchError((err: any) => {
          console.log(err);
          return err;
        })
      );
  }

  // /api/organization/'
  getUserInfo(): Observable<any> {
    console.log('getUserInfo');
    const url = this.serverUrl + '/api/organization/';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }
  // getting the places list
  getPlacesListByProjectId(projectId): any {
    console.log('getPlacesListByProjectId ', projectId);
    const url = this.serverUrl + '/api/topics/projects/' + projectId + '/places';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // getting the topics list
  getTopicsListByPlaceId(placeId): any {
    console.log('getTopicsListByPlaceId ', placeId);
    const url = this.serverUrl + '/api/topics/places/' + placeId + '/topics';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
    );
  }

  getTopicsListBySessionId(sessionId): any {
    console.log('getting the projectId, placeId, topicId by sessionId');
    const url = this.serverUrl + '/api/topics/' + sessionId;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
    );
  }

  getProjectListForOrg(): any {
    console.log('getting the projectIdfor org');
    const url = this.serverUrl + '/api/organization/projects';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
    );
  }

  // Here new code for implementation of new APIs for fetching and saving topics(projects/places/topics)
  getTopicsListByTopicType(topicType) {
    const url = this.serverUrlV2 + '/api/v2/topics?topicType=' + topicType;
    return this.http.get(url)
      .pipe(map((response: any) => {
        console.log(response);
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
    );
  }

  saveTopics(data): Observable<any>{
    console.log('save Topics ', data);
    const url = this.serverUrlV2 + '/api/v2/topics';
    return this.http.post(url, data)
      .pipe(map((response: any) => {
          return response;
        }), catchError((err: any) => {
          console.log(err);
          return err;
        })
      );
  }
}
