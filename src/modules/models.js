import _ from 'lodash'
import util from '../modules/util'

console.log('models init', util.jstr(util))

class BaseModel {
  constructor (id) {
    this.id = id

    this.modelType = 'BASE'
    this.compartment = {}
    this.keys = []

    this.var = {}
    this.events = []
    this.varEvents = []
    this.paramEvents = []
    this.flow = {}
    this.delta = {}
    this.params = {}

    this.solution = { prevalence: [] }
  }

  init () {}

  getInputParamEntries () {
    return _.cloneDeep(this.inputParamEntries)
  }

  resetParams (inputParams) {
    this.params = _.cloneDeep(this.defaultParams)
    _.assign(this.params, inputParams)
    for (let key of _.keys(inputParams)) {
      if (inputParams[key] !== this.params[key]) {
        console.log(
          `${this.modelType}-model.resetParams `,
          this.id, 'error', inputParams[key], this.params[key])
      }
    }
    this.init()
    this.calcVar()
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcFlow () {
    this.events.length = 0
    for (let [from, to, varKey] of this.varEvents) {
      let val = this.var[varKey] * this.compartment[from]
      this.events.push([from, to, val])
    }
    for (let [from, to, paramKey] of this.paramEvents) {
      let val = this.params[paramKey] * this.compartment[from]
      this.events.push([from, to, val])
    }
  }

  updateCompartment (dTime) {
    this.calcVar()

    this.calcFlow()

    for (let key of this.keys) {
      this.flow[key] = 0
    }

    for (let [from, to, val] of this.events) {
      this.flow[from] -= val
      this.flow[to] += val
    }

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
}

class SisModel extends BaseModel {
  constructor (id) {
    super(id)

    this.modelType = 'SIS'

    this.compartment = {
      prevalence: 0,
      susceptible: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      incubationPeriod: 10,
      infectiousPeriod: 10,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(
      ['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(
      ['prevalence', 'susceptible', 'recoverRate'])

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 10,
        placeHolder: '',
        label: 'Incubation Period'
      },
      {
        key: 'infectiousPeriod',
        value: 10,
        placeHolder: '',
        label: 'Infectious Period'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  init () {
    this.keys = _.keys(this.compartment)
    this.keys.sort()

    this.params.period =
      this.params.infectiousPeriod +
      this.params.incubationPeriod
    this.params.recoverRate =
      1 / (this.params.period)
    this.params.contactRate =
      this.params.reproductionNumber *
      this.params.recoverRate
    this.params.probSickCanTravel = 1

    for (let key of this.keys) {
      this.compartment[key] = 0
    }

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence

    this.solution.prevalence.length = 0
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
        this.var.population *
          this.compartment.prevalence
  }

  getExitPrevalence (travelPerDay) {
    this.calcVar()
    let probTravelPerDay = travelPerDay / this.var.population
    let probSickTravelPerDay =
      this.params.probSickCanTravel * probTravelPerDay
    return this.compartment.prevalence * probSickTravelPerDay
  }
}

class SirModel extends BaseModel {
  constructor (id) {
    super(id)

    this.modelType = 'SIR'

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      recovered: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      incubationPeriod: 10,
      infectiousPeriod: 10,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.params = _.cloneDeep(this.defaultParams)

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 10,
        placeHolder: '',
        label: 'Incubation Period'
      },
      {
        key: 'infectiousPeriod',
        value: 10,
        placeHolder: '',
        label: 'Infectious Period'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  init () {
    this.keys = _.keys(this.compartment)
    this.keys.sort()

    this.params.period =
      this.params.infectiousPeriod +
      this.params.incubationPeriod
    this.params.recoverRate =
      1 / (this.params.period)
    this.params.contactRate =
      this.params.reproductionNumber *
      this.params.recoverRate
    this.params.probSickCanTravel = 1

    for (let key of this.keys) {
      this.compartment[key] = 0
    }

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence

    this.solution.prevalence.length = 0
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
  }

  getExitPrevalence (travelPerDay) {
    this.calcVar()
    let probTravelPerDay = travelPerDay / this.var.population
    let probSickTravelPerDay =
      this.params.probSickCanTravel * probTravelPerDay
    return this.compartment.prevalence * probSickTravelPerDay
  }
}

let models = [
  {
    class: SisModel,
    name: 'SIS'
  },
  {
    class: SirModel,
    name: 'SIR'
  }
]

export { models }