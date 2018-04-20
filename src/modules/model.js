import _ from 'lodash'

class SisModel {
  constructor (id) {
    this.id = id

    this.modelType = 'SIS'

    this.compartment = {
      prevalence: 0,
      susceptible: 0
    }

    this.keys = _.keys(this.compartment)

    this.var = {}
    this.events = []
    this.flow = {}
    this.delta = {}
    this.params = {}

    this.defaultParams = {
      initPopulation: 50000,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.inputParamEntries = [
      {
        key: 'period',
        value: 30,
        placeHolder: '',
        label: 'period'
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

    this.reset(this.defaultParams)
  }

  getInputParamEntries () {
    return _.clone(this.inputParamEntries)
  }

  reset (inputParams) {
    _.assign(this.params, inputParams)
    this.init()
  }

  init () {
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

    this.calcVar()
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
  }

  calcFlow () {
    this.events = []

    let d
    d = this.var.rateForce * this.compartment.susceptible
    this.events.push(['susceptible', 'prevalence', d])

    d = this.params.recoverRate * this.compartment.prevalence
    this.events.push(['prevalence', 'susceptible', d])

    for (let key of this.keys) {
      this.flow[key] = 0
    }

    for (let [from, to, val] of this.events) {
      this.flow[from] -= val
      this.flow[to] += val
    }
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

class SirModel {
  constructor (id) {
    this.id = id

    this.modelType = 'SIR'

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      recovered: 0
    }

    this.keys = _.keys(this.compartment)

    this.var = {}

    this.events = []

    this.flow = {}
    this.delta = {}

    this.params = {}

    this.defaultParams = {
      initPopulation: 50000,
      period: 30,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.inputParamEntries = [
      {
        key: 'period',
        value: 30,
        placeHolder: '',
        label: 'period'
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

    this.reset(this.defaultParams)
  }

  getInputParamEntries () {
    return _.clone(this.inputParamEntries)
  }

  reset (inputParams) {
    _.assign(this.params, inputParams)
    this.init()
  }

  init () {
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

    this.calcVar()
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
  }

  calcFlow () {
    this.events = []

    let d
    d = this.var.rateForce * this.compartment.susceptible
    this.events.push(['susceptible', 'prevalence', d])

    d = this.params.recoverRate * this.compartment.prevalence
    this.events.push(['susceptible', 'prevalence', d])

    for (let key of this.keys) {
      this.flow[key] = 0
    }

    for (let [from, to, val] of this.events) {
      this.flow[from] -= val
      this.flow[to] += val
    }
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

export { SirModel, SisModel }
