<template>

  <md-layout
    md-row
    style="
      height: calc(100vh - 48px);
      width: calc(100vw);">

    <div style="height: calc(100vh - 48px); width: 50%">
      <div style="overflow-y: scroll; height: calc(100vh - 48px); padding: 1em;">
        <md-layout md-column>

          <h3 class="md-title">Model Parameters</h3>

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
                    @selected="asyncSelectNewModel">
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
                  :step="entry.step"
                  :placeholder="entry.placeHolder"
                  @change="asyncCalculateRisk"/>
              </md-input-container>

            </md-layout>

          <h3 class="md-title">Source Country</h3>

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
                  @selected="asyncSelectSourceCountry()">
                  {{country.name}}
                </md-option>
              </md-select>
            </md-input-container>

            <span style="width:1em"></span>

            <md-radio
              v-model="mode"
              @change="asyncSelectMode('destination')"
              id="direction"
              name="direction"
              md-value="destination">
              destinations
            </md-radio>

            <span style="width:1em "></span>

            <md-radio
              v-model="mode"
              @change="asyncSelectMode('risk')"
              id="direction"
              name="direction"
              md-value="risk">risk</md-radio>

            <md-switch
              v-model="isLoop"
              @change="toggleLoop">
              play
            </md-switch>

          </md-layout>

          <h3 class="md-title">Risk Factor</h3>

          <md-layout
            md-row
            md-vertical-align="center">

            {{ days }} days

            <div style="
                    margin-left: 0.5em;
                    width: 170px">
              <vue-slider
                ref="slider"
                :interval="1"
                tooltip="none"
                @callback="asyncCalculateRisk"
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

          <div
            v-show="mode === 'risk'"
            style="width: 100%">

            <div
              v-show="mode === 'risk'"
              style="width: 100%">
              <md-layout id="globalCharts">
              </md-layout>
            </div>

            <h3 class="md-title" v-show="mode === 'risk'">Watch Country</h3>

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
                    @selected="asyncSelectWatchCountry()">
                    {{country.name}}
                  </md-option>
                </md-select>
              </md-input-container>
            </div>

            <md-layout id="localCharts">
            </md-layout>
          </div>

        </md-layout>
      </div>
    </div>

    <div style="height: calc(100vh - 48px); flex: 1; border-left: 1px solid #CCC">
      <md-layout style="overflow: scroll; height: calc(100vh - 48px);">
        <div
          id="main"
          style="
            background-color: white;
            height: 100%;
            width: 100%;">
        </div>
      </md-layout>
    </div>

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
import {models} from '../modules/models'
import ChartWidget from '../modules/chart-widget'

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

function convertLabel (val) {
  val = parseFloat(val)
  if (val > 1) {
    return numeral(val).format('0a')
  } if (val === 0) {
    return '0'
  } else {
    return numeral(val).format('0.0[000000]')
  }
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
      mode: 'destination', // or 'risk'
      days: 1,
      maxDays: 60,
      inputParamEntries: [],
      isLoop: false,
      modelType: modelTypes[0],
      modelTypes: modelTypes
    }
  },

  async mounted () {
    this.isRunning = true

    this.$element = $('#main')
    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.globe = new Globe(worldData, '#main')
    this.globe.getCountryPopupHtml = this.getCountryPopupHtml
    this.globe.clickCountry = this.selectSourceCountryById

    this.mode = 'destination' // 'destination' or 'risk'

    this.travelData = travelData
    this.travelData.countries[177].population = 39000000

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

    this.iSourceCountry = 0

    this.countryIndices = _.map(countries, 'iCountry')

    this.countryModel = {}
    this.setNewModels()

    this.chartWidgets = {}
    await this.asyncMakeChartWidget('#globalCharts', 'globalPrevalence')
    await this.asyncMakeChartWidget('#globalCharts', 'cumulativeIncidence')
    await this.asyncMakeChartWidget('#localCharts', 'prevalence')
    await this.asyncMakeChartWidget('#localCharts', 'susceptible')
    await this.asyncMakeChartWidget('#localCharts', 'importIncidence')

    window.dispatchEvent(new Event('resize'))

    await this.asyncSelectRandomSourceCountry()

    this.loopTimeStepMs = 2000

    setInterval(this.loop, this.loopTimeStepMs)

    this.isRunning = false
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
    async asyncMakeChartWidget (parentSelector, id) {
      let $parent = $(parentSelector)
      await waitForElement($parent)
      $parent.append($(`<div id="${id}" class="chart">`))
      let selector = `#${id}`
      await waitForElement(selector)
      let chartWidget = new ChartWidget(selector)
      chartWidget.setTitle('')
      chartWidget.setXLabel('')
      chartWidget.setYLabel('')
      chartWidget.addDataset(id)
      chartWidget.getChartOptions().scales.yAxes[0].ticks.callback = convertLabel
      this.chartWidgets[id] = chartWidget
      return selector
    },

    getId () {
      return this.travelData.countries[this.iSourceCountry].id
    },

    getCountry (id) {
      return _.find(this.travelData.countries, c => c.id === id)
    },

    getICountry (id) {
      for (let i in _.range(this.travelData.countries.length)) {
        if (this.travelData.countries[i].id === id) {
          return i
        }
      }
      return null
    },

    getNameFromICountry (iCountry) {
      return this.travelData.countries[iCountry].name
    },

    getPropKey (prop, key) {
      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.travelData.countries[iCountry].id
        result[id] = this.countryModel[iCountry][prop][key]
      }
      return result
    },

    async asyncChangeMaxDays () {
      await util.delay(20)
      this.asyncCalculateRisk()
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

    getTravelValuesById () {
      let values = {}
      let nCountry = this.travelData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        value = this.getTravelPerDay(this.iSourceCountry, jCountry)
        let id = this.travelData.countries[jCountry].id
        values[id] = value
      }
      return values
    },

    setNewModels () {
      let oldInputParams = {}
      for (let paramEntry of this.inputParamEntries) {
        oldInputParams[paramEntry.key] = paramEntry.value
      }

      let ModelClass
      for (let model of models) {
        if (model.name === this.modelType) {
          ModelClass = model.class
        }
      }

      let countryName = this.getNameFromICountry(this.iSourceCountry)
      this.countryModel = {}
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

      this.solution = {
        globalIncidence: [],
        globalPrevalence: []
      }
    },

    calculateRiskOfSourceCountry () {
      this.resetModels()

      for (let iDay = 0; iDay < this.days; iDay += 1) {
        for (let iCountry of this.countryIndices) {
          this.countryModel[iCountry].clearDelta()
          this.countryModel[iCountry].importIncidence = 0
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
              toCountry.importIncidence += delta
            }
          }
        }

        let globalPrevalence = 0
        let globalIncidence = 0
        let dTimeInDay = 1

        for (let iCountry of this.countryIndices) {
          let country = this.countryModel[iCountry]

          country.updateCompartment(dTimeInDay)

          country.solution.inputIncidence.push(country.importIncidence)
          for (let key of ['prevalence', 'susceptible']) {
            country.solution[key].push(country.compartment[key])
          }
          globalPrevalence += country.compartment.prevalence
          globalIncidence += _.last(country.solution.incidence)
        }

        this.solution.globalIncidence.push(globalIncidence)
        this.solution.globalPrevalence.push(globalPrevalence)
      }

      let days = _.map(_.range(this.days), d => d + 1)

      this.chartWidgets.globalPrevalence
        .setTitle('Global Prevalence')
      this.chartWidgets.globalPrevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.globalPrevalence.updateDataset(
        0, days, this.solution.globalPrevalence)

      this.chartWidgets.cumulativeIncidence
        .setTitle('Global Cumulative Incidence')
      this.chartWidgets.cumulativeIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.cumulativeIncidence.updateDataset(
        0, days, acumulateValues(this.solution.globalIncidence))
    },

    updateWatchCountry () {
      if (this.iWatchCountry < 0) {
        return
      }
      let days = _.map(_.range(this.days), d => d + 1)

      let countryModel = this.countryModel[this.iWatchCountry]
      if (_.isUndefined(countryModel)) {
        return
      }
      let solution = countryModel.solution

      this.chartWidgets.prevalence
        .setTitle('Prevalence')
      this.chartWidgets.prevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.prevalence.updateDataset(
        0, days, solution.prevalence)

      this.chartWidgets.susceptible
        .setTitle('Susceptible')
      this.chartWidgets.susceptible
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.susceptible
        .updateDataset(0, days, solution.susceptible)

      this.chartWidgets.importIncidence
        .setTitle('Cumulative Import Incidence')
      this.chartWidgets.importIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.importIncidence
        .updateDataset(0, days, acumulateValues(solution.inputIncidence))
    },

    async asyncRecalculateGlobe () {
      let valuesById, maxValue
      if (_.startsWith(this.mode, 'risk')) {
        while (this.isRunning) {
          await util.delay(100)
        }
        this.isRunning = true
        this.calculateRiskOfSourceCountry()
        valuesById = this.getPropKey('compartment', 'prevalence')
        valuesById[this.getId()] = 0
        maxValue = 100
        this.isRunning = false
        this.updateWatchCountry()
      } else {
        valuesById = this.getTravelValuesById()
      }
      for (let [id, value] of _.toPairs(valuesById)) {
        this.globe.setCountryValue(id, value)
      }
      this.globe.setCountryValue(this.getId(), 0)
      let modeColors = {
        'destination': '#02386F',
        'risk': '#f0f'
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode], maxValue)
      this.globe.setCountryColor(this.getId(), '#f00')
      this.globe.draw()
      this.drawLegend()
    },

    async asyncSelectNewModel () {
      await util.delay(100)
      this.setNewModels()
      this.resetModels()
      await this.asyncRecalculateGlobe()
    },

    rotateToCountry (iCountry) {
      let country = this.travelData.countries[iCountry]
      let id = country.id
      let coordinates = country.coordinates
      console.log('> Home.rotateToCountry', id, country.name, '' + coordinates)
      let countryTargetR = [-coordinates[1], -coordinates[0]]
      this.globe.rotateTransition(countryTargetR)
    },

    async asyncSelectSourceCountry () {
      await util.delay(100)
      this.asyncRecalculateGlobe()
      this.rotateToCountry(this.iSourceCountry)
    },

    async asyncSelectWatchCountry () {
      await util.delay(100)
      console.log('> Home.asyncSelectWatchCountry', util.jstr(this.iWatchCountry))
      this.updateWatchCountry()
      this.rotateToCountry(this.iWatchCountry)
    },

    selectSourceCountryById (id) {
      let country = _.find(this.selectableCountries, c => c.id === id)
      this.iSourceCountry = country.iCountry
      this.asyncSelectSourceCountry()
    },

    async asyncSelectRandomSourceCountry () {
      let n = this.selectableCountries.length
      let i = Math.floor(Math.random() * Math.floor(n))
      this.iSourceCountry = this.selectableCountries[i].iCountry
      this.iWatchCountry = this.iSourceCountry
      await this.asyncSelectSourceCountry()
    },

    async asyncSelectMode (mode) {
      await util.delay(100)
      console.log('> Home.asyncSelectMode', mode)
      this.mode = mode
      this.asyncRecalculateGlobe()
    },

    drawLegend () {
      this.globe.drawLegend()
    },

    async asyncCalculateRisk () {
      this.mode = 'risk'
      await this.asyncRecalculateGlobe()
    },

    loop () {
      if ((this.isLoop) && (_.startsWith(this.mode, 'risk'))) {
        if (this.days < this.getMaxDays) {
          this.days += 1
        } else {
          this.days = 1
        }
        this.asyncCalculateRisk()
      }
    },

    toggleLoop (boolValue) {
      this.isLoop = boolValue
      if (this.isLoop) {
        this.mode = 'risk'
      }
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
    }

  }
}
</script>
