<template>

  <md-layout
    md-row
    style="
      height: calc(100vh - 48px);
      width: calc(100vw);">

    <div
      style="
        height: calc(100vh - 48px);
        width: 50%">

      <div
        style="
          overflow-y: scroll;
          height: calc(100vh - 48px);
          padding: 1em;">

        <md-layout md-column>

          <md-card style="padding: 1em">

            <h3 class="md-title">Model Parameters</h3>

            <md-layout 
              md-row 
              md-vertical-align="center">

              <md-input-container
                style="margin-right: 1em;">
                <label>
                  Model
                </label>
                <md-select
                  id="modelType"
                  v-model="modelType"
                  style="width: 400px"
                  name="modelType">
                  <md-option
                    v-for="(modelType, i) in modelTypes"
                    :value="modelType"
                    :key="i"
                    @selected="asyncSelectNewModel">
                    {{ modelType }}
                  </md-option>
                </md-select>
              </md-input-container>

            </md-layout>

            <md-layout
              md-row
              md-vertical-align="center">

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
                  id="country"
                  v-model="iSourceCountry"
                  name="country">
                  <md-option
                    v-for="(country, i) in selectableCountries"
                    :value="country.iCountry"
                    :key="i"
                    @selected="asyncSelectSourceCountry()">
                    {{ country.name }}
                  </md-option>
                </md-select>
              </md-input-container>

              <md-input-container
                v-for="(entry, i) in guiParams"
                :key="i"
                style="
                    margin-right: 1em;">
                <label>{{ entry.label }}</label>
                <md-input
                  v-model="entry.value"
                  :step="entry.step"
                  type="number"
                  min="0"
                  @change="asyncCalculateRisk"/>
              </md-input-container>

            </md-layout>

          </md-card>

          <md-card
            v-if="interventionParams.length > 0"
            style="padding: 1em; margin-top: 1em">

            <h3 class="md-title">Intervention Parameters</h3>

            <md-layout
              md-row
              md-vertical-align="center">

              <md-radio
                v-model="interventionMode"
                style="margin-right: 1em"
                md-value="all-countries"
                @change="asyncCalculateRisk">
                All Countries
              </md-radio>

              <md-radio
                v-model="interventionMode"
                style="margin-right: 1em"
                md-value="source-country-only"
                @change="asyncCalculateRisk">
                Source Country Only
              </md-radio>

            </md-layout>

            <md-layout
              md-row
              md-vertical-align="center">

              <md-input-container
                v-for="(entry, i) in interventionParams"
                :key="i"
                style="
                  margin-right: 1em;">
                <label>{{ entry.label }}</label>
                <md-input
                  v-model="entry.value"
                  :step="entry.step"
                  type="number"
                  min="0"
                  @change="asyncCalculateRisk"/>
              </md-input-container>

            </md-layout>

          </md-card>

          <md-card style="padding: 1em; margin-top: 1em">

            <h3 class="md-title">
              Model the Pandemic over Time
            </h3>

            <md-layout
              md-row
              md-vertical-align="center">

              <md-radio
                v-model="mode"
                md-value="risk"
                @change="asyncSelectMode('risk')">
                <div
                  style="
                    display: inline;
                    height: 1em;
                    color: #f0f">
                  &block;
                </div>
                Show Pandemic Prediction
              </md-radio>

              <span style="width:1em"/>

              <md-radio
                v-model="mode"
                md-value="destination"
                @change="asyncSelectMode('destination')">
                <div
                  style="
                    display: inline;
                    height: 1em;
                    color: #02386F">
                  &block;
                </div>
                Show Travel Data Only
              </md-radio>

            </md-layout>

            <md-layout
              md-row
              md-vertical-align="center">

              Animate &nbsp;
              <md-switch
                v-model="isLoop"
                @change="toggleLoop"/>

              {{ days }} Day

              <div 
                style="
                      flex: 1;
                      margin-left: 0.5em;">
                <vue-slider
                  ref="slider"
                  :interval="1"
                  :min="1"
                  :max="getMaxDays"
                  v-model="days"
                  tooltip="none"
                  @callback="asyncCalculateRisk()"/>
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

            </md-layout>

          </md-card>

          <md-card
            style="padding: 1em; margin-top: 1em">

            <h3 class="md-title">
              Global Pandemic Predictions
            </h3>

            <div>
              <div
                style="
                  display: inline;
                  height: 1em;
                  color: #4ABDAC">
                &block;
              </div>
              model
              &nbsp;
              <div
                style="
                  display: inline;
                  height: 1em;
                  color: #FC4A1A">
                &block;
              </div>
              intervention
            </div>

            <div
              v-show="mode === 'risk'"
              style="width: 100%">
              <md-layout id="globalCharts"/>
            </div>

          </md-card>

          <md-card
            style="padding: 1em; margin-top: 1em">

            <h3 class="md-title">
              Watch Country Pandemic Predictions
            </h3>

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
                  id="country"
                  v-model="iWatchCountry"
                  name="country">
                  <md-option
                    v-for="(country, i) in selectableCountries"
                    :value="country.iCountry"
                    :key="i"
                    @selected="asyncSelectWatchCountry()">
                    {{ country.name }}
                  </md-option>
                </md-select>
              </md-input-container>
            </md-layout>

            <div>
              <div
                style="
                  display: inline;
                  height: 1em;
                  color: #4ABDAC">
                &block;
              </div>
              model
              &nbsp;
              <div
                style="
                  display: inline;
                  height: 1em;
                  color: #FC4A1A">
                &block;
              </div>
              intervention
            </div>

            <md-layout
              v-show="mode === 'risk'"
              id="localCharts"/>

          </md-card>

        </md-layout>
      </div>
    </div>

    <div
      style="
        height: calc(100vh - 48px);
        flex: 1;
        border-left: 1px solid #CCC;
        overflow: hidden;
        padding: 1em;
        ">

      <md-card
        style="
          height: calc(100vh - 48px - 2em);
          padding: 0.5em;">

        <md-layout
          md-column
          md-align="start"
          style="
            height: 100%;
            box-sizing: border-box
            padding: 0 15px;">

          <div>
            <h2
              class="md-title"
              style="margin-right: 2em;">
              {{ title }}
            </h2>

          </div>

          <md-layout
            id="main"
            style="
              background-color: white;
              width: 100%"/>

          <md-input-container
            v-if="mode === 'risk'"
            style="width: 130px;">
            <label>Saturation Prevalence</label>
            <md-input
              v-model="maxPrevalence"
              type="number"
              @change="asyncCalculateRisk()"/>
          </md-input-container>

        </md-layout>

      </md-card>

    </div>

  </md-layout>

</template>

<style>
html,
body {
  overflow: hidden;
  position: fixed;
}

.countryTooltip {
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
  height: 200px;
  margin-bottom: 1.5em;
}
</style>

<script>
import _ from 'lodash'
import $ from 'jquery'
import numeral from 'numeral'

import vueSlider from 'vue-slider-component'

import util from '../modules/util'
import { Globe } from '../modules/globe'
import { models } from '../modules/models'
import ChartWidget from '../modules/chart-widget'
import { GlobalModel } from '../modules/global-model'

const flightData = require('../data/flight-data')
const adjacentData = require('../data/adjacent-data')

function waitForElement(selector) {
  return new Promise(resolve => {
    function loop() {
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

function acumulateValues(vals) {
  let result = []
  for (let i of _.range(vals.length)) {
    let val = _.sum(vals.slice(0, i + 1))
    result.push(val)
  }
  return result
}

function convertLabel(val) {
  val = parseFloat(val)
  if (val > 1) {
    return numeral(val).format('0a')
  }
  if (val === 0) {
    return '0'
  } else {
    return numeral(val).format('0.0[000000]')
  }
}

function copyArray(dest, source) {
  dest.length = 0
  for (let v of source) {
    dest.push(v)
  }
}

function formatInt(i) {
  if (i < 1) {
    return '< 1'
  } else {
    return i.toFixed(0)
  }
}

export default {
  id: 'home',

  components: { vueSlider },

  /**
   * There are three indexes
   * - country ID
   * - iCountry based on countries
   * - and an index based on the world.json files
   *
   * It's important to keep these distinguished with
   * the correct variable names.
   */

  data() {
    let modelTypes = _.map(models, 'name')
    return {
      selectableCountries: [],
      iSourceCountry: -1,
      iWatchCountry: -1,
      mode: 'risk', // or 'destination'
      days: 15,
      maxDays: 60,
      maxPrevalence: 20,
      title: '',
      interventionMode: 'all-countries', // 'source-country-only'
      guiParams: [],
      interventionParams: [],
      isLoop: false,
      modelType: modelTypes[0],
      modelTypes: modelTypes
    }
  },

  computed: {
    /**
     * Needed as md-input corrupts this.maxDays into string
     * @returns {number}
     */
    getMaxDays() {
      return parseFloat(this.maxDays)
    }
  },

  async mounted() {
    this.isRunning = true

    this.$element = $('#main')
    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.globe = new Globe('#main')
    this.globe.getCountryPopupHtml = this.getCountryPopupHtml
    this.globe.dblclickCountry = this.selectSourceCountryByCountryId
    this.globe.clickCountry = this.selectWatchCountry

    this.mode = 'risk' // 'destination' or 'risk'

    this.flightData = flightData
    this.flightData.countries[177].population = 39000000
    // data is for Feb, 2015
    // Resultant data written to data_js_fname: {
    //   'travel': [
    //     # i'th country
    //     [
    //       ['AUS', 33, 444],...
    //     ],...
    //   ],
    //   'countries': {
    //     'name': 'Australia',
    //     'iso_n3': '781',
    //     'iso_a3': 'AUS
    //   }
    // }

    let countries = []
    let nCountry = this.flightData.countries.length
    for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
      let id = flightData.countries[iCountry].iso_n3
      let properties = this.globe.getPropertiesFromId(id)
      if (!_.isNil(properties)) {
        let entry = { iCountry }
        entry.iso_n3 = properties.iso_n3
        entry.iso_a3 = properties.iso_a3
        entry.name = properties.name
        entry.population = parseInt(properties.pop_est)
        // console.log('Home.constructor', entry)
        countries.push(entry)
      }
    }
    this.selectableCountries = _.sortBy(countries, a => a.name)

    this.iSourceCountry = 0

    this.countryIndices = _.map(countries, 'iCountry')

    function getICountryFromId(id) {
      for (let country of countries) {
        if (id === country.iso_n3) {
          return country.iCountry
        }
      }
      return null
    }

    this.adjacentData = adjacentData
    this.adjacent = {}
    // To produce this structure {
    //   country_iso: [country_iso, ...],
    //   ...
    // }
    for (let entry of this.adjacentData.neighbours) {
      let iCountry = getICountryFromId(entry.country)
      if (_.isNil(iCountry)) {
        continue
      }
      this.adjacent[iCountry] = _.reject(
        _.map(entry.neighbours, getICountryFromId),
        _.isNil
      )
    }

    // The structure is [
    //   // iFromCountry
    //   [
    //     // iToCountry
    //     <travelPerDay>,...
    //   ],...
    // ]

    this.travel = Array(nCountry)
    for (let iCountryFrom of _.range(nCountry)) {
      this.travel[iCountryFrom] = _.fill(Array(nCountry), 0)
      for (let iCountryTo of this.countryIndices) {
        this.travel[iCountryFrom][iCountryTo] =
          this.flightData.travel[iCountryFrom][iCountryTo][1] / 28
      }

      // hack to simulate land neighbors
      let maxFlightTravel = _.max(this.travel[iCountryFrom])
      let id = this.flightData.countries[iCountryFrom].iso_n3
      let features = this.globe.getPropertiesFromId(id)
      if (_.isNil(features)) {
        continue
      }
      let travelPerCapita = maxFlightTravel / features.pop_est
      let landNeighbors = this.adjacent[iCountryFrom]
      if (_.isNil(landNeighbors)) {
        continue
      }
      for (let iCountryTo of landNeighbors) {
        id = this.flightData.countries[iCountryTo].iso_n3
        features = this.globe.getPropertiesFromId(id)
        if (_.isNil(features)) {
          continue
        }
        this.travel[iCountryFrom][iCountryTo] +=
          travelPerCapita * features.pop_est
      }
    }

    this.globalModel = new GlobalModel()
    this.globalModel.getTravelPerDay = this.getTravelPerDay

    this.setNewEpiModel()

    this.chartWidgets = {}
    await this.asyncMakeChartWidget('#globalCharts', 'globalPrevalence')
    await this.asyncMakeChartWidget('#globalCharts', 'cumulativeIncidence')
    await this.asyncMakeChartWidget('#localCharts', 'prevalence')
    await this.asyncMakeChartWidget('#localCharts', 'importIncidence')

    window.dispatchEvent(new Event('resize'))

    await this.asyncSelectRandomSourceCountry()

    this.loopTimeStepMs = 2000

    setInterval(this.loop, this.loopTimeStepMs)

    this.isRunning = false

    this.globe.resize()
  },

  methods: {
    async asyncMakeChartWidget(parentSelector, id) {
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

    getSourceCountryId() {
      return this.flightData.countries[this.iSourceCountry].iso_n3
    },

    getICountry(countryId) {
      for (let i in _.range(this.flightData.countries.length)) {
        if (this.flightData.countries[i].iso_n3 === countryId) {
          return i
        }
      }
      return null
    },

    getNameFromICountry(iCountry) {
      if (!_.isNil(this.flightData)) {
        let id = this.flightData.countries[iCountry].iso_n3
        return this.globe.getPropertiesFromId(id).admin
      } else {
        return ''
      }
    },

    getPrevalenceByCountryId() {
      let result = {}
      for (let iCountry of this.countryIndices) {
        let id = this.flightData.countries[iCountry].iso_n3
        let countryModel = this.globalModel.countryModel[iCountry]
        result[id] = countryModel.compartment.prevalence
      }
      return result
    },

    resize() {
      let position = this.$element.position()
      this.$element.height(window.innerHeight - position.top)
      if (this.globe) {
        this.globe.resize()
      }
    },

    getTravelPerDay(iCountryFrom, iCountryTo) {
      return this.travel[iCountryFrom][iCountryTo]
    },

    getTravelValuesByCountryId() {
      let values = {}
      let nCountry = this.flightData.countries.length
      for (let jCountry = 0; jCountry < nCountry; jCountry += 1) {
        let value
        value = this.getTravelPerDay(this.iSourceCountry, jCountry)
        let id = this.flightData.countries[jCountry].iso_n3
        values[id] = value
      }
      return values
    },

    setNewEpiModel() {
      let oldInputParams = {}
      for (let paramEntry of this.guiParams) {
        oldInputParams[paramEntry.key] = paramEntry.value
      }

      let oldInterventionInputParams = {}
      for (let paramEntry of this.interventionParams) {
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
        this.countryIndices,
        ModelClass,
        sourceCountryName
      )
      copyArray(this.guiParams, this.globalModel.getGuiParams())
      copyArray(
        this.interventionParams,
        this.globalModel.getInterventionParams()
      )

      for (let paramEntry of this.guiParams) {
        if (paramEntry.key in oldInputParams) {
          paramEntry.value = oldInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
      }

      for (let paramEntry of this.interventionParams) {
        if (paramEntry.key in oldInterventionInputParams) {
          paramEntry.value = oldInterventionInputParams[paramEntry.key]
        }
        if (paramEntry.step === 0.01) {
          paramEntry.value = parseFloat(paramEntry.value).toFixed(2)
        }
      }
    },

    parameterizeGlobalModelFromInput() {
      for (let iCountry of this.countryIndices) {
        let countryModel = this.globalModel.countryModel[iCountry]
        countryModel.importGuiParams(this.guiParams)
        let id = this.flightData.countries[iCountry].iso_n3
        countryModel.param.initPopulation = this.globe.getPropertiesFromId(
          id
        ).pop_est
        if (this.iSourceCountry !== iCountry) {
          countryModel.param.initPrevalence = 0
        }
      }

      this.intervention = null
      this.globalModel.interventionDay = null
      let entry = _.find(
        this.interventionParams,
        e => e.key === 'interventionDay'
      )
      if (entry) {
        this.globalModel.interventionDay = parseInt(entry.value)
      }
    },

    calculateRiskOfSourceCountry() {
      this.parameterizeGlobalModelFromInput()

      this.globalModel.clearSolutions()
      for (let iCountry of this.countryIndices) {
        let countryModel = this.globalModel.countryModel[iCountry]
        countryModel.initCompartments()
      }

      _.times(this.days, () => {
        this.globalModel.update()
        if (this.globalModel.time === this.globalModel.interventionDay) {
          if (this.interventionMode === 'all-countries') {
            this.intervention = this.globalModel.makeIntervention(
              this.interventionParams
            )
          } else if (this.interventionMode === 'source-country-only') {
            this.intervention = this.globalModel.makeSingleCountryIntervention(
              this.interventionParams,
              this.iSourceCountry
            )
          }
        }
      })

      if (this.intervention) {
        this.intervention.clearSolutions()
        let interventionDays = this.days - this.globalModel.interventionDay
        _.times(interventionDays, () => {
          this.intervention.update()
        })
      }

      // clear intervention graphs
      for (let chart of _.values(this.chartWidgets)) {
        chart.updateDataset(1, [], [])
      }

      this.chartWidgets.globalPrevalence.setTitle(
        'Global Number of Active Infections'
      )
      this.chartWidgets.globalPrevalence.setXLabel('Time (days)')
      this.chartWidgets.globalPrevalence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.globalPrevalence.updateDataset(
        0,
        this.globalModel.times,
        this.globalModel.solution.prevalence
      )
      if (this.intervention) {
        this.chartWidgets.globalPrevalence.updateDataset(
          1,
          this.intervention.times,
          this.intervention.solution.prevalence
        )
      }

      this.chartWidgets.cumulativeIncidence.setTitle(
        'Global Cumulative Incidence'
      )
      this.chartWidgets.cumulativeIncidence.setXLabel('Time (days)')
      this.chartWidgets.cumulativeIncidence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.globalModel.solution.cumulativeIncidence = acumulateValues(
        this.globalModel.solution.incidence
      )
      this.chartWidgets.cumulativeIncidence.updateDataset(
        0,
        this.globalModel.times,
        this.globalModel.solution.cumulativeIncidence
      )
      if (this.intervention) {
        let startIncidence = this.globalModel.solution.cumulativeIncidence[
          this.globalModel.interventionDay
        ]
        let newValues = acumulateValues(this.intervention.solution.incidence)
        newValues = _.map(newValues, v => v + startIncidence)
        this.chartWidgets.cumulativeIncidence.updateDataset(
          1,
          this.intervention.times,
          newValues
        )
      }
    },

    updateWatchCountry() {
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
        interventionSolution = this.intervention.countryModel[
          this.iWatchCountry
        ].solution
      }

      this.chartWidgets.prevalence.setTitle('Number of Active Infections')
      this.chartWidgets.prevalence.setXLabel('Time (days)')
      this.chartWidgets.prevalence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.prevalence.updateDataset(
        0,
        this.globalModel.times,
        solution.prevalence
      )
      if (interventionSolution) {
        this.chartWidgets.prevalence.updateDataset(
          1,
          this.intervention.times,
          interventionSolution.prevalence
        )
      }

      this.chartWidgets.importIncidence.setTitle('Cumulative Import Incidence')
      this.chartWidgets.importIncidence.setXLabel('Time (days)')
      this.chartWidgets.importIncidence.getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      solution.cumulativeImportIncidence = acumulateValues(
        solution.importIncidence
      )
      this.chartWidgets.importIncidence.updateDataset(
        0,
        this.globalModel.times,
        solution.cumulativeImportIncidence
      )
      if (interventionSolution) {
        let startValue =
          solution.cumulativeImportIncidence[this.globalModel.interventionDay]
        let newValues = acumulateValues(interventionSolution.importIncidence)
        newValues = _.map(newValues, v => v + startValue)
        this.chartWidgets.importIncidence.updateDataset(
          1,
          this.intervention.times,
          newValues
        )
      }
    },

    async asyncRecalculateGlobe() {
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
        let i = this.globe.iCountryFromId[id]
        this.globe.values[i] = value
      }
      let i = this.globe.iCountryFromId[this.getSourceCountryId()]
      this.globe.values[i] = 0
      let modeColors = {
        destination: '#02386F',
        risk: '#f0f'
      }
      this.globe.resetCountryColorsFromValues(modeColors[this.mode], maxValue)
      this.globe.colors[i] = '#f00'
      this.globe.draw()
      this.drawLegend()
    },

    async asyncSelectNewModel() {
      await util.delay(100)
      this.setNewEpiModel()
      this.parameterizeGlobalModelFromInput()
      await this.asyncRecalculateGlobe()
    },

    rotateToCountry(iCountry) {
      let country = this.flightData.countries[iCountry]
      let i = this.globe.iCountryFromId[country.iso_n3]
      this.globe.rotateTransitionToICountry(i)
    },

    async asyncSelectSourceCountry() {
      let title = ''
      if (this.mode == 'risk') {
        title += 'Global Pandemic originating in '
        title += this.getNameFromICountry(this.iSourceCountry)
        title += ' after ' + this.days + ' days'
      } else {
        title += 'People travelling from '
        title += this.getNameFromICountry(this.iSourceCountry)
      }
      this.title = title

      // title needs to be given some time to reset the size
      // of the globe div below it before redrawing
      await util.delay(100)
      this.asyncRecalculateGlobe()
      this.rotateToCountry(this.iSourceCountry)
    },

    selectWatchCountry(i) {
      let id = this.globe.features[i].properties.iso_n3
      this.iWatchCountry = parseInt(this.getICountry(id))
      console.log('Home.selectWatchCountry', i, id)
      let iNewHighlight = this.globe.iCountryFromId[id]
      if (iNewHighlight !== this.globe.iHighlightCountry) {
        this.globe.iHighlightCountry = iNewHighlight
        this.globe.drawHighlight()
        this.updateWatchCountry()
      }
    },

    async asyncSelectWatchCountry() {
      await util.delay(100)
      console.log('> Home.asyncSelectWatchCountry', this.iWatchCountry)
      this.updateWatchCountry()
      let id = this.flightData.countries[this.iWatchCountry].iso_n3
      this.globe.iHighlightCountry = this.globe.iCountryFromId[id]
      this.globe.drawHighlight()
      this.rotateToCountry(this.iWatchCountry)
    },

    selectSourceCountryByCountryId(i) {
      let countryId = this.globe.features[i].properties.iso_n3
      let country = _.find(
        this.selectableCountries,
        c => c.iso_n3 === countryId
      )
      if (!_.isNil(country)) {
        this.iSourceCountry = country.iCountry
        this.asyncSelectSourceCountry()
      }
    },

    async asyncSelectRandomSourceCountry() {
      let n = this.selectableCountries.length
      let i = Math.floor(Math.random() * Math.floor(n))
      this.iSourceCountry = this.selectableCountries[i].iCountry
      this.iWatchCountry = this.iSourceCountry
      await this.asyncSelectSourceCountry()
    },

    async asyncSelectMode(mode) {
      await util.delay(100)
      console.log('> Home.asyncSelectMode', mode)
      this.mode = mode
      this.asyncRecalculateGlobe()
    },

    drawLegend() {
      this.globe.drawLegend()
    },

    async asyncCalculateRisk() {
      await util.delay(100)
      this.mode = 'risk'
      await this.asyncRecalculateGlobe()
    },

    loop() {
      if (this.isLoop && _.startsWith(this.mode, 'risk')) {
        if (this.days < this.getMaxDays) {
          this.days += 1
        } else {
          this.days = 1
        }
        this.asyncCalculateRisk()
      }
    },

    toggleLoop(boolValue) {
      this.isLoop = boolValue
      if (this.isLoop) {
        this.mode = 'risk'
      }
    },

    getCountryPopupHtml(i) {
      let feature = this.globe.features[i]
      let id = feature.properties.iso_n3
      let name = feature.properties.name
      let population = feature.properties.pop_est

      let sourceId = this.flightData.countries[this.iSourceCountry].iso_n3
      let s = `<div style="text-align: left">`

      if (this.mode === 'destination') {
        let j = this.globe.iCountryFromId[id]
        if (id === sourceId) {
          s += `Source country of travel: ${name}`
        } else {
          let value = this.globe.values[j]
          if (value === null) {
            s += `(No travel data available for ${name})`
          } else {
            let countryName = this.getNameFromICountry(this.iSourceCountry)
            s += `People travelling from ${countryName}`
            s += `<br>&nbsp; To ${name} (pop: ${population})`
            s += `<br>&nbsp; Average Per Day: ` + formatInt(value)
          }
        }
      }

      if (this.mode === 'risk') {
        let nCountry = this.flightData.countries.length
        let prevalence = null
        let country = null
        let solution = null
        for (let iCountry = 0; iCountry < nCountry; iCountry += 1) {
          let countryId = this.flightData.countries[iCountry].iso_n3
          if (countryId === id) {
            country = this.globalModel.countryModel[iCountry]
            prevalence = country.compartment.prevalence
            solution = country.solution
            break
          }
        }
        if (_.isNil(prevalence)) {
          s += `(No prediction due to lack of travel data)`
        } else {
          s += `Prediction in ${name}`
          if (id === sourceId) {
            s += ` (source)`
          }
          s += `<br> &nbsp; After ${this.days} days`
          s +=
            `<br> &nbsp; Number of Active Infections: ` + formatInt(prevalence)
          let cumulativeImportIncidence = _.last(acumulateValues(solution.importIncidence))
          s += `<br> &nbsp; Cumulative Import incidence: ` + formatInt(cumulativeImportIncidence)
        }
      }

      s += `</div>`
      return s
    }
  }
}
</script>
