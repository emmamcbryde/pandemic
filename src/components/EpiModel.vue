<template>
  <div style="padding: 1em">

    <v-layout
      column>

      <div
        style="padding-top: 1em; padding-bottom: 1em"
        class="display-1">
        {{ title }}
      </div>

      <v-select
        v-model="modelName"
        :items="modelNames"
        label="Model Type"
        solo
        style="width: 550px"
        @change="changeModel"/>

    </v-layout>

    <v-layout
      row>

      <v-flex
        xs4>
        <v-card
          style="margin-right: 1em; padding: 1em">

          <div class="title">
            Parameters
          </div>

          <div
            v-for="param of sliders"
            :key="param.label"
            style="
              text-align: left">
            <br>
            <template
              v-if="!param.isReadOnly">
              {{ param.label }} = {{ param.value }}
              <v-slider
                v-model="param.value"
                :min="param.min"
                :max="param.max"
                :step="param.step"
                style="padding-left: 1em; padding-right: 1em"
                tooltip="false"
                @drag-end="changeGraph()"/>
            </template>
            <div 
              v-else 
              style="padding-bottom: 1.5em;">
              {{ param.label }} = {{ param.getValue() }}
            </div>
          </div>

        </v-card>
      </v-flex>

      <v-flex>
        <v-card
          style="
            height: 100%; overflow: hidden; padding: 1em">
          <div class="title">
            Graphs
          </div>
          <div id="epi-charts"/>
        </v-card>
      </v-flex>

    </v-layout>

  </div>
</template>

<style>
.chart2 {
  max-width: 600px;
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

export default {
  name: 'EpiModel',
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
      this.model = new epiModel.Class()
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
