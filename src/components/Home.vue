<template>

  <md-layout
    md-row
    style="
      height: calc(100vh - 48px);
      width: calc(100vw);">

    <div style="height: calc(100vh - 48px); width: 50%">
      <div style="overflow-y: scroll; height: calc(100vh - 48px); padding: 1em;">
        <md-layout md-column>

          <md-card style="padding: 1em">

            <h3 class="md-title">Model Parameters</h3>

            <md-layout md-row md-vertical-align="center">

              <div
                style="
                    display: inline;
                    color: red;
                    font-size: 1.5em;
                    line-height: 1em;
                    height: 1em;
                    min-height: 1em;
                    margin-right: 0.2em">
                &block;
              </div>

              <md-input-container
                style="
                    padding-left: 0.2em;
                    width: 160px;
                    margin-right: 1em">
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

            </md-layout>

            <md-layout
              md-row
              md-vertical-align="center">

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
                  min = "0"
                  :step = "entry.step"
                  @change="asyncCalculateRisk"/>
              </md-input-container>

            </md-layout>

          </md-card>

          <md-card style="padding: 1em; margin-top: 1em">

            <h3 class="md-title">Intervention Model Parameters</h3>

            <md-layout
              md-row
              md-vertical-align="center">

              <md-input-container
                v-for="(entry, i) in interventionInputParamEntries"
                :key="i"
                style="
                    margin-right: 1em;
                    width: 100px;">
                <label>{{entry.label}}</label>
                <md-input
                  v-model="entry.value"
                  type="number"
                  min = "0"
                  :step = "entry.step"
                  @change="asyncCalculateRisk"/>
              </md-input-container>

            </md-layout>

          </md-card>

          <md-card style="padding: 1em; margin-top: 1em">
          <h3 class="md-title">
            Output
          </h3>

          <md-layout
            md-row
            style="margin-top: -1em"
            md-vertical-align="center">

            <md-radio
              v-model="mode"
              @change="asyncSelectMode('destination')"
              id="direction"
              name="direction"
              md-value="destination">
              <div
                style="
                display: inline;
                height: 1em;
                color: #02386F">
                &block;
              </div>
              destinations
            </md-radio>

            <span style="width:1em"></span>

            <md-radio
              v-model="mode"
              @change="asyncSelectMode('risk')"
              id="direction"
              name="direction"
              md-value="risk">
              <div
                style="
                display: inline;
                height: 1em;
                color: #f0f">
                &block;
              </div>
              risk
            </md-radio>

          </md-layout>

          <md-layout
            md-row
            md-vertical-align="center">

            play &nbsp;
            <md-switch
              v-model="isLoop"
              @change="toggleLoop">
            </md-switch>

            {{ days }} days

            <div style="
                    flex: 1;
                    margin-left: 0.5em;">
              <vue-slider
                ref="slider"
                :interval="1"
                tooltip="none"
                @callback="asyncCalculateRisk()"
                :min="1"
                :max="getMaxDays"
                v-model="days"/>
            </div>

          </md-layout>

          <md-layout
            md-row
            md-vertical-align="center">

            <md-input-container
              style="
                  width: 80px;">
              <label>Max Days</label>
              <md-input
                v-model="maxDays"
                type="number"
                @change="asyncCalculateRisk()"/>
            </md-input-container>

            <md-input-container
              style="
                  margin-left: 1em;
                  width: 130px;">
              <label>Max Prevalence</label>
              <md-input
                v-model="maxPrevalence"
                type="number"
                @change="asyncCalculateRisk()"/>
            </md-input-container>

          </md-layout>

          <div
            v-show="mode === 'risk'"
            style="width: 100%">

            <div>
              <div
                style="
                  display: inline;
                  height: 1em;
                  color: #4ABDAC">
                &block;
              </div>
              intervention
            </div>

            <div
              v-show="mode === 'risk'"
              style="width: 100%">
              <md-layout id="globalCharts">
              </md-layout>
            </div>

            <md-layout md-row>
              <div
                style="
                display: inline;
                height: 1em;
                color: green;
                margin-right: 1em; ">
                &block;
              </div>

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
            </md-layout>

            <md-layout id="localCharts">
            </md-layout>
          </div>
          </md-card>
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
import {GlobalModel} from '../modules/global-model'

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

function copyArray (dest, source) {
  dest.length = 0
  for (let v of source) {
    dest.push(v)
  }
}

export default {

  id: 'home',

  components: {vueSlider},

  /**
   * There are three indexes
   * - country ID
   * - iCountry based on countries
   * - and an index based on the world.json files
   *
   * It's important to keep these distinguished with
   * the correct variable names.
   */

  data () {
    let modelTypes = _.map(models, 'name')
    return {
      selectableCountries: [],
      iSourceCountry: -1,
      iWatchCountry: -1,
      mode: 'destination', // or 'risk'
      days: 1,
      maxDays: 60,
      maxPrevalence: 20,
      inputParamEntries: [],
      interventionInputParamEntries: [],
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
    this.globe.clickCountry = this.selectSourceCountryByCountryId

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

    this.globalModel = new GlobalModel()
    this.globalModel.getTravelPerDay = this.getTravelPerDay

    this.setNewEpiModel()

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
      chartWidget.addDataset(id + '-intervention')
      chartWidget.getChartOptions().scales.yAxes[0].ticks.callback = convertLabel
      this.chartWidgets[id] = chartWidget
      return selector
    },

    getSourceCountryId () {
      return this.travelData.countries[this.iSourceCountry].id
    },

    getCountry (countryId) {
      return _.find(this.travelData.countries, c => c.id === countryId)
    },

    getICountry (countryId) {
      for (let i in _.range(this.travelData.countries.length)) {
        if (this.travelData.countries[i].id === countryId) {
          return i
        }
      }
      return null
    },

    getNameFromICountry (iCountry) {
      return this.travelData.countries[iCountry].name
    },

    getPrevalenceByCountryId () {
      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.travelData.countries[iCountry].id
        let countryModel = this.globalModel.countryModel[iCountry]
        result[id] = countryModel.compartment.prevalence
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

    getTravelPerDay (iCountryFrom, iCountryTo) {
      // data is for Feb, 2015
      return this.travelData.travel[iCountryFrom][iCountryTo][1] / 28
    },

    getTravelValuesByCountryId () {
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

    setNewEpiModel () {
      let oldInputParams = {}
      for (let paramEntry of this.inputParamEntries) {
        oldInputParams[paramEntry.key] = paramEntry.value
      }

      let oldInterventionInputParams = {}
      for (let paramEntry of this.interventionInputParamEntries) {
        oldInterventionInputParams[paramEntry.key] = paramEntry.value
      }

      let ModelClass
      for (let model of models) {
        if (model.name === this.modelType) {
          ModelClass = model.class
        }
      }

      let sourceCountryName = this.getNameFromICountry(this.iSourceCountry)
      this.globalModel.setCountryModel(
        this.countryIndices, ModelClass, sourceCountryName)
      copyArray(this.inputParamEntries, this.globalModel.getInputParamEntries())
      copyArray(this.interventionInputParamEntries, this.globalModel.getInterventionInputParamEntries())

      for (let paramEntry of this.inputParamEntries) {
        if (paramEntry.key in oldInputParams) {
          paramEntry.value = oldInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
      }

      for (let paramEntry of this.interventionInputParamEntries) {
        if (paramEntry.key in oldInterventionInputParams) {
          paramEntry.value = oldInterventionInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
      }
    },

    parameterizeGlobalModelFromInput () {
      for (let iCountry of this.countryIndices) {
        let countryModel = this.globalModel.countryModel[iCountry]
        countryModel.injestInputParamEntries(this.inputParamEntries)
        countryModel.params.initPopulation = travelData.countries[iCountry].population
        if (this.iSourceCountry !== iCountry) {
          countryModel.params.prevalence = 0
        }
      }

      this.intervention = null
      let entry = _.find(this.inputInterventionParamEntries, e => e.key === 'interventionDay')
      if (entry) {
        this.globalModel.interventionDay = entry.value
      }
    },

    calculateRiskOfSourceCountry () {
      this.parameterizeGlobalModelFromInput()

      this.globalModel.clearSolutions()
      for (let iCountry of this.countryIndices) {
        let countryModel = this.globalModel.countryModel[iCountry]
        countryModel.initCompartments()
        // countryModel.calcVars()
        // console.log('Home.calculateRiskOfSourceCountry',
        //   this.getNameFromICountry(iCountry),
        //   humanize.intword(countryModel.var.population))
      }
      _.times(this.days, () => {
        this.globalModel.update()
        if (this.globalModel.time === this.globalModel.interventionDay) {
          this.intervention = this.globalModel.makeIntervention(
            this.interventionInputParamEntries)
        }
      })

      if (this.intervention) {
        this.intervention.clearSolutions()
        let interventionDays = this.days - this.globalModel.interventionDay
        _.times(interventionDays, () => {
          this.intervention.update()
        })
      }

      this.chartWidgets.globalPrevalence
        .setTitle('Global Prevalence')
      this.chartWidgets.globalPrevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.globalPrevalence.updateDataset(
        0, this.globalModel.times, this.globalModel.solution.prevalence)
      if (this.intervention) {
        this.chartWidgets.globalPrevalence.updateDataset(
          1, this.intervention.times, this.intervention.solution.prevalence)
      }

      this.chartWidgets.cumulativeIncidence
        .setTitle('Global Cumulative Incidence')
      this.chartWidgets.cumulativeIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      let values = acumulateValues(this.globalModel.solution.incidence)
      this.chartWidgets.cumulativeIncidence.updateDataset(
        0, this.globalModel.times, values)
      if (this.intervention) {
        let startIncidence = values[this.interventionDay]
        let newValues = acumulateValues(this.intervention.solution.incidence)
        newValues = _.map(newValues, v => v + startIncidence)
        this.chartWidgets.cumulativeIncidence.updateDataset(
          1, this.intervention.times, newValues)
      }
    },

    updateWatchCountry () {
      if (this.iWatchCountry < 0) {
        return
      }

      let countryModel = this.globalModel.countryModel[this.iWatchCountry]
      if (_.isUndefined(countryModel)) {
        return
      }
      let solution = countryModel.solution

      let interventionSolution = null
      if (this.intervention) {
        interventionSolution = this.intervention.countryModel[this.iWatchCountry].solution
      }

      this.chartWidgets.prevalence
        .setTitle('Prevalence')
      this.chartWidgets.prevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.prevalence.updateDataset(
        0, this.globalModel.times, solution.prevalence)
      if (interventionSolution) {
        this.chartWidgets.prevalence.updateDataset(
          1, this.intervention.times, interventionSolution.prevalence)
      }

      this.chartWidgets.susceptible
        .setTitle('Susceptible')
      this.chartWidgets.susceptible
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.susceptible
        .updateDataset(0, this.globalModel.times, solution.susceptible)
      if (interventionSolution) {
        this.chartWidgets.susceptible.updateDataset(
          1, this.intervention.times, interventionSolution.susceptible)
      }

      this.chartWidgets.importIncidence
        .setTitle('Cumulative Import Incidence')
      this.chartWidgets.importIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      let values = acumulateValues(solution.importIncidence)
      this.chartWidgets.importIncidence
        .updateDataset(0, this.globalModel.times, values)
      if (interventionSolution) {
        let startValue = values[this.interventionDay]
        let newValues = acumulateValues(interventionSolution.importIncidence)
        newValues = _.map(newValues, v => v + startValue)
        this.chartWidgets.importIncidence.updateDataset(
          1, this.intervention.times, newValues)
      }
    },

    async asyncRecalculateGlobe () {
      let valuesById, maxValue
      if (_.startsWith(this.mode, 'risk')) {
        while (this.isRunning) {
          await util.delay(100)
        }
        this.isRunning = true
        this.calculateRiskOfSourceCountry()
        valuesById = this.getPrevalenceByCountryId()
        valuesById[this.getSourceCountryId()] = 0
        maxValue = this.maxPrevalence
        this.isRunning = false
        this.updateWatchCountry()
      } else {
        valuesById = this.getTravelValuesByCountryId()
      }
      for (let [id, value] of _.toPairs(valuesById)) {
        this.globe.setCountryValue(id, value)
      }
      this.globe.setCountryValue(this.getSourceCountryId(), 0)
      let modeColors = {
        'destination': '#02386F',
        'risk': '#f0f'
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode], maxValue)
      this.globe.setCountryColor(this.getSourceCountryId(), '#f00')
      this.globe.draw()
      this.drawLegend()
    },

    async asyncSelectNewModel () {
      await util.delay(100)
      this.setNewEpiModel()
      this.parameterizeGlobalModelFromInput()
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
      let id = this.travelData.countries[this.iWatchCountry].id
      this.globe.iHighlight = this.globe.iCountryFromId[id]
      this.globe.drawHighlight()
      this.rotateToCountry(this.iWatchCountry)
    },

    selectSourceCountryByCountryId (countryId) {
      let country = _.find(this.selectableCountries, c => c.id === countryId)
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
      await util.delay(100)
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
      let iNewHighlight = this.globe.iCountryFromId[id]
      if (iNewHighlight !== this.globe.iHighlight) {
        this.globe.iHighlight = iNewHighlight
        this.globe.drawHighlight()
        this.updateWatchCountry()
      }

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
            let prevalence = this.globalModel.countryModel[iCountry].compartment.prevalence.toFixed(2)
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
