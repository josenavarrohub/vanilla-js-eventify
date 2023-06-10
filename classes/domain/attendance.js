export class Attendance {
    id;
    lat;
    lon;
    date;
  
    constructor(lat, lon) {
      this.id = Date.now();
      this.lat = lat;
      this.lon = lon;
      this.date = new Date();
    }
}
