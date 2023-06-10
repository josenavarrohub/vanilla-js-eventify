import { Attendance } from "./attendance.js";

export class Exchange extends Attendance {
  eventType = 'exchange';
  languages;
  participants;

  constructor(lat, lon, languages, participants) {
    super(lat, lon);
    this.languages = languages;
    this.participants = participants;
  }
}
