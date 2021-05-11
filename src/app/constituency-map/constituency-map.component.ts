import { Component, OnInit } from '@angular/core';

import { MapService } from '../map.service';
import { ShapeService } from '../shape.service';

import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { environment } from 'src/environments/environment';
import { GeoJson } from '../map';
import { geodata } from '../geodata';
import { NotifierService } from "angular-notifier";
import consti_details from '../../assets/data/consti_name_no.json';

var constmap;
var rotatecam;
var norotate = false;

@Component({
  selector: 'app-constituency-map',
  templateUrl: './constituency-map.component.html',
  styleUrls: ['./constituency-map.component.scss']
})
export class ConstituencyMapComponent implements OnInit {
  // private map;
  private states;
  map: mapboxgl.Map;
  source: any;
  style = 'mapbox://styles/saikrishna7/ckes4v59n7ruc19p91k7kwred';
  // style = 'mapbox://styles/saikrishna7/ckejopg094haf19rt0nrd22a5';
  // style = 'mapbox://styles/saikrishna7/ckejwsl2065uw19unxqb16kc3'
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

  manipulatedAreaRes:any;

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

  this.buildTNConsitunecies()
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
      this.map.addSource('tndistrictlayer', {
        'type': 'geojson',
        'data': this.basicLoad as any
      });

      this.map.addLayer({
        'id': 'district-layer-votes',
        'type': 'fill-extrusion',
        'source': 'tndistrictlayer',
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
                "party_DMK"
              ],
              [
                "get",
                "total_votes"
              ]
            ],
            5000000
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
      }, 'district-layer-votes');

      this.map.addSource('extrusion', {
        'type': 'geojson',
        'data': this.basicLoad as any
      });

      /// get source
      this.source = this.map.getSource('tndistrictlayer')

    })

    this.map.on('zoom', () => {
      const zoomLevel = Math.round(this.map.getZoom());
      if (zoomLevel > 9 && this.manipulatedAreaRes) {
        const radiusOnZoom = {9: 100, 10: 80, 11: 100, 12: 70, 13: 45, 14: 30, 15: 20, 16: 15, 17: 10};
        let data = {
          "type": "FeatureCollection",
          "features": []
        }
        this.manipulatedAreaRes.features.forEach((f) => {
          let object = turf.centerOfMass(f)
          let center = object.geometry.coordinates
          let radius = radiusOnZoom[zoomLevel];
          let options: any = {
            steps: 200,
            units: 'meters',
            properties: f.properties
          };
          data.features.push(turf.circle(center, radius, options))
        });
  
        this.source.setData(data);
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

    this.map.on('click', 'district-layer-votes', (e) => {
      hoverpopup.remove();
      this.setPopup = true;
      // this.popupOpen = !this.popupOpen;
      this.popupOpen = true;
      this.navigation._container.parentNode.className = "mapboxgl-ctrl-top-center";
      norotate = true;
      this.selectedPoleinActiveConstituency = e.features[0].properties;
      this.boothsForSelectedAc = e.features[0].properties.aggregated_booths ? JSON.parse(e.features[0].properties.aggregated_booths) : [];
      this.highlightSelectedPole();
      let htmlString = "";
      // Object.keys(e.features[0].properties).forEach(key => {
      //   htmlString += key + " : " + e.features[0].properties[key] + '<br>'
      // })
      htmlString += '<div class="overlay"> <div class="mappopup">'
      htmlString += '<span class="popupheading">Polling Station No : </span> <span class="popupvalue"> ' + e.features[0].properties['polling_no'] + '</span><br>'
      htmlString += '<span class="popupheading">Polling Station Name : </span> <span class="popupvalue"> ' + e.features[0].properties['polling_name'] + '</span><br>'
      htmlString += '<span class="popupheading">Polling Station Capacity : </span> <span class="popupvalue"> ' + e.features[0].properties['total_votes'] + '</span><br>'
      htmlString += '<span class="popupheading">Votes Polled For DMK+ (' + this.findAliance(e.features[0].properties) + ') : </span> <span class="popupvalue"> ' + e.features[0].properties[this.findAliance(e.features[0].properties)] + '</span><br>'
      if(this.voteDistAndPerfDropdownVal === "Opposition") {
        htmlString += '<span class="popupheading">Votes Polled For Opp.: </span> <span class="popupvalue"> ' + e.features[0].properties['total_votes'] + '</span><br>'
      }
      if(this.voteDistAndPerfDropdownVal === "DMK+ Performance") {
        htmlString += '<span class="popupheading">Total Votes Polled For DMK+ : </span> <span class="popupvalue"> ' + e.features[0].properties['total_alliance_votes_constituency'] + '</span><br>'
        htmlString += '<span class="popupheading">Total Contituency Votes : </span> <span class="popupvalue"> ' + e.features[0].properties['total_constituency_votes'] + '</span><br>'
      } else {
        // htmlString += 'Polling Booth Total Votes : ' + this.findTotalOppositionVotes(e.features[0].properties) + '<br>'
      }

      htmlString += '</div></div>'

        
      // let popup = new mapboxgl.Popup({maxWidth: '300px'})
      // .setLngLat(e.lngLat)
      // .setHTML(htmlString)
      // .addTo(this.map);

      // popup.on('close', (e) => {
      //   norotate = false;
      //   this.popupOpen = !this.popupOpen;
      //   setTimeout(() => {
      //     if (!this.popupOpen) {
      //       norotate = false;
      //       this.rotateCamera(this.map.getBearing());
      //     }
      //   }, 1000);
      // })
    })

    this.map.on('click', 'extrusion', (e: any) => {
      let htmlString = "";
        htmlString += '<div class="hoveracoverlay">'
        htmlString += '<span class="hoveracname"> you clicked turf  ' +e.features.properties + ' </span><br>'
        htmlString += '</div>'
      let popup = new mapboxgl.Popup({maxWidth: '300px'})
      .setLngLat(e.lngLat)
      .setHTML(htmlString)
      .addTo(this.map);
    })

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

  loadTNAC() {
    this.mapService.getStateJSON('TN_AC').subscribe(res => {
      this.stateData = res;
    })
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
      this.mapService.getJSON(this.selectedYear, area).subscribe(res => {
        if(res) {
          this.activeConsti = this.selectedACNumber;
          this.manipulatedAreaRes = this.manipulateResponse(res)
          this.source.setData(this.manipulatedAreaRes);
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
          this.mapLoaded = true;
          this.notifierService.notify('error', 'No Data for selected Constituency');
        }
      }, (error) => {
        this.mapLoaded = true;
        this.notifierService.notify('error', 'No Data for selected Constituency');
      })
    } else {
          this.source.setData(this.basicLoad);
          this.map.setPaintProperty(
            'district-layer-votes',
            'fill-extrusion-height',
            0
          );
          this.map.setPaintProperty(
            'district-layer-votes',
            'fill-extrusion-color', 
            "transparent"
          );
    }
    
  }

  changeVotesLayer() {
    const res = this.manipulatedAreaRes;
    if(this.voteDistAndPerfDropdownVal == "DMK+") {
      this.map.setPaintProperty(
        'district-layer-votes',
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
                this.findAliance(res.features[0].properties)
              ],
              [
                "get",
                "total_alliance_votes_constituency"
              ]
            ],
            100000
          ],
          13,
          [
            "*",
            [
              "/",
              [
                "get",
                this.findAliance(res.features[0].properties)
              ],
              [
                "get",
                "total_alliance_votes_constituency"
              ]
            ],
            15000
          ]
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes',
        'fill-extrusion-color', [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "get",
              this.findAliance(res.features[0].properties)
            ],
            [
              "get",
              "total_alliance_votes_constituency"
            ]
          ],
          this.findVotes(res, "min"),
          "#E2E2E2",
          this.findVotes(res, "max"),
          "#000000"
        ]
      );
    } else if (this.voteDistAndPerfDropdownVal == "Opposition") {
      this.map.setPaintProperty(
        'district-layer-votes',
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
                "-",
                [
                  "get",
                  "total_votes" 
                ],
                [
                  "get",
                  this.findAliance(res.features[0].properties)
                ]
              ],
              [
                "-",
                [
                  "get",
                  "total_constituency_votes"
                ],
                [
                  "get",
                  "total_alliance_votes_constituency"
                ]
              ]
            ],
            100000
          ],
          13,
          [
            "*",
            [
              "/",
              [
                "-",
                [
                  "get",
                  "total_votes" 
                ],
                [
                  "get",
                  this.findAliance(res.features[0].properties)
                ]
              ],
              [
                "-",
                [
                  "get",
                  "total_constituency_votes"
                ],
                [
                  "get",
                  "total_alliance_votes_constituency"
                ]
              ]
            ],
            15000
          ]
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes',
        'fill-extrusion-color', [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "-",
              [
                "get",
                "total_votes" 
              ],
              [
                "get",
                this.findAliance(res.features[0].properties)
              ]
            ],
            [
              "-",
              [
                "get",
                "total_constituency_votes"
              ],
              [
                "get",
                "total_alliance_votes_constituency"
              ]
            ]
          ],
          this.findVotes(res, "min"),
          "#E2E2E2",
          this.findVotes(res, "max"),
          '#000000'
        ]
      );
    } else {
      this.map.setPaintProperty(
        'district-layer-votes',
        'fill-extrusion-height',
        [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          [
            "-",
            [
              "get",
              "total_votes" 
            ],
            [
              "get",
              this.findAliance(res.features[0].properties)
            ]
          ],
          13,
          [
            "/",
            [
              "-",
              [
                "get",
                "total_votes" 
              ],
              [
                "get",
                this.findAliance(res.features[0].properties)
              ]
            ],
            5
          ]
        ]
      );
      this.map.setPaintProperty(
        'district-layer-votes',
        'fill-extrusion-color', [
          "interpolate",
          ["linear"],
          [
            "-",
            [
              "get",
              "total_votes" 
            ],
            [
              "get",
              this.findAliance(res.features[0].properties)
            ]
          ],
          this.findVotes(res, "min"),
          "#E2E2E2",
          this.findVotes(res, "max"),
          '#000000'
        ]
      );
    }

    if(this.selectedPoleinActiveConstituency.polling_no) {
      this.highlightSelectedPole()
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

  findVotes(res, type)  {
    let totalVotes : number[] = [];
    res.features.forEach(feature => {
      const aliance = this.findAliance(feature.properties);
      if(feature.properties[aliance] && this.voteDistAndPerfDropdownVal == "DMK+") {
        totalVotes.push(feature.properties[aliance]/feature.properties.total_alliance_votes_constituency)
      } else if(feature.properties[aliance] && this.voteDistAndPerfDropdownVal == "Opposition") {
        totalVotes.push((feature.properties.total_votes - feature.properties[aliance])/(feature.properties.total_constituency_votes - feature.properties.total_alliance_votes_constituency))
      } else if(feature.properties[aliance] && this.voteDistAndPerfDropdownVal == "DMK+ Performance") {
        totalVotes.push(feature.properties.total_votes - feature.properties[aliance])
      }else {
        totalVotes.push(null)
      }
    });

    if(type == "min") {
      return Math.min(...totalVotes)
    } else {
      return Math.max(...totalVotes)
    }
  }

  findAliance(properties) {
    let parties = [];
    if(this.selectedYear === 2016) {
      parties = ["party_DMK","party_INC","party_IUML","party_PT","party_MAMAK","party_PTMK","party_TNPWP"];
    } else {
      parties = ["party_DMK", "party_INC", "party_CPI", "party_CPM", "party_VCK", "party_IUML", "party_IJK", "party_KMDK", "party_MDMK"]
    }
    let partyChoosen = "";
    parties.forEach(party => {
      if(properties[party]) {
        partyChoosen = party
      }
    })

    return partyChoosen
  }


  findTotalOppositionVotes(properties) {
    let parties = [];
    if(this.selectedYear === 2016) {
      parties = ["party_DMK","party_INC","party_IUML","party_PT","party_MAMAK","party_PTMK","party_TNPWP"];
    } else {
      parties = ["party_DMK", "party_INC", "party_CPI", "party_CPM", "party_VCK", "party_IUML", "party_IJK", "party_KMDK", "party_MDMK"]
    }
    const alliance = this.findAliance(properties);
    let totalOppoVotes = 0;
    parties.forEach(party => {
      if(party !== alliance) {
        totalOppoVotes = totalOppoVotes + properties[party]
      }
    })
    return totalOppoVotes
  }

  manipulateResponse(resp) {
    const activeParty = this.findAliance(resp.features[0].properties);
    let totalConstituencyVotes = 0;
    let totalActiveAliancePartyVotes = 0;
    for(let i=0; i< resp.features.length; i++) {
      totalConstituencyVotes = totalConstituencyVotes + resp.features[i].properties["total_votes"];
      totalActiveAliancePartyVotes = totalActiveAliancePartyVotes +  resp.features[i].properties[activeParty];
    }
    resp.features.forEach(feature => {
      feature.properties["total_constituency_votes"] = totalConstituencyVotes;
      feature.properties["total_alliance_votes_constituency"] = totalActiveAliancePartyVotes;
    });
    // console.log(JSON.stringify(resp))

    //change the point spikes to turf spikes
    let turfSpikes:any = {
      "type": "FeatureCollection",
      "features": []
    }

    const radiusOnZoom = {9: 100, 10: 80, 11: 100, 12: 70, 13: 45, 14: 30, 15: 20, 16: 15, 17: 10};
    const zoomLevel = Math.round(this.map.getZoom());

    resp.features.forEach((f) => {
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

  highlightSelectedPole() {
    const res = this.manipulatedAreaRes;
    this.map.setPaintProperty(
      'district-layer-votes',
      'fill-extrusion-color', [
        "match",
        ["get", "polling_no"],
        [this.selectedPoleinActiveConstituency.polling_no],
        "#FFFF00",
        [
          "interpolate",
          ["linear"],
          [
            "/",
            [
              "get",
              this.findAliance(res.features[0].properties)
            ],
            [
              "get",
              "total_alliance_votes_constituency"
            ]
          ],
          this.findVotes(res, "min"),
          "#E2E2E2",
          this.findVotes(res, "max"),
          '#000000'
        ]
      ]
    );
  }

  closeSliderPopup(rotate?) {
    if(this.manipulatedAreaRes) {
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

