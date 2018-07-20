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
      infectiousPeriod: 0.1,
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
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'infectiousPeriod',
        value: 0.1,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  init () {
    super.init()
    this.params.period = this.params.infectiousPeriod
    this.params.recoverRate = this.params.period
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
      infectiousPeriod: 0.1,
      prevalence: 3000,
      reproductionNumber: 50
    }

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.params = _.cloneDeep(this.defaultParams)

    this.inputParamEntries = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'infectiousPeriod',
        value: 0.1,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  init () {
    super.init()

    this.params.period = this.params.infectiousPeriod
    this.params.recoverRate = this.params.period
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
      period: 0.1,
      incubation: 0.01,
      caseFatality: 0.2,
      prevalence: 5000,
      reproductionNumber: 4
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'prevalence', 'disDeath'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])
    this.inputParamEntries = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'period',
        value: 0.1,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'CaseFatality',
        value: 0.2,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  init () {
    super.init()
    this.params.recoverRate = (1 - this.params.caseFatality) * (this.params.period)
    this.params.disDeath = (-1) * this.params.caseFatality * this.params.period
    this.params.incubationRate = this.params.incubation
    this.params.contactRate =
      this.params.reproductionNumber * this.params.period

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
      period: 0.1,
      incubation: 0.01,
      caseFatality: 0.2,
      prevalence: 3000,
      reproductionNumber: 50,
      immunityPeriod: 50
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'prevalence', 'disDeath'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])
    this.paramEvents.push(['recovered', 'susceptible', 'immunityLossRate'])

    this.inputParamEntries = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'period',
        value: 0.1,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'CaseFatality',
        value: 0.2,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'immunityPeriod',
        value: 50,
        placeHolder: '',
        label: 'Immunity Period '
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  init () {
    super.init()

    this.params.recoverRate =
      (1 - this.params.caseFatality) * (this.params.period)
    this.params.incubationRate = this.params.incubation
    this.params.disDeath = (-1) * this.params.caseFatality * this.params.period
    this.params.contactRate =
      this.params.reproductionNumber * this.params.period
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

class EbolaModel extends BaseModel {
  constructor (id) {
    super(id)
    this.id = id

    this.modelType = 'Ebola'

    this.compartment = {
      prevalence: 0,
      susceptible: 0,
      exposed: 0,
      recovered: 0,
      infectedEarly: 0,
      hospitalised: 0,
      dead: 0,
      buried: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      foiZero: 0.1,
      foi: 0.2,
      foiTwo: 0.02,
      reproduction: 10,
      foiThree: 0.2,
      latency: 0.1,
      preDetection: 0.25,
      postDetection: 0.16,
      ascerProb: 0.05,
      hospitalCapacity: 10000,
      caseFatalityHosp: 0.35,
      caseFatality: 0.7,
      preBurialPeriod: 3,
      prev: 5000
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'infectedEarly', 'incubationRate'])
    this.varEvents.push(['infectedEarly', 'prevalence', 'rateForce1'])
    this.varEvents.push(['infectedEarly', 'hospitalised', 'rateForce2'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate1'])
    this.paramEvents.push(['hospitalised', 'recovered', 'recoverRate2'])
    this.paramEvents.push(['prevalence', 'dead', 'deathRate1'])
    this.paramEvents.push(['hospitalised', 'dead', 'deathRate2'])
    this.paramEvents.push(['dead', 'buried', 'burialRate'])
    this.inputParamEntries = [
      {
        key: 'reproduction',
        value: 1.6,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'ascerProb',
        value: 0.2,
        placeHolder: '',
        label: 'Case-Ascertain. '
      },
      {
        key: 'hospitalCapacity',
        value: 10000,
        placeHolder: '',
        label: 'Hospital Capacity'
      },
      {
        key: 'CaseFatalityHosp',
        value: 0.35,
        placeHolder: '',
        label: ' Case-Fat.Hosp.'
      },
      {
        key: 'preBurialPeriod',
        value: 3,
        placeHolder: '',
        label: 'Burial Period'
      },
      {
        key: 'prev',
        value: 5000,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  init () {
    super.init()

    this.params.incubationRate = this.params.latency
    this.params.recoverRate1 =
    (1 - this.params.caseFatality) * this.params.postDetection
    this.params.recoverRate2 =
    (1 - this.params.caseFatalityHosp) * this.params.postDetection
    this.params.deathRate1 =
                  this.params.caseFatality * this.params.postDetection
    this.params.deathRate2 = this.params.caseFatalityHosp * this.params.postDetection
    this.params.burialRate = 1 / this.params.preBurialPeriod
    this.compartment.prevalence = this.params.prev
    this.compartment.susceptible = this.params.initPopulation - this.params.prev
    this.params.foi = this.params.preDetection * (this.params.reproduction - (this.params.foiZero * (1 - this.params.ascerProb) +
        this.params.foiTwo * this.params.ascerProb) / this.params.postDetection - (this.params.foiThree *
       (this.params.caseFatalityHosp * (1 - this.params.ascerProb) + this.params.caseFatality * this.params.ascerProb) *
       this.params.preBurialPeriod))
  }

  calcVar () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
       (this.params.foi * this.compartment.prevalence + this.params.foiZero * this.compartment.infectedEarly +
        this.params.foiTwo * this.compartment.hospitalised + this.params.foiThree * this.compartment.dead) /
        this.var.population
    /*
    console.log(this.var.rateForce)
    */
    this.var.rateForce1 = (1 - this.params.ascerProb * (1 - this.compartment.hospitalised / this.params.hospitalCapacity)) *
       this.params.preDetection
    this.var.rateForce2 = this.params.ascerProb * (1 - this.compartment.hospitalised / this.params.hospitalCapacity) *
       this.params.preDetection
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
  },
  {
    class: EbolaModel,
    name: 'Ebola'
  }

]

export { models }
