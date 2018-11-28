<template>
  <div style="padding: 1em">

    <md-layout 
      md-column
      style="
        padding-bottom: 1.5em;
        text-align: left">
      <h1
        class="display-1">
        {{ title }}
      </h1>
      <md-input-container>
        <label>Model Type</label>
        <md-select
          v-model="modelName"
          label="Model Type"
          style="width: 400px"
          @change="changeModel">
          <md-option
            v-for="modelName in modelNames"
            :key="modelName"
            :value="modelName">
            {{ modelName }}
          </md-option>
        </md-select>
      </md-input-container>
    </md-layout>

    <md-layout
      md-row
      md-flex="100"
      md-gutter="50">

      <md-layout
        md-flex="30">
        <md-card
          style="margin-right: 1em; width: 100%">
          <md-card-header >
            <div class="md-title">
              Parameters
            </div>
          </md-card-header>
          <md-card-content>
            <div
              v-for="param of sliders"
              :key="param.label"
              style="
                text-align: left">
              <br>
              <template
                v-if="!param.isReadOnly">
                {{ param.label }} = {{ param.value }}
                <vue-slider
                  v-model="param.value"
                  :min="param.min"
                  :max="param.max"
                  :interval="param.step"
                  tooltip="false"
                  @drag-end="changeGraph()"/>
              </template>
              <template v-else>
                {{ param.label }} = {{ param.getValue() }}
              </template>
            </div>
          </md-card-content>
        </md-card>
      </md-layout>

      <md-layout>
        <md-card
          style="width: 100%; height: 100%">
          <md-card-header >
            <div class="md-title">
              Graphs
            </div>
          </md-card-header>
          <md-card-content>
            <div id="epi-charts"/>
          </md-card-content>
        </md-card>
      </md-layout>

    </md-layout>

  </div>
</template>

<style>
.chart2 {
  width: 100%;
  height: 400px;
  margin-bottom: 1.5em;
}
</style>

<script>
import util from '../modules/util'
import ChartWidget from '../modules/chart-widget2'
import { models } from '../modules/models'
import $ from 'jquery'
import _ from 'lodash'
import vueSlider from 'vue-slider-component'

export default {
  name: 'EpiModel',
  components: { vueSlider },
  data() {
    return {
      title: 'Graphing Models',
      sliders: [],
      modelName: '',
      modelNames: []
    }
  },
  watch: {
    sliders: {
      handler() {
        this.changeGraph()
      },
      deep: true
    }
  },
  async mounted() {
    this.modelNames = _.map(models, e => e.name)
    console.log('EpiModel.mounted', this.modelNames)
    this.modelName = models[2].name
    this.changeModel()
  },
  methods: {
    changeModel() {
      let epiModel = _.find(models, e => e.name === this.modelName)
      this.model = new epiModel.class()
      this.title = 'Basic ' + this.model.modelType + ' Epi Model'
      this.charts = [
        {
          title: 'COMPARTMENTS',
          divTag: 'compartment-chart',
          keys: _.keys(this.model.compartment),
          xlabel: 'time (days)'
        }
      ]

      util.copyArray(this.sliders, this.model.guiParams)
      this.sliders.push({
        key: 'time',
        value: 100,
        step: 1,
        min: 0,
        max: 800,
        placeHolder: '',
        label: 'Time (day)'
      })

      this.graphWidgets = {}
      let $div = $('#epi-charts').empty()
      for (let chart of this.charts) {
        let id = chart.divTag
        $div.append(
          $('<div>')
            .attr('id', id)
            .addClass('chart2')
        )
        let chartWidget = new ChartWidget(`#${id}`)
        chartWidget.setTitle(chart.title)
        chartWidget.setXLabel(chart.xlabel)
        chartWidget.setYLabel('')
        for (let key of chart.keys) {
          chartWidget.addDataset(key)
        }
        this.graphWidgets[chart.divTag] = chartWidget
      }

      this.changeGraph()
    },
    changeGraph() {
      this.model.importGuiParams(this.sliders)
      let time = this.model.param.time
      time = _.last(this.sliders).value
      let nStep = time / 1
      this.model.run(nStep, 1)
      for (let chart of this.charts) {
        for (let [i, key] of chart.keys.entries()) {
          this.graphWidgets[chart.divTag].updateDataset(
            i,
            this.model.times,
            this.model.solution[key]
          )
        }
      }
    }
  }
}
</script>
