import { SETTINGS } from "../../settings.js";
import { ELE } from "../../elements.js";
import { Concert } from "../domain/concert.js";
import { Exchange } from "../domain/exchange.js";

export class App {
  #map;
  #mapEvent;
  #marker = null;
  #attendances = new Array();

  constructor() {
    this.#getUserLocation();
    this.#getAttendances();
    this.#renderList();
    ELE.form.eventType.addEventListener('change', this.#toggleFields.bind(this)); 
    ELE.form.form.addEventListener('submit', this.#saveAttendance.bind(this));
    ELE.list.items.addEventListener('click', this.#centerToMarker.bind(this));
  }

  #getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const {latitude, longitude} = pos.coords;
        this.#renderMap(latitude, longitude);
      },
      (err) => console.warn(err.message),
    );
  }

  #renderMap(lat, lon) {
    this.#map = L.map('map', {minZoom: SETTINGS.MAP_MIN_ZOOM, maxZoom: SETTINGS.MAP_MAX_ZOOM, attributionControl: false})
    .setView([lat, lon], SETTINGS.MAP_INITIAL_ZOOM);
    L.tileLayer(SETTINGS.MAP_TITLE_PROVIDER, {maxZoom: SETTINGS.MAP_MAX_ZOOM}).addTo(this.#map);

    // On click
    this.#map.on('click', function (e) {

      // Add marker
      this.#mapEvent = e;
      if (this.#marker !== null) this.#map.removeLayer(this.#marker);
      const {lat, lng: lon} = this.#mapEvent.latlng;
      this.#marker = L.marker([lat, lon]).addTo(this.#map);

      this.#showForm();
    }.bind(this));

    this.#addMarkersWithPopup();
  }

  #showForm() {
    this.#resetForm();
    ELE.form.form.classList.remove('d-none');
    ELE.form.eventType.focus();
  }

  #resetForm() {
    this.#hideConcertFields();
    this.#hideExchangeFields();
    ELE.form.eventType.value = '';
    ELE.form.save.classList.add('d-none');
    ELE.form.form.classList.add('d-none');
  }

  #showConcertFields() {
    this.#hideExchangeFields();
    ELE.form.concertFields.classList.remove('d-none');
    ELE.form.kindMusic.focus();
    ELE.form.save.classList.remove('d-none');
  };

  #hideConcertFields() {
    ELE.form.kindMusic.value = ELE.form.artists.value = '';
    ELE.form.concertFields.classList.add('d-none');
    ELE.form.save.classList.add('d-none');
  };

  #showExchangeFields() {
    this.#hideConcertFields();
    ELE.form.exchangeFields.classList.remove('d-none');
    ELE.form.languages.focus();
    ELE.form.save.classList.remove('d-none');
  };

  #hideExchangeFields() {
    ELE.form.languages.value = ELE.form.participants.value = '';
    ELE.form.exchangeFields.classList.add('d-none');
    ELE.form.save.classList.add('d-none');
  };

  #toggleFields(e) {
    if (e.target.value === '') this.#showForm();
    if (e.target.value === 'concert') this.#showConcertFields();
    if (e.target.value === 'exchange') this.#showExchangeFields();
  }

  #saveAttendance(e) {
    e.preventDefault();

    // Variables
    const {lat, lng: lon} = this.#mapEvent.latlng;
    let attendance;

    // Read form data, validations and create domain objects
    const eventType = ELE.form.eventType.value;
    if (eventType === '') return alert('The event type field is required');

    if (eventType === 'concert') {
      const kindMusic = ELE.form.kindMusic.value;
      const artists = ELE.form.artists.value;
      if (kindMusic === '') return alert('The kind of music field is required');;
      if (artists === '') return alert('The artists field is required');;
      attendance = new Concert(lat, lon, kindMusic, artists);
    }
    
    if (eventType === 'exchange') {
      const languages = ELE.form.languages.value;
      const participants = +ELE.form.participants.value;
      if (languages === '') return alert('The languages field is required');;
      if (
        !Number.isFinite(participants)
        || !(participants >= 2 && participants <= 20)
      ) return alert('The nº of participants must be between 2 and 20');;
      attendance = new Exchange(lat, lon, languages, participants);
    }

    // Save attendances
    this.#attendances.push(attendance);
    this.#setAttendances();
    this.#resetForm();
    this.#addMarkersWithPopup();
    this.#renderList();
  }

  #setAttendances() {
    localStorage.setItem('attendances', JSON.stringify(this.#attendances));
  }

  #getAttendances() {
    this.#attendances = JSON.parse(localStorage.getItem('attendances')) ?? new Array();
  }

  #renderList() {
    if (this.#attendances.length === 0) {
      ELE.list.message.textContent = 'Currenty, you do not have any event attendance registered in the app.';
    } else {
      ELE.list.message.textContent = '';
    }
    
    const fragment = new DocumentFragment();
    this.#attendances.forEach(attendance => {
      const li = document.createElement('li');
      li.dataset.id = attendance.id;

      const date = new Intl
        .DateTimeFormat('en-GB')
        .format(new Date(attendance.date));

      if (attendance.eventType === 'concert') {
        li.className ='c-list__item c-list__item--concert';
        li.innerHTML = `
          <strong>🎵 Concert (${date})</strong><br>
          <small>Kind of music: ${attendance.kindMusic}</small><br>
          <small>Artists: ${attendance.artists}</small>
        `;
      }

      if (attendance.eventType === 'exchange') {
        li.className ='c-list__item c-list__item--exchange';
        li.innerHTML = `
          <strong>🗣️ Language exchange (${date})</strong><br>
          <small>Languages: ${attendance.languages}</small><br>
          <small>Nº participants: ${attendance.participants}</small>
        `;
      }

      fragment.prepend(li);
    });
    ELE.list.items.innerHTML = '';
    ELE.list.items.append(fragment);
  }

  #addMarkersWithPopup() {
    this.#attendances.forEach(attendance => {
      const date = new Intl
        .DateTimeFormat('en-GB')
        .format(new Date(attendance.date));

      if (this.#marker !== null) this.#map.removeLayer(this.#marker);
      L.marker([attendance.lat, attendance.lon])
      .addTo(this.#map)
      .bindPopup(L.popup(
        Object.assign(SETTINGS.MAP_POPUP, {className: `c-map__popup--${attendance.eventType}`} )
      ))
      .setPopupContent(`
        ${attendance.eventType === 'concert' ? 
          `<strong>🎵 Concert (${date})</strong>` :
          `<strong>🗣️ Language exchange (${date})</strong>`
        }
      `)
      .openPopup();
    });
  }

  #centerToMarker(e) {
    const itemClicked = e.target.closest('.c-list__item');
    if (!itemClicked) return;
    const attendance = this.#attendances.find(e => e.id === +itemClicked.dataset.id);
    this.#map.setView(
      [attendance.lat, attendance.lon],
      SETTINGS.MAP_INITIAL_ZOOM,
      {
        animate: true,
        pan: {
          duration: 1,
        }
      }
    );
  }
}
