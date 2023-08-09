// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // its for QA...
  production: true,
  firebase: {
    apiKey: 'AIzaSyCVnBsey3uLBUCWDQKQ8CdEMKjf0-p0LAc',
    authDomain: 'geomocus-qa.firebaseapp.com',
    databaseURL: 'https://geomocus-qa.firebaseio.com',
    projectId: 'geomocus-qa',
    storageBucket: 'geomocus-qa.appspot.com',
    messagingSenderId: '202504574359',
    // appId: '1:202504574359:web:ea945d2af16635e63ea0d2',
    // measurementId: 'G-EFT26JZRYF'
  },
  disableConsoleLogs: false,
  sendGoogleAnalytics: false,
  feUserGuideTooltipAutoCloseDuration: 10000,
  // serverUrl: 'http://localhost:9090'
  serverUrl: 'https://qa.fuse.earth:8443/fusedotearth',
  serverUrlV2: 'https://qa.fuse.earth:8443/fusedotearth-v2'
  // firebase: {
  //   apiKey: 'AIzaSyBmrGzYgXrFHDef8WH358VcRZopLPmcRyI',
  //   authDomain: 'geomocus-cdef5.firebaseapp.com',
  //   databaseURL: 'https://geomocus-cdef5.firebaseio.com',
  //   projectId: 'geomocus-cdef5',
  //   storageBucket: 'geomocus-cdef5.appspot.com',
  //   messagingSenderId: '68145539901'
  // },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
  // import 'zone.js/dist/zone-error';  // Included with Angular CLI.
