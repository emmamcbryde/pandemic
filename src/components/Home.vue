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

          <h3 class="md-title">
            Source Country
            <div
              style="
                display: inline;
                height: 1em;
                color: red">
              &block;
            </div>
          </h3>

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

          </md-layout>

          <h3 class="md-title">
            Map Mode
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

          <h3 class="md-title">
            Risk Factor
            <div
              style="
                display: inline;
                height: 1em;
                color: #f0f">
              &block;
            </div>
          </h3>

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

            <h3
              class="md-title"
              v-show="mode === 'risk'">
              Watch Country
              <div
                style="
                display: inline;
                height: 1em;
                color: green">
                &block;
              </div>
            </h3>

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

function clearDict (aDict) {
  for (let key of _.keys(aDict)) {
    delete aDict[key]
  }
}

function copyArray (dest, source) {
  dest.length = 0
  for (let v of source) {
    dest.push(v)
  }
}

class GlobalModel {
  constructor (isIntervention) {
    this.countryIndices = []

    this.isIntervention = !!isIntervention
    console.log('GlobalModel.constructor isIntervention', this.isIntervention)

    this.countryModel = {}

    this.vars = {
      incidence: 0,
      prevalence: 0
    }

    this.solution = {
      incidence: [],
      prevalence: []
    }

    this.getTravelPerDay = null

    this.startTime = 0
    this.time = 0
    this.times = []

    this.interventionDay = null
    this.intervention = null
  }

  setCountryModel (countryIndices, ModelClass, sourceCountryName) {
    this.countryIndices = countryIndices
    clearDict(this.countryModel)
    for (let iCountry of this.countryIndices) {
      this.countryModel[iCountry] = new ModelClass(sourceCountryName)
    }
  }

  getInputParamEntries () {
    if (_.keys(this.countryModel).length > 0) {
      let result = this.countryModel[0].getInputParamEntries()
      if (!this.isIntervention) {
        let intervention = _.find(result, e => e.key === 'interventionDay')
        if (intervention) {
          console.log('GlobalModel.getInputParamEntries set intervention day', intervention.value)
          this.interventionDay = intervention.value
        }
      }
      return result
    } else {
      return []
    }
  }

  makeIntervention () {
    this.intervention = new this.constructor(true)
    this.intervention.startTime = this.time
    this.intervention.getTravelPerDay = this.getTravelPerDay
    this.intervention.countryIndices = _.clone(this.countryIndices)
    for (let i of this.countryIndices) {
      this.intervention.countryModel[i] = _.cloneDeep(this.countryModel[i])
      this.intervention.countryModel[i].applyIntervention()
    }
    console.log('GlobalModel.makeIntervention', this, this.intervention)
  }

  transferPeople () {
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
  }

  run (nDay) {
    this.solution.incidence.length = 0
    this.solution.prevalence.length = 0

    this.times = []
    this.time = this.startTime
    let dTimeInDay = 1

    for (let iDay of _.range(nDay)) {
      this.time += dTimeInDay
      this.times.push(this.time)

      for (let countryModel of _.values(this.countryModel)) {
        countryModel.clearDelta()
        countryModel.importIncidence = 0
      }

      this.transferPeople()

      this.vars.incidence = 0
      this.vars.prevalence = 0

      for (let countryModel of _.values(this.countryModel)) {
        countryModel.updateCompartment(dTimeInDay)
        countryModel.solution.inputIncidence.push(countryModel.importIncidence)
        this.vars.prevalence += countryModel.compartment.prevalence
        this.vars.incidence += _.last(countryModel.solution.incidence)
      }

      this.solution.incidence.push(this.vars.incidence)
      this.solution.prevalence.push(this.vars.prevalence)

      if (this.time === this.interventionDay) {
        this.makeIntervention()
      }
    }

    if (this.intervention) {
      this.intervention.run(nDay - this.interventionDay)
      console.log('GlobalModel.run intervention times', this.intervention.times)
    }
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

      let ModelClass
      for (let model of models) {
        if (model.name === this.modelType) {
          ModelClass = model.class
        }
      }

      let sourceCountryName = this.getNameFromICountry(this.iSourceCountry)
      this.globalModel.setCountryModel(this.countryIndices, ModelClass, sourceCountryName)
      copyArray(this.inputParamEntries, this.globalModel.getInputParamEntries())

      for (let paramEntry of this.inputParamEntries) {
        if (paramEntry.key in oldInputParams) {
          paramEntry.value = oldInputParams[paramEntry.key]
        }
      }
    },

    parameterizeGlobalModelFromInput () {
      for (let param of this.inputParamEntries) {
        param.value = parseFloat(param.value)
      }

      let inputParams = {}
      for (let param of this.inputParamEntries) {
        inputParams[param.key] = param.value
      }

      for (let iCountry of this.countryIndices) {
        let thisInputParams = _.cloneDeep(inputParams)
        thisInputParams.initPopulation = travelData.countries[iCountry].population
        if (this.iSourceCountry !== iCountry) {
          thisInputParams.prevalence = 0
        }
        this.globalModel.countryModel[iCountry].resetParams(thisInputParams)
      }
    },

    calculateRiskOfSourceCountry () {
      this.parameterizeGlobalModelFromInput()

      this.globalModel.run(this.days)

      this.chartWidgets.globalPrevalence
        .setTitle('Global Prevalence')
      this.chartWidgets.globalPrevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.globalPrevalence.updateDataset(
        0, this.globalModel.times, this.globalModel.solution.prevalence)
      if (this.globalModel.intervention) {
        this.chartWidgets.globalPrevalence.updateDataset(
          1, this.globalModel.intervention.times, this.globalModel.intervention.solution.prevalence)
      }

      this.chartWidgets.cumulativeIncidence
        .setTitle('Global Cumulative Incidence')
      this.chartWidgets.cumulativeIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.cumulativeIncidence.updateDataset(
        0, this.globalModel.times, acumulateValues(this.globalModel.solution.incidence))
      if (this.globalModel.intervention) {
        this.chartWidgets.cumulativeIncidence.updateDataset(
          1, this.globalModel.intervention.times, acumulateValues(this.globalModel.intervention.solution.incidence))
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
      if (this.globalModel.intervention) {
        interventionSolution = this.globalModel.intervention.countryModel[this.iWatchCountry].solution
      }

      console.log('updateWatchCountry intervention', interventionSolution)

      this.chartWidgets.prevalence
        .setTitle('Prevalence')
      this.chartWidgets.prevalence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.prevalence.updateDataset(
        0, this.globalModel.times, solution.prevalence)
      if (interventionSolution) {
        this.chartWidgets.prevalence.updateDataset(
          1, this.globalModel.intervention.times, interventionSolution.prevalence)
      }

      this.chartWidgets.susceptible
        .setTitle('Susceptible')
      this.chartWidgets.susceptible
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.susceptible
        .updateDataset(0, this.globalModel.times, solution.susceptible)
      if (interventionSolution) {
        this.chartWidgets.susceptible.updateDataset(
          1, this.globalModel.intervention.times, interventionSolution.susceptible)
      }

      this.chartWidgets.importIncidence
        .setTitle('Cumulative Import Incidence')
      this.chartWidgets.importIncidence
        .getChartOptions().scales.xAxes[0].ticks.max = this.getMaxDays
      this.chartWidgets.importIncidence
        .updateDataset(0, this.globalModel.times, acumulateValues(solution.inputIncidence))
      if (interventionSolution) {
        this.chartWidgets.importIncidence.updateDataset(
          1, this.globalModel.intervention.times, interventionSolution.inputIncidence)
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
