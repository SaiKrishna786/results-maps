import { Component, OnInit } from '@angular/core';

import { MapService } from '../map.service';
import { ShapeService } from '../shape.service';

import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { NotifierService } from "angular-notifier";
import consti_details from '../../assets/data/consti_name_no.json';

var constmap;
var rotatecam;
var norotate = false;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  // private map;
  private states;
  map: mapboxgl.Map;
  dmkSourceMap: any;
  admkSourceMap: any;
  style = 'mapbox://styles/saikrishna7/ckes4v59n7ruc19p91k7kwred';
  lat = 10.75;
  lng = 77.85;

  stateData:any;
  setPopup = false;
  popupOpen = false;
  showDropdown = false;
  showYearDropdown = false;
  searchConstituency = "";
  selectedYear = 2019;
  years = [2016, 2019];
  mapLoaded = true;
  selectedPoleinActiveConstituency:any = {};

  manipulatedDMKAreaRes:any;
  manipulatedADMKAreaRes:any;

  constituencyDropdownValue = "Select Constituency";
  constituencyIdMap = Object.keys(consti_details).sort();

  voteDistAndPerfDropdownVal = "DMK+";

  // voteDistAndPerfDropdown = ["DMK+", "Opposition", "DMK+ Performance"];
  voteDistAndPerfDropdown = ["DMK+", "Opposition"];

  selectedACNumber;
  activeConsti;
  navigation: any;

  basicLoad = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                77.31200000000001,
                8.687
              ],
              [
                77.31200000000001,
                8.685
              ],
              [
                77.31,
                8.685
              ],
              [
                77.31,
                8.687
              ],
              [
                77.31200000000001,
                8.687
              ]
            ]
          ]
        },
        "properties": {
          "polling_no": 2,
          "polling_name": "PANCHAYAT UNION PRIMARY SCHOOLMIDDLE PORTION  SERVALAR",
          "total_votes": 221,
          "party_DMK": 126,
          "party_BSP": 0,
          "party_CPM": 14,
          "party_BJP": 3,
          "party_AIADMK": 63,
          "party_PMK": 0,
          "party_Tamilaga Makkal Munnetra Kazhagam": 0,
          "party_NTK": 4,
          "party_All India Forward Bloc": 1,
          "party_IND": 7,
          "party_NOTA": 3
        }
      }
    ]
  }

  boothsForSelectedAc = [];

  
  constructor(private mapService: MapService, private shapeService: ShapeService, private notifierService: NotifierService) { }

  ngOnInit() {
    this.initializeMapBoxMap();
  }

  dropdownButtonClick() {
    this.showDropdown = !this.showDropdown;
    this.closeSliderPopup();
  }

  dropdownOptionsSelected(constituency) {
    this.mapLoaded = false
    this.showDropdown = false;
    this.constituencyDropdownValue = constituency;
    this.changeConstituencyDropdown();
  }

  yearChanged(year) {
    this.showYearDropdown = false;
    this.selectedYear = year;
    this.changeConstituencyLayer();
  }

  voteLayerSelcted(layer) {
    this.voteDistAndPerfDropdownVal = layer;
    this.changeVotesLayer()
  }

  filterFunction() {
    const div = document.getElementById("myDropdown");
    const a = div.getElementsByTagName("a");
    for (let i = 0; i < a.length; i++) {
      if (a[i].innerHTML.toLowerCase().startsWith(this.searchConstituency) || a[i].innerText.toLowerCase().startsWith(this.searchConstituency)) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  }

  initializeMapBoxMap() {
     /// locate the user
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
      //  this.lat = position.coords.latitude;
      //  this.lng = position.coords.longitude;
       this.map.flyTo({
         center: [this.lng, this.lat]
       })
     });
   }

  //  this.buildMapBoxMapWithFormula()

  this.loadTNAC();
  }

  loadTNAC() {
    this.mapService.getMajorityJSON('dmk_admk_votes_gj').subscribe(res => {
      this.stateData = res;
      this.buildTNConsitunecies()
    })
  }

  buildTNConsitunecies() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: 6.2,
      center: [this.lng, this.lat]
    });

    constmap = this.map;
    rotatecam = this.rotateCamera;

    /// Add map controls
    this.navigation = new mapboxgl.NavigationControl({showCompass: true,showZoom: true,visualizePitch: true})
    this.map.addControl(this.navigation);

    let hoverpopup = new mapboxgl.Popup({
      maxWidth: '300px',
      closeButton: false,
      closeOnClick: false
      });


    /// Add realtime firebase data on map load
    this.map.on('load', (event) => {

      // let layers = this.map.getStyle().layers;

      //This layer is to load spikes in 3d
      this.map.addSource('tnDMKdistrictlayer', {
        'type': 'geojson',
        'data': this.basicLoad as any
      });

      this.map.addLayer({
        'id': 'district-layer-votes-DMK',
        'type': 'fill-extrusion',
        'source': 'tnDMKdistrictlayer',
        'maxzoom': 17,
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          // 'fill-extrusion-color': '',
          'fill-extrusion-height': [
            "*",
            [
              "/",
              [
                "get",
                "dmk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            5000
          ],
          'fill-extrusion-base': 1,
          'fill-extrusion-opacity': 1
          // 'fill-color': 'transparent',
          // 'fill-outline-color': 'transparent'
        }
      });


      //This layer is to load spikes in 3d
      this.map.addSource('tnADMKdistrictlayer', {
        'type': 'geojson',
        'data': this.basicLoad as any
      });

      this.map.addLayer({
        'id': 'district-layer-votes-ADMK',
        'type': 'fill-extrusion',
        'source': 'tnADMKdistrictlayer',
        'maxzoom': 17,
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          // 'fill-extrusion-color': '',
          'fill-extrusion-height': [
            "*",
            [
              "/",
              [
                "get",
                "admk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            5000
          ],
          'fill-extrusion-base': 1,
          'fill-extrusion-opacity': 1
          // 'fill-color': 'transparent',
          // 'fill-outline-color': 'transparent'
        }
      });


      //this layer is to highlight the selected constitunecy in 3D
      this.map.addSource('tnselecteddistrictlayer', {
        'type': 'geojson',
        'data': this.basicLoad as any
      });

      this.map.addLayer({
        'id': 'selected-district-layer',
        'type': 'fill',
        'source': 'tnselecteddistrictlayer',
        'maxzoom': 17,
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          'fill-color': 'transparent'
        }
      }, 'district-layer-votes-ADMK');

      /// get source
      this.dmkSourceMap = this.map.getSource('tnDMKdistrictlayer')
      this.manipulatedDMKAreaRes = this.generateDMKManpRes(this.stateData);
      this.dmkSourceMap.setData(this.manipulatedDMKAreaRes);
      this.admkSourceMap = this.map.getSource('tnADMKdistrictlayer')
      this.manipulatedADMKAreaRes = this.generateADMKManpRes(this.stateData);
      this.admkSourceMap.setData(this.manipulatedADMKAreaRes);
    })

    this.map.on('zoom', () => {
      const zoomLevel = Math.round(this.map.getZoom());
      if (zoomLevel > 9 && this.manipulatedDMKAreaRes) {
        const radiusOnZoom = {9: 100, 10: 80, 11: 100, 12: 70, 13: 45, 14: 30, 15: 20, 16: 15, 17: 10};
        let dmkData = {
          "type": "FeatureCollection",
          "features": []
        }
        let admkData = {
          "type": "FeatureCollection",
          "features": []
        }
        this.manipulatedDMKAreaRes.features.forEach((f) => {
          let object = turf.centerOfMass(f)
          let center = object.geometry.coordinates
          let radius = radiusOnZoom[zoomLevel];
          let options: any = {
            steps: 200,
            units: 'meters',
            properties: f.properties
          };
          dmkData.features.push(turf.circle(center, radius, options))
        });

        this.manipulatedADMKAreaRes.features.forEach((f) => {
          let object = turf.centerOfMass(f)
          let center = object.geometry.coordinates
          let radius = radiusOnZoom[zoomLevel];
          let options: any = {
            steps: 200,
            units: 'meters',
            properties: f.properties
          };
          admkData.features.push(turf.circle(center, radius, options))
        });
  
        this.dmkSourceMap.setData(dmkData);
        this.admkSourceMap.setData(admkData);
      }
    });

    this.map.on('mousedown', () => {
      hoverpopup.remove();
      norotate = true;
    });

    let el = document.getElementsByClassName("mapboxgl-ctrl-compass")[0];
    el.addEventListener('mousedown', (event) => {
      norotate = true;
    })

    // this.map.on('click', 'district-layer-votes-DMK', (e) => {
    //   hoverpopup.remove();
    //   this.setPopup = true;
    //   // this.popupOpen = !this.popupOpen;
    //   this.popupOpen = true;
    //   this.navigation._container.parentNode.className = "mapboxgl-ctrl-top-center";
    //   norotate = true;
    //   this.selectedPoleinActiveConstituency = e.features[0].properties;
    //   this.boothsForSelectedAc = e.features[0].properties.aggregated_booths ? JSON.parse(e.features[0].properties.aggregated_booths) : [];
    //   this.highlightSelectedPole("dmk_votes");
    // })

    // this.map.on('click', 'district-layer-votes-ADMK', (e) => {
    //   hoverpopup.remove();
    //   this.setPopup = true;
    //   // this.popupOpen = !this.popupOpen;
    //   this.popupOpen = true;
    //   this.navigation._container.parentNode.className = "mapboxgl-ctrl-top-center";
    //   norotate = true;
    //   this.selectedPoleinActiveConstituency = e.features[0].properties;
    //   this.boothsForSelectedAc = e.features[0].properties.aggregated_booths ? JSON.parse(e.features[0].properties.aggregated_booths) : [];
    //   this.highlightSelectedPole("admk_votes");
    // })

    // Add Marker on Click
    this.map.on('click', 'tn-ac-c15dhe', (e) => {
      hoverpopup.remove();
      this.showDropdown = false;
      if(!this.setPopup) {
        this.closeSliderPopup();
        const properties = e.features[0].properties;
        const acNum = properties.AC_NO;
        const acName = Object.keys(consti_details).filter(key => parseInt(consti_details[key]) === parseInt(acNum))[0]
        console.log(acName)
        // const acName = Object.keys(this.constituencyIdMap).filter(key => (parseInt(this.constituencyIdMap[key].split("_")[1]) === acNum))[0]
        this.constituencyDropdownValue = acName;
        const findInStateData = this.stateData.features.filter(feature => (feature.properties.AC_NO == acNum));
        this.selectedACNumber = findInStateData[0].properties.AC_NO;
        this.fillExtrusionForSelectedAc(findInStateData[0].geometry);
        this.changeConstituencyLayer(e);
      } else {
        this.setPopup = false;
        // this.flyTo(e.lngLat)
      }
      // const newMarker   = new GeoJson(coordinates, { message: this.message })
      // this.mapService.createMarker(newMarker)
    });

    this.map.on('mousemove', 'tn-ac-c15dhe', (e) => {
      if(e.features[0]) {
        const properties = e.features[0].properties;
        const acNum = properties.AC_NO;
        const acName = Object.keys(consti_details).filter(key => parseInt(consti_details[key]) === parseInt(acNum))[0]
        // console.log(acName)

        let htmlString = "";
        htmlString += '<div class="hoveracoverlay">'
        htmlString += '<span class="hoveracname"> ' + acName + '</span><br>'
        htmlString += '</div>'

        this.map.getCanvas().style.cursor = '';
        hoverpopup.remove();
        
        if(this.activeConsti !== acNum) {
          hoverpopup.setLngLat(e.lngLat)
                    .setHTML(htmlString)
                    .addTo(this.map);
        }
      }
    });

    this.map.on('mouseout', 'tn-ac-c15dhe', (e) => {
        hoverpopup.remove();
    });
  }

  zoomout(data) {
    this.map.flyTo({
      center: data,
      zoom: 8
    })
  }

  flyTo(data: any) {
    this.map.flyTo({
      center: data,
      zoom: 12.5
    })
    setTimeout(() => {
      // Start the animation.
      norotate = false;
      // this.rotateCamera(this.map.getBearing());
    }, 1500);
  }

  flyToDelay(data: any) {
    this.map.flyTo({
      center: data,
      zoom: 6
    })
    setTimeout(() => {
      this.map.flyTo({
        center: data,
        zoom: 12.5
      })
      this.easeTo()
    }, 1500);
  }

  easeTo() {
    setTimeout(() => {
      this.map.easeTo({
        duration: 2000,
        pitch: 90,
        // bearing: 0,
        // easing: (t) => {
        //   return t * (2 - t);
        // }
      })
    }, 2000)
    setTimeout(() => {
      // Start the animation.
      norotate = false;
      // this.rotateCamera(this.map.getBearing());
      this.mapLoaded = true
    }, 4000);
  }

  rotateCamera(timestamp) {
    if(!norotate) {
      // clamp the rotation between 0 -360 degrees
      // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
      constmap.rotateTo(timestamp / 750, { duration: 0 });
      // this.map.rotateTo
      // Request the next frame of the animation.
      requestAnimationFrame(rotatecam);
    }
  }

  noDataForConsti(constiname) {
    let constiFound = false;
    if(this.stateData) {
      const ac_no = parseInt(consti_details[constiname]);
      const findInStateData = this.stateData.features.filter(feature => (feature.properties.AC_NO == ac_no))[0];
      constiFound = this.selectedYear === 2019 ? findInStateData.properties.availability_2019 : findInStateData.properties.availability_2016
    }
    return !constiFound
  }

  changeConstituencyDropdown() {
    const ac_no = parseInt(consti_details[this.constituencyDropdownValue])
    const findInStateData = this.stateData.features.filter(feature => (feature.properties.AC_NO == ac_no));
    this.selectedACNumber = findInStateData[0].properties.AC_NO;
    if(findInStateData.length > 0) {
      norotate = true;
      const properties = findInStateData[0].properties;
      this.fillExtrusionForSelectedAc(findInStateData[0].geometry);
      this.changeConstituencyLayer(properties.centroid);
    } else {
      this.mapLoaded = false
    }
  }

  fillExtrusionForSelectedAc(data) {
    const selectedDistrictLaterSource: any = this.map.getSource('tnselecteddistrictlayer');
    selectedDistrictLaterSource.setData(data);
  }

  changeConstituencyLayer(centroid?: any) {
    if(this.constituencyDropdownValue) {
      // const area = this.constituencyIdMap[this.constituencyDropdownValue];
      const area = this.constituencyDropdownValue+'_'+consti_details[this.constituencyDropdownValue]
          this.activeConsti = this.selectedACNumber;
          this.changeVotesLayer();
          if(centroid && centroid.lngLat) {
            const zoomLevel = this.map.getZoom();
            if(zoomLevel > 8) {
              this.flyTo(centroid.lngLat)
            } else {
              this.flyToDelay(centroid.lngLat)
            }
          } else if(centroid) {
            this.flyToDelay(centroid)
          }
    } else {
          this.dmkSourceMap.setData(this.basicLoad);
          this.admkSourceMap.setData(this.basicLoad);
          this.map.setPaintProperty(
            'district-layer-votes-DMK',
            'fill-extrusion-height',
            0
          );
          this.map.setPaintProperty(
            'district-layer-votes-DMK',
            'fill-extrusion-color', 
            "transparent"
          );
          this.map.setPaintProperty(
            'district-layer-votes-ADMK',
            'fill-extrusion-height',
            0
          );
          this.map.setPaintProperty(
            'district-layer-votes-ADMK',
            'fill-extrusion-color', 
            "transparent"
          );
    }
    
  }

  changeVotesLayer() {
    const res = this.manipulatedDMKAreaRes;
    if(this.voteDistAndPerfDropdownVal == "DMK+") {
      this.map.setPaintProperty(
        'district-layer-votes-DMK',
        'fill-extrusion-height',
        [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          [
            "*",
            [
              "/",
              [
                "get",
                "dmk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            10000
          ],
          13,
          [
            "*",
            [
              "/",
              [
                "get",
                "dmk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            1500
          ]
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes-DMK',
        'fill-extrusion-color', [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "get",
              "dmk_votes"
            ],
            [
              "get",
              "total_votes"
            ]
          ],
          this.findVotes(res, "min", "dmk_votes"),
          "#E2E2E2",
          this.findVotes(res, "max", "dmk_votes"),
          "#000000"
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes-ADMK',
        'fill-extrusion-height',
        [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          [
            "*",
            [
              "/",
              [
                "get",
                "admk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            10000
          ],
          13,
          [
            "*",
            [
              "/",
              [
                "get",
                "admk_votes"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            1500
          ]
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes-ADMK',
        'fill-extrusion-color', [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "get",
              "admk_votes"
            ],
            [
              "get",
              "total_votes"
            ]
          ],
          this.findVotes(res, "min", "admk_votes"),
          "#E2E2E2",
          this.findVotes(res, "max", "admk_votes"),
          "#000000"
        ]
      );
    }

    this.map.setPaintProperty(
      'tn-ac-c15dhe',
      'fill-color',
      [
        "case",
        [
          "match",
          ["get", "AC_NO"],
          [this.selectedACNumber],
          false,
          true
        ],
        // "hsl(0, 100%, 34%)",
        // "hsl(255, 19%, 21%)",
        // "hsla(0, 100%, 34%, 0)"
        "hsl(60, 38%, 68%)",
        "hsla(60, 38%, 68%, 0)"
      ]
    );
  }

  findVotes(res, type, party)  {
    let totalVotes : number[] = [];
    res.features.forEach(feature => {
        totalVotes.push(feature.properties[party]/feature.properties.total_votes)
    });

    if(type == "min") {
      return Math.min(...totalVotes)
    } else {
      return Math.max(...totalVotes)
    }
  }


  findTotalOppositionVotes(properties) {
    let parties = [];
    if(this.selectedYear === 2016) {
      parties = ["party_DMK","party_INC","party_IUML","party_PT","party_MAMAK","party_PTMK","party_TNPWP"];
    } else {
      parties = ["party_DMK", "party_INC", "party_CPI", "party_CPM", "party_VCK", "party_IUML", "party_IJK", "party_KMDK", "party_MDMK"]
    }
    const alliance = "DMK+";
    let totalOppoVotes = 0;
    parties.forEach(party => {
      if(party !== alliance) {
        totalOppoVotes = totalOppoVotes + properties[party]
      }
    })
    return totalOppoVotes
  }

  generateDMKManpRes(resp) {
    let totalConstituencyVotes = {
      "type": "FeatureCollection",
      "features": []
    }
    for(let i=0; i< resp.features.length; i++) {
      const dmkObj = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates":  resp.features[i].properties.dmk_centroid
        },
        "properties": {
          "ST_CODE": resp.features[i].properties.ST_CODE,
          "ST_NAME": resp.features[i].properties.ST_NAME,
          "DT_CODE": resp.features[i].properties.DT_CODE,
          "DIST_NAME": resp.features[i].properties.DIST_NAME,
          "AC_NO": resp.features[i].properties.AC_NO,
          "AC_NAME": resp.features[i].properties.AC_NAME,
          "PC_NO": resp.features[i].properties.PC_NO,
          "PC_NAME": resp.features[i].properties.PC_NAME,
          "PC_ID": resp.features[i].properties.PC_ID,
          "dmk_votes": resp.features[i].properties.dmk_votes,
          "total_votes": resp.features[i].properties.total_votes,
          "margin": resp.features[i].properties.margin
        }
      }
      totalConstituencyVotes.features.push(dmkObj)
    }
    return this.manipulateResponse(totalConstituencyVotes)
  }

  generateADMKManpRes(resp) {
    let totalConstituencyVotes = {
      "type": "FeatureCollection",
      "features": []
    }
    for(let i=0; i< resp.features.length; i++) {
      const admkObj = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates":  resp.features[i].properties.admk_centroid
        },
        "properties": {
          "ST_CODE": resp.features[i].properties.ST_CODE,
          "ST_NAME": resp.features[i].properties.ST_NAME,
          "DT_CODE": resp.features[i].properties.DT_CODE,
          "DIST_NAME": resp.features[i].properties.DIST_NAME,
          "AC_NO": resp.features[i].properties.AC_NO,
          "AC_NAME": resp.features[i].properties.AC_NAME,
          "PC_NO": resp.features[i].properties.PC_NO,
          "PC_NAME": resp.features[i].properties.PC_NAME,
          "PC_ID": resp.features[i].properties.PC_ID,
          "admk_votes": resp.features[i].properties.admk_votes,
          "total_votes": resp.features[i].properties.total_votes,
          "margin": resp.features[i].properties.margin
        }
      }
      totalConstituencyVotes.features.push(admkObj)
    }
    return this.manipulateResponse(totalConstituencyVotes)
  }

  manipulateResponse(totalConstituencyVotes) {
    
    //change the point spikes to turf spikes
    let turfSpikes:any = {
      "type": "FeatureCollection",
      "features": []
    }

    const radiusOnZoom = {9: 100, 10: 80, 11: 100, 12: 70, 13: 45, 14: 30, 15: 20, 16: 15, 17: 10};
    const zoomLevel = Math.round(this.map.getZoom());

    totalConstituencyVotes.features.forEach((f) => {
      let object = turf.centerOfMass(f)
      let center = object.geometry.coordinates
      let radius = zoomLevel > 8 ?radiusOnZoom[zoomLevel] : 100;
      let options: any = {
        steps: 16,
        units: 'meters',
        properties: object.properties
      };
      turfSpikes.features.push(turf.circle(center, radius, options))
    });

    return turfSpikes;
  }

  highlightSelectedPole(party) {
    const res = this.manipulatedDMKAreaRes;
    this.map.setPaintProperty(
      party == "dmk_votes" ? 'district-layer-votes-DMK' : 'district-layer-votes-ADMK',
      'fill-extrusion-color', [
        "match",
        ["get", party],
        [this.selectedPoleinActiveConstituency[party]],
        "#FFFF00",
        [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "get",
              party
            ],
            [
              "get",
              "total_votes"
            ]
          ],
          this.findVotes(res, "min", party),
          "#E2E2E2",
          this.findVotes(res, "max", party),
          '#000000'
        ]
      ]
    );
  }

  closeSliderPopup(rotate?) {
    if(this.manipulatedDMKAreaRes) {
      this.selectedPoleinActiveConstituency = {};
      norotate = false;
      this.popupOpen = false;
      this.navigation._container.parentNode.className = "mapboxgl-ctrl-top-right";
      this.changeVotesLayer();
      if(rotate) {
        setTimeout(() => {
          if (!this.popupOpen) {
            norotate = false;
            // this.rotateCamera(this.map.getBearing());
          }
        }, 1000);
      }
    }
  }

}
