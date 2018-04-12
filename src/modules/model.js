import _ from 'lodash'

class SirModel {
  constructor (id) {
    this.id = id

    this.modelType = 'SIR'

    this.params = {}

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      recovered: 0
    }

    this.keys = _.keys(this.compartment)

    this.var = {}
    this.flow = {}
    this.delta = {}

    this.defaultInputParams = {
      population: 50000,
      incubationPeriod: 5,
      infectiousPeriod: 30,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 5,
        placeHolder: '',
        label: 'incubation'
      },
      {
        key: 'infectiousPeriod',
        value: 30,
        placeHolder: '',
        label: 'infectious'
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

    this.reset(this.defaultInputParams)
  }

  reset (inputParams) {
    this.params.recoverRate =
      1 /
      (inputParams.incubationPeriod +
        inputParams.infectiousPeriod)
    this.params.contactRate =
      inputParams.reproductionNumber *
      this.params.recoverRate
    this.params.probSickCanTravel =
      inputParams.incubationPeriod /
      (inputParams.incubationPeriod +
        inputParams.infectiousPeriod)

    for (let key of this.keys) {
      this.compartment[key] = 0
    }
    this.compartment.prevalence = inputParams.prevalence
    this.compartment.susceptible =
      inputParams.population - inputParams.prevalence
    this.compartment.recovered = 0

    this.var.population = inputParams.population
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
  }

  calcFlow () {
    for (let key of this.keys) {
      this.flow[key] = 0
    }

    this.flow.susceptible =
      (-this.params.contactRate *
        this.compartment.prevalence *
        this.compartment.susceptible /
        this.var.population)

    this.flow.prevalence =
      (this.params.contactRate *
        this.compartment.prevalence *
        this.compartment.susceptible /
        this.var.population) -
      (this.params.recoverRate *
        this.compartment.prevalence)

    this.flow.recovered =
      (this.params.recoverRate *
        this.compartment.prevalence)
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

export default SirModel
