
export class AffineTransformation {
  matrix = [1, 0, 0, 0, 1, 0];
  hasControlPoints = false;
  similarity = false;
  a_;
  sc_;
  tr_;
  constructor() {  }

  setControlPoints(xy, XY): any {
    console.log('setControlPOints ', xy, ' : ', XY);
    if (xy.length < 2) {
      this.matrix = [1, 0, 0, 0, 1, 0];
      this.hasControlPoints = false;
    }
    else {
      if (this.similarity || xy.length < 3) {
        this.matrix = this._similarity ( xy, XY );
      }
      else {
        this.matrix = this._affine ( xy, XY, '', '' );
      }
      this.hasControlPoints = true;
    }
    return this.hasControlPoints;
  }

  getRotation(): any {
    return this.a_;
  }

  getScale(): any {
    return this.sc_;
  }

  getTranslation(): any {
    return this.tr_;
  }

  transform(xy): any {
    console.log('transformation ', xy, this.matrix);
    const m = this.matrix;
    return [ m[0] * xy[0] + m[1] * xy[1] + m[2], m[3] * xy[0] + m[4] * xy[1] + m[5] ];
  }

  revers(xy): any {
    console.log('revers ', xy);
    const a = this.matrix[0];
    const b = this.matrix[1];
    const c = this.matrix[3];
    const d = this.matrix[4];
    const p = this.matrix[2];
    const q = this.matrix[5];
    return [
      (d * xy[0] - b * xy[1] + b * q - p * d) / (a * d - b * c),
      (-c * xy[0] + a * xy[1] + c * p - a * q) / (a * d - b * c),
    ];
  }

  _similarity(xy, XY): any {
    console.log('_similarity ', xy, ' : ', XY);
    if ( !xy.length || xy.length !== XY.length ) {
      console.log ('Helmert : Taille des tableaux de points incompatibles, Size of incompatible point arrays');
      return false;
    }
    let i;					// Loop variable
    const n = XY.length;		// number of setting points
    let a = 1;
    let b = 0;
    let p = 0;
    let q = 0;

    // Barycentre
    const mxy = { x: 0 , y: 0 };
    const mXY = { x: 0 , y: 0 };
    for (i = 0; i < n; i++) {
      mxy.x += xy[i][0];
      mxy.y += xy[i][1];
      mXY.x += XY[i][0];
      mXY.y += XY[i][1];
    }
    mxy.x /= n;
    mxy.y /= n;
    mXY.x /= n;
    mXY.y /= n;

    // Deviation from the barycenter
    const xy0 = [];
    const XY0 = [];
    for (i = 0; i < n; i++) {
      xy0.push ({ x : xy[i][0] - mxy.x, y : xy[i][1] - mxy.y });
      XY0.push ({ x : XY[i][0] - mXY.x, y : XY[i][1] - mXY.y });
    }

    // Resolution
    let  SxX;
    let SxY;
    let SyY;
    let SyX;
    let Sx2;
    let Sy2;
    SxX = SxY = SyY = SyX = Sx2 = Sy2 = 0;
    for (i = 0; i < n; i++)
    {	SxX += xy0[i].x * XY0[i].x;
      SxY += xy0[i].x * XY0[i].y;
      SyY += xy0[i].y * XY0[i].y;
      SyX += xy0[i].y * XY0[i].x;
      Sx2 += xy0[i].x * xy0[i].x;
      Sy2 += xy0[i].y * xy0[i].y;
    }

    // Coefficients
    a = ( SxX + SyY ) / ( Sx2 + Sy2 );
    b = ( SxY - SyX ) / ( Sx2 + Sy2 );
    p = mXY.x - a * mxy.x + b * mxy.y;
    q = mXY.y - b * mxy.x - a * mxy.y;

    // the Solution
    this.matrix = [ a, -b, p, b, a, q ];

    const sc = Math.sqrt(a * a + b * b);
    this.a_ = Math.acos(a / sc);
    if (b > 0){
       this.a_ *= -1;
    }
    this.sc_ = [sc, sc];
    this.tr_ = [p, q];
    console.log('in simila before returning ',
    this.a_, this.sc_, this.tr_ + ' ==== ' + this.matrix);
    return this.matrix;
  }

  _affine(xy, XY, poids, tol): any{
    console.log('_affine ', xy, ' : ', XY);
    if ( !xy.length || xy.length !== XY.length ) {
      console.log ('Helmert : Taille des tableaux de points incompatibles');
      return false;
    }
    let i;					// Loop variable
    const n = xy.length;		// number of setting points
    // Default weight creation
    if (!poids) {
      poids = [];
    }
    if (poids.length === 0 || n !== poids.iGetTaille()) {
      for (i = 0; i < n; i++) {
        poids.push(1.0);
      }
    }

    let a;
    let b;
    let k;
    let h;
    let tx;
    let ty;
    if (!tol) {
      tol = 0.0001;
    }

    // Initialization (on a similarity)
    const affine = this._similarity( xy, XY);
    a = affine[0];
    b = -affine[1];
    k = h = Math.sqrt(a * a + b * b);
    a /= k;
    b /= k;
    tx = affine[2];
    ty = affine[5];

    // Barycentre
    const mxy = {x: 0, y: 0};
    const mXY = {x: 0, y: 0};
    for (i = 0; i < n; i++)
    {	mxy.x += xy[i][0];
      mxy.y += xy[i][1];
      mXY.x += XY[i][0];
      mXY.y += XY[i][1];
    }
    mxy.x /= n;
    mxy.y /= n;
    mXY.x /= n;
    mXY.y /= n;

    // Deviation from the barycenter
    const xy0 = [];
    const XY0 = [];
    for (i = 0; i < n; i++)
    {	xy0.push ({ x : xy[i][0] - mxy.x, y : xy[i][1] - mxy.y });
      XY0.push ({ x : XY[i][0] - mXY.x, y : XY[i][1] - mXY.y });
    }

    // Variables
    let Sx;
    let Sy;
    let Sxy;
    let SxX;
    let SxY;
    let SyX;
    let SyY;
    Sx = Sy = Sxy = SxX = SxY = SyX = SyY = 0;
    for (i = 0; i < n; i++)
    {	Sx  += xy0[i].x * xy0[i].x * poids[i];
      Sxy += xy0[i].x * xy0[i].y * poids[i];
      Sy  += xy0[i].y * xy0[i].y * poids[i];
      SxX += xy0[i].x * XY0[i].x * poids[i];
      SyX += xy0[i].y * XY0[i].x * poids[i];
      SxY += xy0[i].x * XY0[i].y * poids[i];
      SyY += xy0[i].y * XY0[i].y * poids[i];
    }

    // Iterations
    let	dk;
    let dh;
    let dt;
    let	A;
    let B;
    let C;
    let D;
    let E;
    let F;
    let G;
    let H;
    let	da;
    let db;
    let	div = 1e10;

    do {
      A = Sx;
      B = Sy;
      C = k * k * Sx + h * h * Sy;
      D = -h * Sxy;
      E =  k * Sxy;
      F =  a * SxX + b * SxY - k * Sx;
      G = -b * SyX + a * SyY - h * Sy;
      H = -k * b * SxX + k * a * SxY - h * a * SyX - h * b * SyY;

      //
      dt = (A * B * H - B * D * F - A * E * G) / (A * B * C - B * D * D - A * E * E);
      dk = (F - D * dt) / A;
      dh = (G - E * dt) / A;

      // Probleme de divergence numerique
      if (Math.abs(dk) + Math.abs(dh) > div) {
        break;
      }

      // New approximation
      da = a * Math.cos(dt) - b * Math.sin(dt);
      db = b * Math.cos(dt) + a * Math.sin(dt);
      a = da;
      b = db;
      k += dk;
      h += dh;

      div = Math.abs(dk) + Math.abs(dh);
    } while (Math.abs(dk) + Math.abs(dh) > tol);

    // Return of the barycentric reference mark
    tx = mXY.x - a * k * mxy.x + b * h * mxy.y;
    ty = mXY.y - b * k * mxy.x - a * h * mxy.y;

    this.a_ = Math.acos(a);
    if (b > 0) {
      this.a_ *= -1;
    }
    if (Math.abs(this.a_) < Math.PI / 8) {
      this.a_ = Math.asin(-b);
      if (a < 0) {
        this.a_ = Math.PI - this.a_;
      }
    }
    this.sc_ = [k, h];
    this.tr_ = [tx, ty];

    // la Solution
    this.matrix = [];
    this.matrix[0] = a * k;
    this.matrix[1] = -b * h;
    this.matrix[2] = tx;
    this.matrix[3] = b * k;
    this.matrix[4] = a * h;
    this.matrix[5] = ty;
    console.log('in affine ', this.matrix, poids, tol);
    return this.matrix;
  }
}
