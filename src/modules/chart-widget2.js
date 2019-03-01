import $ from 'jquery'
import _ from 'lodash'
import Chart from 'chart.js'

/**
 * Functions to generate chartJs data for model
 */

function makeLineChartData (title, xAxisLabel, yAxisLabel) {
  return {
    type: 'line',
    data: {
      datasets: []
    },
    options: {
      title: {
        display: true,
        text: title
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          filter: function (legend) {
            if (!_.isNil(legend.lineDash)) {
              return false
            }
            return true
          }
        }
      },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        xAxes: [
          {
            display: true,
            type: 'linear',
            position: 'bottom',
            scaleLabel: {
              display: true,
              labelString: xAxisLabel
            },
            ticks: {}
          }
        ],
        yAxes: [
          {
            display: true,
            type: 'linear',
            scaleLabel: {
              display: true,
              labelString: yAxisLabel
            },
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  }
}

const colors = [
  '#4ABDAC', // fresh
  '#FC4A1A', // vermilion
  '#F78733', // sunshine
  '#037584', // starry night
  '#007849', // iris
  '#FAA43A', // orange
  '#60BD68', // green
  '#F17CB0', // pink
  '#B2912F', // brown
  '#B276B2', // purple
  '#DECF3F', // yellow
  '#F15854', // red
  '#C08283', // pale gold
  '#dcd0c0', // silk
  '#E37222' // tangerine
]

let seenNames = []

function getColor (name) {
  let i = seenNames.indexOf(name)
  if (i < 0) {
    seenNames.push(name)
    i = seenNames.length - 1
  }
  return colors[i % colors.length]
}

/**
 * ChartsContainer contains several charts
 * the datasets are accessed by this.getDataset(iChart)
 *
 */
class ChartWidget {
  constructor (divTag, chartData) {
    this.divTag = divTag
    this.div = $(this.divTag)
    let canvas = $('<canvas>')
    this.div.append(canvas)
    if (!chartData) {
      this.chartData = makeLineChartData()
    } else {
      this.chartData = chartData
    }
    this.chart = new Chart(canvas, this.chartData)
    this.defaultColors = colors
  }

  getDatasets () {
    return this.chartData.data.datasets
  }

  getChartOptions () {
    return this.chartData.options
  }

  addDataset (key, xValues, yValues, color = null, isDash = false) {
    let datasets = this.getDatasets()
    let newDatasetData = []
    if (xValues && yValues) {
      for (let i = 0; i < xValues.length; i += 1) {
        newDatasetData.push({
          x: xValues[i],
          y: yValues[i]
        })
      }
    }
    let iDataset = datasets.length
    if (_.isNil(color)) {
      color = getColor(iDataset)
    }
    let newDataset = {
      label: key,
      data: newDatasetData,
      fill: false,
      backgroundColor: color,
      borderColor: color,
      showLine: true,
      pointRadius: 0,
      borderWidth: 2
    }
    if (isDash) {
      newDataset.borderDash = [10, 5]
    }
    datasets.push(newDataset)
    this.chart.update()
    return iDataset
  }

  updateDataset (iDataset, xValues, yValues) {
    let data = []
    for (let i = 0; i < xValues.length; i += 1) {
      data.push({
        x: xValues[i],
        y: yValues[i]
      })
    }
    let dataset = this.getDatasets()[iDataset]
    dataset.data = data
    this.chart.update()
  }

  updateDatasetByKey (key, xValues, yValues) {
    let data = []
    for (let i = 0; i < xValues.length; i += 1) {
      data.push({
        x: xValues[i],
        y: yValues[i]
      })
    }
    let dataset = _.find(this.chartData.data.datasets, d => d.label === key)
    dataset.data = data
    this.chart.update()
  }

  setTitle (title) {
    let options = this.getChartOptions()
    options.title.text = title
  }

  setXLabel (xLabel) {
    let options = this.getChartOptions()
    options.scales.xAxes[0].scaleLabel.labelString = xLabel
  }

  setYLabel (yLabel) {
    let options = this.getChartOptions()
    options.scales.yAxes[0].scaleLabel.labelString = yLabel
  }

  setXMax (maxVal) {
    let options = this.getChartOptions()
    options.scales.xAxes[0].ticks.max = maxVal
  }

  setYMax (maxVal) {
    let options = this.getChartOptions()
    options.scales.yAxes[0].ticks.max = maxVal
  }
}

export default ChartWidget
