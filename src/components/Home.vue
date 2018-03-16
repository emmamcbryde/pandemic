<template>

  <md-layout
    md-column
    style="padding: 1em">

    <div>
      <!-- controls at top -->
      <md-layout md-column>

        <md-layout
          md-row
          md-vertical-align="center">
          <md-input-container
            style="width: 160px">
            <label>
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
          md-row
          md-vertical-align="center">
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
          <div style="
            margin-left: 0.5em;
            width: 300px">
            <vue-slider
              ref="slider"
              :interval="1"
              @callback="selectDays()"
              :min="1"
              :max="15"
              v-model="days"/>
          </div>
        </md-layout>

        <md-layout
          md-row
          md-vertical-align="center">
          <md-input-container
            style="
              margin-right: 1em;
              width: 50px;">
            <label>Incubation</label>
            <md-input
              v-model="incubationPeriod"
              type="number"
              placeholder="in days"/>
          </md-input-container>
          <md-input-container
            style="
              margin-right: 1em;
              width: 50px">
            <label>Infectious</label>
            <md-input
              v-model="infectiousPeriod"
              type="number"
              placeholder="in days"/>
          </md-input-container>
          <md-input-container
            style="
              margin-right: 1em;
              width: 80px">
            <label>Prevalence</label>
            <md-input
              v-model="prevalence"
              type="number"
              placeholder="number of cases"/>
          </md-input-container>
          <md-input-container
            style="
              margin-right: 1em;
              width: 50px">
            <label>R0</label>
            <md-input
              v-model="reproductionNumber"
              type="number"
              placeholder="Reproduction Number"/>
          </md-input-container>
          {{params}}
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

import legend from 'd3-svg-legend'

import Globe from '../modules/globe'
import util from '../modules/util'

console.log(util.jstr({}))

const travelData = require('../data/travel')
const worldData = require('../data/world')

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
      reproductionNumber: 10,
      days: 1,
      params: {}
    }
  },

  mounted () {
    this.$element = $('#main')
    this.resize()
    window.addEventListener('resize', this.resize)

    this.globe = new Globe(worldData, '#main')
    this.globe.getCountryPopupHtml = this.getCountryPopupHtml
    this.globe.clickCountry = this.selectById

    this.mode = 'to' // 'to' or 'risk'

    this.travelData = travelData
    this.travelData.countries[177].population = 39000000
    this.iCountry = 0
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

    this.countryIndices = _.map(countries, 'iCountry')

    this.calcParams()

    this.random()

    let legend = d3.legendColor()
    let svg = d3.select("svg")
    
  },

  methods: {

    getICountryName (iCountry) {
      return this.travelData.countries[iCountry].name
    },

    resize () {
      let position = this.$element.position()
      this.$element.height(window.innerHeight - position.top)
      if (this.globe) {
        this.globe.resize()
      }
    },

    getTravelPerDay (iFrom, iTo) {
      // data is for Feb, 2015
      return parseFloat(this.travelData.travel[iFrom][iTo][1]) / 28
    },

    getPopulation (iCountry) {
      return parseFloat(travelData.countries[iCountry].population)
    },

    getTravelValuesById (direction) {
      let values = {}
      let nCountry = this.travelData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        if (direction === 'to') {
          value = this.getTravelPerDay(this.iCountry, jCountry)
        } else {
          value = this.getTravelPerDay(jCountry, this.iCountry)
        }
        let id = this.travelData.countries[jCountry].id
        values[id] = value
      }
      return values
    },

    runSirModel (iCountry, delta, compartment, dTime) {
      let flow = {}
      if (compartment.population > 1) {
        flow.susceptible =
          (-this.params.contactRate *
            compartment.prevalence *
            compartment.susceptible /
            compartment.population)
        flow.prevalence =
          (this.params.contactRate *
            compartment.prevalence *
            compartment.susceptible /
            compartment.population) -
          (this.params.recoverRate *
            compartment.prevalence)
        flow.recovered =
          (this.params.recoverRate *
            compartment.prevalence)

        for (let key of ['prevalence', 'susceptible', 'recovered']) {
          delta[key] += dTime * flow[key]
        }
      }
    },

    calcParams () {
      this.params.recoverRate = 1 / (this.incubationPeriod + this.infectiousPeriod)
      this.params.contactRate = this.reproductionNumber * this.params.recoverRate
    },

    getRiskById () {
      let nDay = this.days

      this.calcParams()

      const probSickCanTravel =
        parseFloat(this.incubationPeriod) /
          (parseFloat(this.incubationPeriod) +
            parseFloat(this.infectiousPeriod))

      this.compartment = {}
      for (let iCountry of this.countryIndices) {
        let entry = {
          prevalence: 0,
          population: parseFloat(travelData.countries[iCountry].population),
          susceptible: 0,
          recovered: 0
        }
        if (this.iCountry === iCountry) {
          entry.prevalence = parseFloat(this.prevalence)
        }
        entry.susceptible = entry.population - entry.prevalence
        this.compartment[iCountry] = entry
      }

      for (let iDay = 0; iDay < nDay; iDay += 1) {
        let delta = {}
        for (let iCountry of this.countryIndices) {
          delta[iCountry] = {
            prevalence: 0,
            susceptible: 0,
            recovered: 0
          }
        }

        // calculates changes from travelling
        for (let iFromCountry of this.countryIndices) {
          for (let iToCountry of this.countryIndices) {
            if (iFromCountry === iToCountry) {
              continue
            }
            let population = this.getPopulation(iFromCountry)
            if (!isFinite(population)) {
              console.log('> travel error', iFromCountry,
                this.travelData.countries[iFromCountry].name,
                travelData.countries[iFromCountry].population)
            } else {
              let travelPerDay = this.getTravelPerDay(iFromCountry, iToCountry)
              let probTravelPerDay = travelPerDay / population
              let probSickTravelPerDay = probSickCanTravel * probTravelPerDay
              let d = this.compartment[iFromCountry].prevalence * probSickTravelPerDay
              delta[iToCountry].prevalence += d
            }
          }
        }

        for (let iCountry of this.countryIndices) {
          this.runSirModel(iCountry, delta[iCountry], this.compartment[iCountry], 1)
        }

        // update changes
        for (let iCountry of this.countryIndices) {
          for (let key of _.keys(delta[iCountry])) {
            this.compartment[iCountry][key] += delta[iCountry][key]
            if (this.compartment[iCountry][key] < 0) {
              this.compartment[iCountry][key] = 0
            }
          }
          this.compartment[iCountry].population =
            this.compartment[iCountry].prevalence +
            this.compartment[iCountry].susceptible +
            this.compartment[iCountry].recovered
        }
      }

      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.travelData.countries[iCountry].id
        result[id] = this.compartment[iCountry].prevalence
      }
      let values = _.values(result)
      console.log('result', Math.max(...values), Math.min(...values))

      return [result, Math.max(...values)]
    },

    loadCountry () {
      let valuesById, maxValue
      if (_.startsWith(this.mode, 'risk')) {
        [valuesById, maxValue] = this.getRiskById()
        valuesById[this.getId()] = 0
        console.log(maxValue, Math.max(..._.values(valuesById)), 100)
        maxValue = 100
      } else {
        valuesById = this.getTravelValuesById(this.mode)
      }
      for (let [id, value] of _.toPairs(valuesById)) {
        this.globe.setCountryValue(id, value)
      }
      this.globe.setCountryValue(this.getId(), 0)
      let modeColors = {
        'to': '#02386F',
        'risk': '#f0f'
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode], maxValue)
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

    selectDays () {
      this.mode = 'risk'
      this.loadCountry()
      this.globe.draw()
    }

  }
}
</script>
