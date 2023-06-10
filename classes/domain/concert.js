import { Attendance } from "./attendance.js";

export class Concert extends Attendance {
  eventType = 'concert';
  kindMusic;
  artists;

  constructor(lat, lon, kindMusic, artists) {
    super(lat, lon);
    this.kindMusic = kindMusic;
    this.artists = artists;
  }
}
