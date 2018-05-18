import _ from 'lodash'

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

    this.solution = {
      prevalence: [],
      susceptible: [],
      incidence: [],
      inputIncidence: []
    }
  }

  init () {
    this.keys = _.keys(this.compartment)
    for (let key of _.keys(this.solution)) {
      this.solution[key].length = 0
    }
    for (let key of this.keys) {
      this.compartment[key] = 0
    }
    this.params.probSickCanTravel = 1
  }

  getInputParamEntries () {
    return _.cloneDeep(this.inputParamEntries)
  }

  calcVar () {
  }

  checkEvents () {
    this.calcVar()
    let varKeys = _.keys(this.var)
    for (let varEvent of this.varEvents) {
      let varEventKey = varEvent[2]
      if (!(_.includes(varKeys, varEventKey))) {
        console.log(`Error: ${varEventKey} of this.varEvents not` +
          `found in this.calcVars`)
      }
    }
    for (let paramEvent of this.paramEvents) {
      let paramEventKey = paramEvent[2]
      let paramKeys = _.keys(this.params)
      if (!(_.includes(paramKeys, paramEventKey))) {
        console.log(`Error: ${paramEventKey} of this.paramEvents not` +
          `found in this.params`)
      }
    }
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
    this.checkEvents()
  }

  clearDelta () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  calcFlow () {
    this.events.length = 0

    this.calcVar()
    for (let [from, to, varKey] of this.varEvents) {
      let val = this.var[varKey] * this.compartment[from]
      this.events.push([from, to, val])
    }

    for (let [from, to, paramKey] of this.paramEvents) {
      let val = this.params[paramKey] * this.compartment[from]
      this.events.push([from, to, val])
    }
  }

  placeSolution (dTime) {
    let incidence = 0
    for (let event of this.events) {
      let to = event[1]
      let val = event[2]
      if (to === 'prevalence') {
        incidence += val * dTime
      }
    }
    this.solution.incidence.push(incidence)
  }

  updateCompartment (dTime) {
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

    this.placeSolution(dTime)
  }

  getExitPrevalence (travelPerDay) {
    this.calcVar()
    let probTravelPerDay = travelPerDay / this.var.population
    let probSickTravelPerDay =
      this.params.probSickCanTravel * probTravelPerDay
    return this.compartment.prevalence * probSickTravelPerDay
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
    super.init()

    this.params.period = this.params.infectiousPeriod 
    this.params.recoverRate =
      1 / (this.params.period)
    this.params.contactRate =
      this.params.reproductionNumber *
      this.params.recoverRate

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
        this.var.population *
          this.compartment.prevalence
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
      infectiousPeriod: 10,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.params = _.cloneDeep(this.defaultParams)

    this.inputParamEntries = [
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
    super.init()

    this.params.period = this.params.infectiousPeriod
    this.params.recoverRate = 1 / (this.params.period)
    this.params.contactRate = this.params.reproductionNumber * this.params.recoverRate
    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
  }
}

class SEIRModel extends BaseModel {
  constructor (id) {
    super(id)
    this.id = id

    this.modelType = 'SEIR'

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      exposed: 0,
      recovered: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      period: 30,
      incubation: 50,
      caseFatality: 200,
      prevalence: 3000,
      reproductionNumber: 50
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.inputParamEntries = [
      {
        key: 'period',
        value: 30,
        placeHolder: '',
        label: 'Infectious Period'
      },
      {
        key: 'incubation',
        value: 50,
        placeHolder: '',
        label: 'Latency Period'
      },
      {
        key: 'CaseFatality',
        value: 200,
        placeHolder: '',
        label: 'Fatality '
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 50,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  init () {
    super.init()

    this.params.recoverRate =
      (1 - 1 / (this.params.caseFatality)) / (this.params.period)
    this.params.incubationRate = 1 / (this.params.incubation)
    this.params.contactRate =
      this.params.reproductionNumber *
      (1 / this.params.period)

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
  }
}
class SEIRSModel extends BaseModel {
  constructor (id) {
    super(id)
    this.id = id

    this.modelType = 'SEIRS'

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      exposed: 0,
      recovered: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      period: 30,
      incubation: 50,
      caseFatality: 200,
      prevalence: 3000,
      reproductionNumber: 50,
      immunityPeriod: 50
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])
    this.paramEvents.push(['recovered', 'susceptible', 'immunityLossRate'])

    this.inputParamEntries = [
      {
        key: 'period',
        value: 30,
        placeHolder: '',
        label: 'Infectious Period'
      },
      {
        key: 'incubation',
        value: 50,
        placeHolder: '',
        label: 'Latency Period'
      },
      {
        key: 'CaseFatality',
        value: 200,
        placeHolder: '',
        label: 'Fatality'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'immunityPeriod',
        value: 50,
        placeHolder: '',
        label: 'Immunity Period '
      },
      {
        key: 'reproductionNumber',
        value: 50,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  init () {
    super.init()

    this.params.recoverRate =
      (1 - 1 / (this.params.caseFatality)) / (this.params.period)
    this.params.incubationRate = 1 / (this.params.incubation)
    this.params.contactRate =
      this.params.reproductionNumber *
      (1 / this.params.period)
    this.params.immunityLossRate = 1 / this.params.immunityPeriod
    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
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
  },
  {
    class: SEIRModel,
    name: 'SEIR'
  },
  {
    class: SEIRSModel,
    name: 'SEIRS'
  }

]

export { models }
