<template>

  <md-layout
    md-column
    style="padding: 1em">

    <div>
      <md-layout md-column>

        <md-layout
          md-row
          md-vertical-align="center">

          <md-input-container
            style="
                margin-right: 1em;
                width: 120px">
            <label>
              Model
            </label>
            <md-select
              style="width: 120px"
              name="modelType"
              id="modelType"
              v-model="modelType">
              <md-option
                :value="modelType"
                v-for="(modelType, i) in modelTypes"
                :key="i"
                @selected="setModel">
                {{modelType}}
              </md-option>
            </md-select>
          </md-input-container>

          <md-input-container
            v-for="(entry, i) in inputParamEntries"
            :key="i"
            style="
                margin-right: 1em;
                width: 100px;">
            <label>{{entry.label}}</label>
            <md-input
              v-model="entry.value"
              type="number"
              :placeholder="entry.placeHolder"
              @change="calculateRisk"/>
          </md-input-container>

        </md-layout>

        <md-layout
          md-row
          style="margin-top: -1em"
          md-vertical-align="center">

          <md-input-container
            style="width: 160px">
            <label>
              Source Country
            </label>
            <md-select
              name="country"
              id="country"
              v-model="iSourceCountry">
              <md-option
                :value="country.iCountry"
                v-for="(country, i) in selectableCountries"
                :key="i"
                @selected="selectSourceCountry()">
                {{country.name}}
              </md-option>
            </md-select>
          </md-input-container>

          <span style="width:1em"></span>

          <md-radio
            v-model="mode"
            @change="selectMode('to')"
            id="direction"
            name="direction"
            md-value="to">
            destinations
          </md-radio>

          <span style="width:1em"></span>

          <md-radio
            v-model="mode"
            @change="selectMode('risk')"
            id="direction"
            name="direction"
            md-value="risk">
            risk
          </md-radio>

          - play &nbsp;
          <md-switch
            v-model="isLoop"
            @change="changeLoop">
          </md-switch>

          - {{ days }} days

          <div style="
              margin-left: 0.5em;
              width: 170px">
            <vue-slider
              ref="slider"
              :interval="1"
              tooltip="none"
              @callback="calculateRisk"
              :min="1"
              :max="getMaxDays"
              v-model="days"/>
          </div>


          <md-input-container
            style="
              margin-left: 1em;
              width: 80px;">
            <label>Max Days</label>
            <md-input
              v-model="maxDays"
              type="number"/>
          </md-input-container>

        </md-layout>

        <md-layout id="globalCharts">
        </md-layout>

        <md-layout id="localCharts">
          <div>
            <md-input-container
              style="width: 140px">
              <label>
                Watch Country
              </label>
              <md-select
                name="country"
                id="country"
                v-model="iWatchCountry">
                <md-option
                  :value="country.iCountry"
                  v-for="(country, i) in selectableCountries"
                  :key="i"
                  @selected="selectWatchCountry()">
                  {{country.name}}
                </md-option>
              </md-select>
            </md-input-container>
          </div>
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
  .chart {
    width: 250px;
    height: 130px;
  }
</style>

<script>
import _ from 'lodash'
import $ from 'jquery'
import numeral from 'numeral'

import vueSlider from 'vue-slider-component'

import util from '../modules/util'
import Globe from '../modules/globe'
import {legendColor} from 'd3-svg-legend'
import {models} from '../modules/models'
import ChartWidget from '../modules/chart-widget'

const d3 = require('d3')

const travelData = require('../data/travel')
const worldData = require('../data/world')

function waitForElement (selector) {
  return new Promise(resolve => {
    function loop () {
      let $element = $(selector)
      if ($element.length) {
        resolve($element)
      } else {
        window.setTimeout(loop, 50)
      }
    }
    loop()
  })
}

function acumulateValues (vals) {
  let result = []
  for (let i of _.range(vals.length)) {
    let val = _.sum(vals.slice(0, i + 1))
    result.push(val)
  }
  return result
}

export default {

  id: 'home',

  components: {vueSlider},

  data () {
    let modelTypes = _.map(models, 'name')
    return {
      selectableCountries: [],
      iSourceCountry: -1,
      iWatchCountry: -1,
      mode: 'to', // or 'risk'
      days: 1,
      maxDays: 60,
      inputParamEntries: [],
      isLoop: false,
      modelType: modelTypes[0],
      modelTypes: modelTypes
    }
  },

  async mounted () {
    this.$element = $('#main')
    this.resize()
    window.addEventListener('resize', this.resize)

    this.globe = new Globe(worldData, '#main')
    this.globe.getCountryPopupHtml = this.getCountryPopupHtml
    this.globe.clickCountry = this.selectById

    this.mode = 'to' // 'to' or 'risk'

    this.travelData = travelData
    this.travelData.countries[177].population = 39000000
    this.iSourceCountry = 0
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
    this.setModel(this.modelType)
    this.isRunning = false

    this.random()

    this.chartWidgets = {}
    await this.newChartWidget('#globalCharts', 'globalPrevalence')
    await this.newChartWidget('#globalCharts', 'cumulativeIncidence')
    await this.newChartWidget('#localCharts', 'prevalence')
    await this.newChartWidget('#localCharts', 'susceptible')
    await this.newChartWidget('#localCharts', 'inputIncidence')

    window.dispatchEvent(new Event('resize'))

    setInterval(this.loop, 2000)
  },

  computed: {
    /**
     * Needed as md-input corrupts this.maxDays into string
     * @returns {number}
     */
    getMaxDays () {
      return parseFloat(this.maxDays)
    }
  },

  methods: {
    async newChartWidget (parentSelector, id) {
      $(parentSelector).append($(`<div id="${id}" class="chart">`))
      let selector = `#${id}`
      await waitForElement(selector)
      let chartWidget = new ChartWidget(selector)
      chartWidget.setTitle('')
      chartWidget.setXLabel('')
      chartWidget.setYLabel('')
      chartWidget.addDataset(id)
      chartWidget.getChartOptions().scales.yAxes[0].ticks.callback = (val) => {
        return numeral(val).format('0a')
      }
      this.chartWidgets[id] = chartWidget
      return selector
    },

    getNameFromICountry (iCountry) {
      return this.travelData.countries[iCountry].name
    },

    async changeMaxDays () {
      await util.delay(20)
      this.calculateRisk()
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
      return this.travelData.travel[iFrom][iTo][1] / 28
    },

    getPopulation (iCountry) {
      return travelData.countries[iCountry].population
    },

    getTravelValuesById (direction) {
      let values = {}
      let nCountry = this.travelData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        if (direction === 'to') {
          value = this.getTravelPerDay(this.iSourceCountry, jCountry)
        } else {
          value = this.getTravelPerDay(jCountry, this.iSourceCountry)
        }
        let id = this.travelData.countries[jCountry].id
        values[id] = value
      }
      return values
    },

    resetModels () {
      for (let param of this.inputParamEntries) {
        param.value = parseFloat(param.value)
      }

      for (let iCountry of this.countryIndices) {
        let inputParams = {}
        for (let param of this.inputParamEntries) {
          inputParams[param.key] = param.value
        }
        inputParams.initPopulation = travelData.countries[iCountry].population
        if (this.iSourceCountry !== iCountry) {
          inputParams.prevalence = 0
        }
        this.countryModel[iCountry].resetParams(inputParams)
      }

      this.globalIncidence = []
      this.cumulativeIncidence = []
    },

    async setModel () {
      await util.delay(100)

      let ModelClass
      for (let model of models) {
        if (model.name === this.modelType) {
          ModelClass = model.class
        }
      }
      let countryName = this.getNameFromICountry(this.iSourceCountry)
      console.log('> Home.setModel', this.modelType, countryName)
      this.countryModel = {}
      let oldInputParams = {}
      for (let paramEntry of this.inputParamEntries) {
        oldInputParams[paramEntry.key] = paramEntry.value
      }
      this.inputParamEntries.length = 0
      for (let iCountry of this.countryIndices) {
        this.countryModel[iCountry] = new ModelClass(countryName)
        if (this.inputParamEntries.length === 0) {
          this.inputParamEntries = this.countryModel[iCountry].getInputParamEntries()
        }
      }
      for (let paramEntry of this.inputParamEntries) {
        if (paramEntry.key in oldInputParams) {
          paramEntry.value = oldInputParams[paramEntry.key]
        }
      }
      this.resetModels()
      this.selectMode(this.mode)
    },

    getPropKey (prop, key) {
      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.travelData.countries[iCountry].id
        result[id] = this.countryModel[iCountry][prop][key]
      }
      return result
    },

    async getRiskById () {
      this.isRunning = true
      this.globalPrevalence = []
      this.resetModels()

      for (let iCountry of this.countryIndices) {
        this.countryModel[iCountry].clearDelta()
      }

      for (let iDay = 0; iDay < this.days; iDay += 1) {
        for (let iCountry of this.countryIndices) {
          this.countryModel[iCountry].clearDelta()
        }

        for (let iFromCountry of this.countryIndices) {
          for (let iToCountry of this.countryIndices) {
            if (iFromCountry !== iToCountry) {
              let travelPerDay = this.getTravelPerDay(iFromCountry, iToCountry)
              let fromCountry = this.countryModel[iFromCountry]
              let toCountry = this.countryModel[iToCountry]
              let delta = fromCountry.getExitPrevalence(travelPerDay)
              fromCountry.delta.prevalence -= delta
              toCountry.delta.prevalence += delta
            }
          }
        }

        let globalPrevalence = 0
        let globalIncidence = 0
        for (let iCountry of this.countryIndices) {
          let country = this.countryModel[iCountry]
          country.updateCompartment(1)
          for (let key of ['prevalence', 'susceptible']) {
            country.solution[key].push(country.compartment[key])
          }
          globalPrevalence += country.compartment.prevalence
          globalIncidence += _.last(country.solution.incidence)
        }

        this.globalIncidence.push(globalIncidence)
        this.globalPrevalence.push(globalPrevalence)
      }

      let days =  _.map(_.range(this.days), d => d + 1)

      this.chartWidgets.globalPrevalence.setTitle('Global Prevalence')
      this.chartWidgets.globalPrevalence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.globalPrevalence.updateDataset(0, days, this.globalPrevalence)

      this.chartWidgets.cumulativeIncidence.setTitle('Global Cumulative Incidence')
      this.chartWidgets.cumulativeIncidence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.cumulativeIncidence.updateDataset(0, days, acumulateValues(this.globalIncidence))

      this.updateWatchCountry()

      this.isRunning = false

      let result = this.getPropKey('compartment', 'prevalence')
      return [result, _.max(_.values(result))]
    },

    async updateWatchCountry () {
      await util.delay(100)
      if (this.iWatchCountry < 0) {
        return
      }
      let days = _.map(_.range(this.days), d => d + 1)
      let solution = this.countryModel[this.iWatchCountry].solution

      this.chartWidgets.prevalence.setTitle('Prevalence')
      this.chartWidgets.prevalence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.prevalence.updateDataset(0, days, solution.prevalence)

      this.chartWidgets.susceptible.setTitle('Susceptible')
      this.chartWidgets.susceptible.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.susceptible.updateDataset(0, days, solution.susceptible)

      this.chartWidgets.inputIncidence.setTitle('Cumulative Input Incidence')
      this.chartWidgets.inputIncidence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.inputIncidence.updateDataset(0, days, acumulateValues(solution.inputIncidence))
    },

    async loadCountry () {
      let valuesById, maxValue
      if (_.startsWith(this.mode, 'risk')) {
        while (this.isRunning) {
          await util.delay(100)
        }
        [valuesById, maxValue] = await this.getRiskById()
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
      return this.travelData.countries[this.iSourceCountry].id
    },

    getICountry (id) {
      for (let i in _.range(this.travelData.countries.length)) {
        if (this.travelData.countries[i].id === id) {
          return i
        }
      }
      return null
    },

    transition (iCountry) {
      let country = this.travelData.countries[iCountry]
      let id = country.id
      let coordinates = country.coordinates
      console.log('> Home.transition', id, country.name, '' + coordinates)
      let countryTargetR = [-coordinates[1], -coordinates[0]]
      this.globe.rotateTransition(countryTargetR)
    },

    async selectSourceCountry () {
      await util.delay(100)
      this.loadCountry()
      this.transition(this.iSourceCountry)
    },

    async selectWatchCountry () {
      console.log('selectWatchCountry', util.jstr(this.iWatchCountry))
      await this.updateWatchCountry()
      this.transition(this.iWatchCountry)
    },

    selectById (id) {
      let country = _.find(this.selectableCountries, c => c.id === id)
      this.iSourceCountry = country.iCountry
      this.selectSourceCountry()
    },

    random () {
      let n = this.selectableCountries.length
      let i = Math.floor(Math.random() * Math.floor(n))
      this.iSourceCountry = this.selectableCountries[i].iCountry
      this.iWatchCountry = this.iSourceCountry
      this.selectSourceCountry()
    },

    async selectMode (mode) {
      await util.delay(100)
      console.log('> Home.selectMode', mode)
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
      this.iWatchCountry = parseInt(this.getICountry(id))
      this.updateWatchCountry()

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
      // a little delay to allow the data to update
      await util.delay(100)
      this.mode = 'risk'
      this.loadCountry()
      this.globe.draw()
    },

    loop () {
      if ((this.isLoop) && (_.startsWith(this.mode, 'risk'))) {
        if (this.days < this.getMaxDays) {
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
