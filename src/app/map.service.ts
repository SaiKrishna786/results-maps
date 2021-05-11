import { Injectable } from '@angular/core';
// import * as mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';
import { environment } from "../environments/environment";

import * as L from 'leaflet';
import { PopupService } from './popup.service';

import { GeoJson } from './map';
import * as mapboxgl from 'mapbox-gl';
import { Observable } from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class MapService {
map: mapboxgl.Map;
// style = 'mapbox://styles/mapbox/streets-v11';
// lat = 13.0827;
// lng = 80.2707;
// zoom = 12

capitals: string = '/assets/data/usa-capitals.geojson';
constructor(private http: HttpClient, private popupService: PopupService) {
  (mapboxgl as any).accessToken = environment.mapbox.accessToken;
}
buildMap() {
//   this.map = new mapboxgl.Map({
//     container: 'map',
//     style: this.style,
//     zoom: this.zoom,
//     center: [this.lng, this.lat]
//   })
//  this.map.addControl(new mapboxgl.NavigationControl());
}

makeCapitalMarkers(map: L.map): void {
  this.http.get(this.capitals).subscribe((res: any) => {
    for (const c of res.features) {
      const lat = c.geometry.coordinates[0];
      const lon = c.geometry.coordinates[1];
      const marker = L.marker([lon, lat]).addTo(map);
      }
    });
  }

  makeCapitalCircleMarkers(map: L.map): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const circle = L.circleMarker([lon, lat],{radius: 20}).addTo(map);
      }
    });
  }

  makeCapitalCircleMarkersBasedOnPopulation(map: L.map) {
    this.http.get(this.capitals).subscribe((res: any) => {

      // Find the maximum population to scale the radii by.
      const maxVal = Math.max(...res.features.map(x => x.properties.population), 0);

      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const circle = L.circleMarker([lon, lat], {
        radius: MapService.ScaledRadius(c.properties.population, maxVal)
      }).addTo(map);
      }
    });
  }

  makeCapitalCircleWithPopup(map: L.map): void {
    this.http.get(this.capitals).subscribe((res: any) => {

      // Find the maximum population to scale the radii by.
      const maxVal = Math.max(...res.features.map(x => x.properties.population), 0);

      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const circle = L.circleMarker([lon, lat], {
          radius: MapService.ScaledRadius(c.properties.population, maxVal)
        });

        circle.bindPopup(this.popupService.makeCapitalPopup(c.properties));

        circle.addTo(map);
      }
    });
  }

  static ScaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  public getStateJSON(name): Observable<any> {
    return this.http.get("./assets/data/polling_squares/" + name + ".geojson");
  }

  public getMajorityJSON(name): Observable<any> {
    return this.http.get("./assets/data/majority/" + name + ".geojson");
  }

  public getJSON(year, name): Observable<any> {
    return this.http.get("./assets/data/polling_squares/" + year +  "/" + name + ".geojson");
  }
}