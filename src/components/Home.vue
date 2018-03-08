<template>

  <md-layout md-column>

    <div>
      <md-layout md-row>

        <md-layout
          md-align="start"
          md-vertical-align="center"
          style="padding-left: 20px">

          <md-layout md-column>

            <md-layout
              md-row md-vertical-align="center"
               style="padding-left: 1em">
              <md-input-container
                style="width: 160px">

                <label for="country">
                  Country
                </label>

                <md-select
                  name="country"
                  id="country"
                  v-model="iCountry">
                  <md-option
                    :value="country.iCountry"
                    v-for="(country, i) in selectableCountries"
                    :key="i"
                    @selected="select()">
                    {{country.name}}
                  </md-option>
                </md-select>

              </md-input-container>

              <md-button
                class="md-raised md-fab md-mini"
                @click="random()">
                <md-icon>help</md-icon>
              </md-button>
            </md-layout>

            <md-layout
              md-row md-vertical-align="center"
              style="padding-left: 1em">
              <md-radio
                v-model="mode"
                @change="changeMode('to')"
                id="direction"
                name="direction"
                md-value="to">
                destinations
              </md-radio>
              <md-radio
                v-model="mode"
                @change="changeMode('risk')"
                id="direction"
                name="direction"
                md-value="risk">
                risk
              </md-radio>
              - days
              <div style="width: 300px">
                <vue-slider
                  ref="slider"
                  :interval="1"
                  @callback="selectTime()"
                  :max="15"
                  v-model="time"/>
              </div>
            </md-layout>

            <md-layout
              md-row md-vertical-align="center"
              style="padding-left: 1em">

              <md-input-container
                style="
                  width: 100px;
                  margin-left: 1em">
                <label>Incubation Period</label>
                <md-input
                  v-model="incubationPeriod"
                  type="number"
                  placeholder="in days"/>
              </md-input-container>

              <md-input-container
                style="
                  margin-left: 1em;
                  width: 100px">
                <label>Infectious Period</label>
                <md-input
                  v-model="infectiousPeriod"
                  type="number"
                  placeholder="in days"/>
              </md-input-container>

              <md-input-container
                style="
                  margin-left: 1em;
                  width: 100px">
                <label>Prevalence</label>
                <md-input
                  v-model="prevalence"
                  type="number"
                  placeholder="number of cases"/>
              </md-input-container>

            </md-layout>
          </md-layout>

        </md-layout>

      </md-layout>
    </div>

    <md-layout>

      <div
        id="main"
        style="
          background-color: white;
          width: calc(100vw);
          user-select: none;
          cursor: pointer">
      </div>

    </md-layout>

  </md-layout>

</template>

<style>
  html, body {
    overflow: hidden;
    position: fixed;
  }
  .countryTooltip {
    position: absolute;
    display: none;
    pointer-events: none;
    background: #fff;
    padding: 5px;
    text-align: left;
    border: solid #ccc 1px;
    color: #666;
    font-size: 14px;
    font-family: sans-serif;
  }
</style>

<script>
import _ from 'lodash'
import $ from 'jquery'

import vueSlider from 'vue-slider-component'

import Globe from '../modules/globe'

const travelData = require('../data/travel')
const worldData = require('../data/world')

let params = {
  contactRate: 10,
  recoverRate: 0.01
}

export default {

  id: 'home',

  components: {vueSlider},

  data () {
    return {
      selectableCountries: [],
      iCountry: -1,
      mode: 'to', // or 'risk'
      incubationPeriod: 5,
      infectiousPeriod: 30,
      prevalence: 30000,
      time: 1 // days
    }
  },

  mounted () {
    this.$element = $('#main')
    this.resize()
    window.addEventListener('resize', this.resize)

    this.globe = new Globe(worldData, '#main')
    this.globe.getCountryPopupHtml = this.getCountryPopupHtml
    this.globe.clickCountry = this.selectById

    this.travelData = travelData
    this.iCountry = 0
    this.mode = 'to' // 'to' or 'risk'

    let countries = []
    let nCountry = this.travelData.countries.length
    for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
      let country = travelData.countries[iCountry]
      let id = country.id
      let coordinates = country.coordinates
      if (coordinates && (id in this.globe.iCountryFromId)) {
        let name = country.name
        let population = country.population
        countries.push({name, iCountry, id, population})
      }
    }
    this.selectableCountries = _.sortBy(countries, a => a.name)

    this.random()
  },

  methods: {

    resize () {
      let position = this.$element.position()
      this.$element.height(window.innerHeight - position.top)
      if (this.globe) {
        this.globe.resize()
      }
    },

    getTravelValuesById (direction) {
      let values = {}
      let nCountry = this.travelData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        if (direction === 'to') {
          value = this.travelData.travel[this.iCountry][jCountry][1]
        } else {
          value = this.travelData.travel[jCountry][this.iCountry][1]
        }
        let id = this.travelData.countries[jCountry].id
        values[id] = value
      }
      return values
    },

    runSirModel (iCountry, delta, compartment, dTime) {
      let flow = {}
      flow.susceptible =
        - (params.contactRate *
             compartment.prevalence *
             compartment.susceptible /
             compartment.population)
      flow.prevalence =
        + (params.contactRate *
             compartment.prevalence *
             compartment.susceptible /
             compartment.population)
        - (params.recoverRate *
             compartment.prevalence)
      flow.recovered =
        + (params.recoverRate *
             compartment.prevalence)

      for (let key of ['prevalence', 'susceptible', 'recovered']) {
        delta[key] += dTime * flow[key]
      }
    },

    getRiskById () {
      let nDay = this.time
      let nCountry = this.travelData.countries.length

      const probSickCanTravel =
        parseFloat(this.incubationPeriod) /
          (parseFloat(this.incubationPeriod) +
           parseFloat(this.infectiousPeriod))

      let compartment = []
      for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
        let entry = {
          prevalence: 0,
          population: travelData.countries[iCountry].population,
          susceptible: 0,
          recovered: 0
        }
        if (this.iCountry === iCountry) {
          entry.prevalence = this.prevalence
        }
        entry.susceptible = entry.population - entry.prevalence
        compartment.push(entry)
      }

      for (let iDay = 0; iDay < nDay; iDay += 1) {
        let delta = []
        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          delta.push({prevalence: 0})
        }

        // calculates changes from travelling
        for (let iFromCountry = 0; iFromCountry < nCountry; iFromCountry += 1) {
          for (let iToCountry = 0; iToCountry < nCountry; iToCountry += 1) {
            // 2014 Feb data
            let travelPerDay = parseFloat(travelData.travel[iFromCountry][iToCountry][1])
            let population = parseFloat(travelData.countries[iFromCountry].population)
            if ((iFromCountry !== iToCountry) && isFinite(population)) {
              let probTravelPerDay = travelPerDay / population
              let probSickTravelPerDay = probSickCanTravel * probTravelPerDay
              delta[iToCountry].prevalence += compartment[iFromCountry].prevalence *
                probSickTravelPerDay
            }
          }
        }

        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          this.runSirModel(iCountry, delta[iCountry], compartment[iCountry], 1)
        }

        // update changes
        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          compartment[iCountry].prevalence += delta[iCountry].prevalence
        }
      }

      let result = {}
      for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
        let id = this.travelData.countries[iCountry].id
        result[id] = compartment[iCountry].prevalence
      }

      return result
    },

    loadCountry () {
      let valuesById
      if (_.startsWith(this.mode, 'risk')) {
        valuesById = this.getRiskById()
      } else {
        valuesById = this.getTravelValuesById(this.mode)
      }
      for (let [id, value] of _.toPairs(valuesById)) {
        this.globe.setCountryValue(id, value)
      }
      this.globe.setCountryValue(this.getId(), 0)
      let modeColors = {
        'to': '#02386F',
        'risk': '#f0f',
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode])
      this.globe.setCountryColor(this.getId(), '#f00')
    },

    getId () {
      return this.travelData.countries[this.iCountry].id
    },

    transition () {
      let country = this.travelData.countries[this.iCountry]
      let id = country.id
      let coordinates = country.coordinates
      console.log('> TravellingRollingGlobe.select', id, country.name, '' + coordinates)
      let countryTargetR = [-coordinates[1], -coordinates[0]]
      this.globe.rotateTransition(countryTargetR)
    },

    select () {
      this.loadCountry()
      this.transition()
    },

    selectById (id) {
      let country = _.find(this.selectableCountries, c => c.id === id)
      this.iCountry = country.iCountry
      this.select()
    },

    random () {
      let n = this.selectableCountries.length
      let i = Math.floor(Math.random() * Math.floor(n))
      this.iCountry = this.selectableCountries[i].iCountry
      this.select()
    },

    changeMode (mode) {
      this.mode = mode
      this.loadCountry()
      this.globe.draw()
    },

    getCountry (id) {
      return _.find(this.travelData.countries, c => c.id === id)
    },

    getCountryPopupHtml (id) {
      let country = this.getCountry(id)
      let name = ''
      let population = ''
      if (country) {
        name = country.name
        population = country.population
      }
      let value = this.globe.getCountryValue(id)
      if (value === null) {
        value = ''
      } else {
        value = value.toFixed(3)
      }
      let s = ''
      s += `<div style="width: 8em; text-align: center">`
      s += `${name}`
      let tag = 'travel'
      s += `<br>${tag}: ${value}`
      if (value !== null) {
        s += `<br>pop: ${population}`
      }
      s += `</div>`
      return s
    },

    selectTime () {
      this.mode = 'risk'
      this.loadCountry()
      this.globe.draw()
    }

  }
}
</script>
