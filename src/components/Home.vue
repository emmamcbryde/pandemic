<template>

  <md-layout
    md-column
    style="padding: 1em">

    <div>
      <!-- controls at top -->
      <md-layout md-column>

        <md-layout>

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
              class="md-raised md-mini"
              @click="random()">
              Random
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
              width: 100px">
              <vue-slider
                ref="slider"
                :interval="1"
                @callback="calculateRisk"
                :min="1"
                :max="maxDay"
                v-model="days"/>
            </div>
            <md-switch
              v-model="isLoop"
              @change="changeLoop">
              Loop
            </md-switch>
          </md-layout>

          <md-layout
            md-row
            md-vertical-align="center">
            <md-input-container
              v-for="(entry, i) in inputParamEntries"
              :key="i"
              style="
                margin-right: 1em;
                width: 50px;">
              <label>{{entry.label}}</label>
              <md-input
                v-model="entry.value"
                type="number"
                :placeholder="entry.placeHolder"
                @change="calculateRisk"/>
            </md-input-container>
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
      <div
        style="
          position: absolute;
          bottom: 0">
        <svg id="legend"></svg>
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
import util from '../modules/util'
import {legendColor} from 'd3-svg-legend'

const d3 = require('d3')

const travelData = require('../data/travel')
const worldData = require('../data/world')

class SirModel {
  constructor (id) {
    this.id = id

    this.modelType = 'SIR'

    this.params = {}

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      recovered: 0
    }

    this.keys = _.keys(this.compartment)

    this.var = {}
    this.flow = {}
    this.delta = {}

    this.defaultInputParams = {
      population: 50000,
      incubationPeriod: 5,
      infectiousPeriod: 30,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 5,
        placeHolder: '',
        label: 'incubation'
      },
      {
        key: 'infectiousPeriod',
        value: 30,
        placeHolder: '',
        label: 'infectious'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 50,
        placeHolder: '',
        label: 'R0'
      }
    ]

    this.reset(this.defaultInputParams)
  }

  reset (inputParams) {
    this.params.recoverRate =
      1 /
        (inputParams.incubationPeriod +
         inputParams.infectiousPeriod)
    this.params.contactRate =
      inputParams.reproductionNumber *
        this.params.recoverRate
    this.params.probSickCanTravel =
      inputParams.incubationPeriod /
       (inputParams.incubationPeriod +
        inputParams.infectiousPeriod)

    for (let key of this.keys) {
      this.compartment[key] = 0
    }
    this.compartment.prevalence = inputParams.prevalence
    this.compartment.susceptible =
      inputParams.population - inputParams.prevalence
    this.compartment.recovered = 0

    this.var.population = inputParams.population
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
  }

  calcFlow () {
    for (let key of this.keys) {
      this.flow[key] = 0
    }

    this.flow.susceptible =
      (-this.params.contactRate *
        this.compartment.prevalence *
        this.compartment.susceptible /
        this.var.population)

    this.flow.prevalence =
      (this.params.contactRate *
        this.compartment.prevalence *
        this.compartment.susceptible /
        this.var.population) -
      (this.params.recoverRate *
        this.compartment.prevalence)

    this.flow.recovered =
      (this.params.recoverRate *
        this.compartment.prevalence)
  }

  updateCompartment (dTime) {
    this.calcVar()
    this.calcFlow()
    for (let key of this.keys) {
      this.delta[key] += dTime * this.flow[key]
    }
    for (let key of this.keys) {
      this.compartment[key] += this.delta[key]
      if (this.compartment[key] < 0) {
        this.compartment[key] = 0
      }
    }
  }

  getExitPrevalence (travelPerDay) {
    let population = this.var.population
    let probTravelPerDay = travelPerDay / population
    let probSickTravelPerDay =
      this.params.probSickCanTravel * probTravelPerDay
    return this.compartment.prevalence * probSickTravelPerDay
  }
}

export default {

  id: 'home',

  components: {vueSlider},

  data () {
    return {
      selectableCountries: [],
      iCountry: -1,
      mode: 'to', // or 'risk'
      days: 1,
      maxDay: 15,
      inputParamEntries: [],
      isLoop: false
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

    this.countryModel = {}
    for (let iCountry of this.countryIndices) {
      this.countryModel[iCountry] = new SirModel(iCountry)
      if (this.inputParamEntries.length === 0) {
        this.inputParamEntries = _.clone(this.countryModel[iCountry].inputParamEntries)
      }
    }

    this.random()

    setInterval(this.loop, 2000)
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

    getRiskById () {
      for (let param of this.inputParamEntries) {
        param.value = parseFloat(param.value)
      }

      console.log('getRiskById', _.clone(this.inputParamEntries))

      for (let iCountry of this.countryIndices) {
        let inputParams = {}
        for (let param of this.inputParamEntries) {
          inputParams[param.key] = param.value
        }
        inputParams.population = parseFloat(travelData.countries[iCountry].population)
        if (this.iCountry !== iCountry) {
          inputParams.prevalence = 0
        }
        this.countryModel[iCountry].reset(inputParams)
      }

      for (let iDay = 0; iDay < this.days; iDay += 1) {
        for (let iCountry of this.countryIndices) {
          this.countryModel[iCountry].clearDelta()
        }
        for (let iFromCountry of this.countryIndices) {
          for (let iToCountry of this.countryIndices) {
            if (iFromCountry !== iToCountry) {
              let travelPerDay = this.getTravelPerDay(iFromCountry, iToCountry)
              let deltaPrevalence =
                this.countryModel[iFromCountry].getExitPrevalence(travelPerDay)
              this.countryModel[iFromCountry].delta.prevalence -= deltaPrevalence
              this.countryModel[iToCountry].delta.prevalence += deltaPrevalence
            }
          }
        }
        for (let iCountry of this.countryIndices) {
          this.countryModel[iCountry].updateCompartment(1)
        }
      }

      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.travelData.countries[iCountry].id
        result[id] = this.countryModel[iCountry].compartment.prevalence
      }

      return [result, _.max(_.values(result))]
    },

    loadCountry () {
      let valuesById, maxValue
      if (_.startsWith(this.mode, 'risk')) {
        [valuesById, maxValue] = this.getRiskById()
        valuesById[this.getId()] = 0
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
      this.drawLegend()
    },

    getId () {
      return this.travelData.countries[this.iCountry].id
    },

    transition () {
      let country = this.travelData.countries[this.iCountry]
      let id = country.id
      let coordinates = country.coordinates
      console.log('> Home.transition', id, country.name, '' + coordinates)
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

    drawLegend () {
      let svg = d3.select('#legend')
      svg.html('')
      let colorLegend = legendColor()
        .labelFormat(d3.format('.0f'))
        .scale(this.globe.paletteScale)
        .shapePadding(5)
        .shapeWidth(50)
        .shapeHeight(20)
        .labelOffset(12)
      svg.append('g')
        // .attr('transform', 'translate(352, 60)')
        .call(colorLegend)
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

      let s = ''
      s += `<div style="text-align: center">`
      s += `${name}`

      let tag = 'travel'
      let value = this.globe.getCountryValue(id)
      if (value === null) {
        value = ''
      } else {
        value = value.toFixed(3)
      }
      s += `<br>${tag}: ${value}`

      if (value !== null) {
        s += `<br>pop: ${population}`
      }

      if (this.mode === 'risk') {
        let nCountry = this.travelData.countries.length
        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          let countryId = this.travelData.countries[iCountry].id
          if (countryId === id) {
            let prevalence = this.countryModel[iCountry].compartment.prevalence.toFixed(2)
            s += `<br>prevalence: ${prevalence}`
          }
        }
      }

      s += `</div>`
      return s
    },

    async calculateRisk () {
      console.log('> Home.calculateRisk for', this.days, 'days')
      // a little delay to allow the data to update
      await util.delay(10)
      this.mode = 'risk'
      this.loadCountry()
      this.globe.draw()
    },

    loop () {
      if ((this.isLoop) && (_.startsWith(this.mode, 'risk'))) {
        if (this.days < this.maxDay) {
          this.days += 1
        } else {
          this.days = 1
        }
        this.calculateRisk()
      }
    },

    changeLoop (p) {
      console.log('> Home.changeLoop', p)
      this.isLoop = p
      if (this.isLoop) {
        this.mode = 'risk'
      }
    }

  }
}
</script>
