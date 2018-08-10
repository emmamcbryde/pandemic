import _ from 'lodash'

class BaseModel {
  /**
   * BaseModel is a compartmental model that
   * implements a system of differential equations
   * that connects the populations of the different
   * compartments.
   *
   * Most connections between compartments are
   * of the double-entry book-keeping type where
   * losses in one compartments are taken up
   * from another compartment.
   *
   * In order to handle all the connections without
   * putting too much of a burden on the programmer
   * the differential equations are built up from
   * the individual connections rather than being
   * specified straight up.
   *
   * That is dCompartment/dTime = linear function(compartment)
   *
   * 0) initializes compartments to initial variables
   *
   * The execution loop is:
   *
   * 1) externally add to this.delta of compartments
   *    due to extrinsic import of people
   * 2) recalculate this.vars - should
   *    depends only on params and
   *    current compartment values
   * 3) Generate all events - single changes to
   *    to compartments, or paired changes to two
   *    compartments. The amount of changes in each
   *    event should be proportional to:
   *      - compartments
   *      - params
   *      - vars
   * 4) Events are added to this.delta
   * 5) Deltas are multiplied by a time factor
   * 6) Compartments updated
   * 7) Chosen this.compartments and this.vars at
   *    the given time-point
   *    to be saved in this.solutions
   */
  constructor (id) {
    // Name of the particular instance of the model
    this.id = id

    this.modelType = 'BASE'

    // Keys are names of the compartments in the model
    this.keys = []

    // Dictionary to hold the population of each
    // compartment. Each compartment is represented
    // by the key of the compartment.
    // There are two key compartments that are
    // assumed in other parts of the app:
    //   1. prevalence
    //   2. susceptible
    this.compartment = {
      prevalence: 0,
      susceptible: 0,
    }

    // Current time point of the simulation
    this.startTime = 0
    this.time = 0

    // The time-points that are used for the simulation
    // Since this will use a simple Newtownain time-step,
    // the time-points define the time steps used in
    // propagating the simulation
    this.times = []

    // Parameters are constant values that are used in
    // the calculation of the differentials in the
    // time propagation. Each parameter will be referred
    // by a key
    this.params = {}

    // List of parameters that will be exported to a
    // GUI and used as a template to return values
    // to input into this.params
    this.guiParams = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'infectiousPeriod',
        value: 0.1,
        step: 0.01,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'prevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]

    // List of parameters that will be exported to a
    // GUI and used as a template to return values
    // to input into this.params
    this.interventionParams = [
      // {
      //   key: 'interventionDay',
      //   value: 5,
      //   step: 1,
      //   placeHolder: '',
      //   label: 'Intervertion Start Day'
      // },
      // {
      //   key: 'reproductionNumber',
      //   value: 1.5,
      //   step: 0.01,
      //   placeHolder: '',
      //   label: 'R0'
      // },
      // {
      //   key: 'infectiousPeriod',
      //   value: 0.1,
      //   step: 0.01,
      //   placeHolder: '',
      //   label: 'Recovery Rate'
      // },
      // {
      //   key: 'prevalence',
      //   value: 3000,
      //   step: 1,
      //   placeHolder: '',
      //   label: 'Prevalence'
      // }
    ]

    // Stores any variables that need to be dynamically
    // calculated from the compartments at a time-step
    this.var = {}

    // The delta for each compartment is the amount
    // it will change at a particular time-point.
    // this.delta can be set externally at the
    // beginning of each this.updateCompartment
    this.delta = {}

    // List of all events between compartments
    // that rely on dynamically calculated parameters
    this.varEvents = []

    // List of all events between compartments
    // that are proportional to constants in this.params
    this.paramEvents = []

    // This is a list of all transfers between
    // compartments, with the actual size of the
    // differentials at the current time-points
    this.events = []

    // The transfer for each compartment, which
    // will be constructed from this.events
    this.flow = {}

    // Stored list of variables for further analysis
    this.solution = {
      prevalence: [],
      susceptible: [],
      incidence: [],
      importIncidence: []
    }
  }

  /**
   * Convenient function to return GUI-friendly
   * list of parameters to modify
   *
   * @returns list[{}] paramEntries
   */
  getInputParamEntries () {
    return _.cloneDeep(this.guiParams)
  }

  /**
   * Convenient function to return GUI-friendly
   * list of parameters to modify
   *
   * @returns list[{}] paramEntries
   */
  getInterventionInputParamEntries () {
    if (this.interventionParams) {
      return _.cloneDeep(this.interventionParams)
    } else {
      return []
    }
  }

  /**
   * Allows GUI-control of the simulation, where
   * this.params are set to values provided by
   * inputParams
   *
   * @param guiParams
   */
  injestInputParamEntries (guiParams) {
    this.params = _.cloneDeep(this.defaultParams)
    for (let param of guiParams) {
      this.params[param.key] = parseFloat(param.value)
    }
  }

  /**
   * To be overridden. Initializations of this.params,
   * where new this.params can be calculated from exiting
   * this.params.
   */
  calcExtraParams () {
  }

  /**
   * To be overridden. Initializations of compartments
   * from this.params
   */
  initCompartmentsByParams () {
    this.compartment.prevalence = this.params.initPrevalence
    this.compartment.susceptible = this.params.initPopulation - this.params.initPrevalence
  }

  initCompartments () {
    for (let key of this.keys) {
      this.compartment[key] = 0
    }
    this.calcExtraParams()
    this.initCompartmentsByParams()
    this.checkEvents()
  }

  /**
   * Clears solutions, compartments and times for
   * re-running the simulation from the beginning
   */
  clearSolutions () {
    this.keys = _.keys(this.compartment)
    for (let key of _.keys(this.solution)) {
      this.solution[key].length = 0
    }
    this.times.length = 0
  }

  /**
   * Overridable function to calculate this.vars
   * relevant to each time-point from compartment and
   * params values.
   */
  calcVars () {
  }

  /**
   * Sanity check to make sure that there are suitable
   * this.vars and this.params for the varEvents and
   * paramEvents that are defined.
   */
  checkEvents () {
    this.calcVars()
    let varKeys = _.keys(this.var)
    for (let varEvent of this.varEvents) {
      let varEventKey = varEvent[2]
      if (!_.includes(varKeys, varEventKey)) {
        console.log(
          `Error: ${varEventKey} of this.varEvents not ` +
          `found in this.calcVars`
        )
      }
    }
    for (let paramEvent of this.paramEvents) {
      let paramEventKey = paramEvent[2]
      let paramKeys = _.keys(this.params)
      if (!_.includes(paramKeys, paramEventKey)) {
        console.log(
          `Error: ${paramEventKey} of this.paramEvents not ` +
          `found in this.params`
        )
      }
    }
  }

  /**
   * Clears this.delta which can store changes to
   * compartments extrinsic to the model.
   */
  clearDeltas () {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
  }

  /**
   * Calculates this.events, which encode specific
   * changes between compartments. These are stored
   * to allow for both the construction of differentials
   * and to use randomized samples further down the track
   */
  calcEvents () {
    this.calcVars()

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

  /**
   * Saves the time, and current state as a function
   * of time in solution. The actual variables that
   * are saved may be calculated here.
   *
   * @param dTime
   */
  saveToSolution (dTime) {
    let incidence = 0
    for (let event of this.events) {
      let to = event[1]
      let val = event[2]
      if (to === 'prevalence') {
        incidence += val * dTime
      }
    }

    this.solution.incidence.push(incidence)
    for (let key of ['prevalence', 'susceptible']) {
      this.solution[key].push(this.compartment[key])
    }
  }

  runStep (dTime) {
    this.calcEvents()

    // Calculates the flow from events, which is the
    // instantaneous differential for
    // each compartment.
    for (let key of this.keys) {
      this.flow[key] = 0
    }
    for (let [from, to, val] of this.events) {
      this.flow[from] -= val
      this.flow[to] += val
    }

    // This extra step is needed to allow the
    // actual this.delta of each compartment to
    // take external values (controlled by a
    // meta simulation) from other sources.
    // The this.delta is then modified by
    // this.flow * dTime as calculated by this.calcEvents
    // this.delta is defined by a time interval dTime
    for (let key of this.keys) {
      this.delta[key] += dTime * this.flow[key]
    }

    for (let key of this.keys) {
      this.compartment[key] += this.delta[key]

      // WARNING: this is a hacky check to
      // ensure that the simulation doesn't
      // stray into negative populations if
      // it is run with too crude a time step
      if (this.compartment[key] < 0) {
        this.compartment[key] = 0
      }
    }

    if (this.times.length === 0) {
      this.time = this.startTime
    }
    this.time += dTime
    this.times.push(this.time)

    this.saveToSolution(dTime)
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
      recoverRate: 0.1,
      initPrevalence: 3000,
      reproductionNumber: 1.5
    }

    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'susceptible', 'recoverRate'])

    this.guiParams = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'recoverRate',
        value: 0.1,
        step: 0.01,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'initPrevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  calcExtraParams () {
    this.params.contactRate =
      this.params.reproductionNumber * this.params.recoverRate
  }

  calcVars () {
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
      recoverRate: 0.1,
      initPrevalence: 3000,
      reproductionNumber: 1.5
    }

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.params = _.cloneDeep(this.defaultParams)

    this.guiParams = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'recoverRate',
        value: 0.1,
        step: 0.01,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'initPrevalence',
        value: 3000,
        placeHolder: '',
        step: 1,
        label: 'Prevalence'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'reproductionNumber',
        value: 1.2,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  calcExtraParams () {
    this.params.contactRate = this.params.reproductionNumber * this.params.recoverRate
  }

  applyIntervention (guiParams) {
    for (let param of guiParams) {
      this.params[param.key] = parseFloat(param.value)
    }
    this.calcExtraParams()
  }

  calcVars () {
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
      initPrevalence: 5000,
      reproductionNumber: 4
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'prevalence', 'disDeath'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.guiParams = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'period',
        value: 0.1,
        step: 0.01,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'CaseFatality',
        value: 0.2,
        step: 0.01,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'initPrevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  calcExtraParams () {
    this.params.recoverRate = (1 - this.params.caseFatality) * (this.params.period)
    this.params.disDeath = (-1) * this.params.caseFatality * this.params.period
    this.params.incubationRate = this.params.incubation
    this.params.contactRate =
      this.params.reproductionNumber * this.params.period
  }

  calcVars () {
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
      initPrevalence: 3000,
      reproductionNumber: 50,
      immunityPeriod: 50
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'prevalence', 'disDeath'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])
    this.paramEvents.push(['recovered', 'susceptible', 'immunityLossRate'])

    this.guiParams = [
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'period',
        value: 0.1,
        step: 0.01,
        placeHolder: '',
        label: 'Recovery Rate'
      },
      {
        key: 'CaseFatality',
        value: 0.2,
        step: 0.01,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'immunityPeriod',
        value: 50,
        step: 1,
        placeHolder: '',
        label: 'Immunity Period '
      },
      {
        key: 'initPrevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  calcExtraParams () {
    this.params.recoverRate =
      (1 - this.params.caseFatality) * (this.params.period)
    this.params.incubationRate = this.params.incubation
    this.params.disDeath = (-1) * this.params.caseFatality * this.params.period
    this.params.contactRate =
      this.params.reproductionNumber * this.params.period
    this.params.immunityLossRate = 1 / this.params.immunityPeriod
  }

  calcVars () {
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
      initPrevalence: 5000,
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
      preBurialPeriod: 3
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

    this.guiParams = [
      {
        key: 'reproduction',
        value: 1.6,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'ascerProb',
        value: 0.2,
        step: 0.01,
        placeHolder: '',
        label: 'Case-Ascertain. '
      },
      {
        key: 'hospitalCapacity',
        value: 10000,
        step: 1,
        placeHolder: '',
        label: 'Hospital Capacity'
      },
      {
        key: 'CaseFatalityHosp',
        value: 0.35,
        step: 0.01,
        placeHolder: '',
        label: ' Case-Fat.Hosp.'
      },
      {
        key: 'preBurialPeriod',
        value: 3,
        step: 1,
        placeHolder: '',
        label: 'Burial Period'
      },
      {
        key: 'initPrevalence',
        value: 5000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      }
    ]
  }

  calcExtraParams () {
    this.params.incubationRate = this.params.latency
    this.params.recoverRate1 =
      (1 - this.params.caseFatality) * this.params.postDetection
    this.params.recoverRate2 =
      (1 - this.params.caseFatalityHosp) * this.params.postDetection
    this.params.deathRate1 =
      this.params.caseFatality * this.params.postDetection
    this.params.deathRate2 = this.params.caseFatalityHosp * this.params.postDetection
    this.params.burialRate = 1 / this.params.preBurialPeriod
    this.params.foi = this.params.preDetection * (this.params.reproduction - (this.params.foiZero * (1 - this.params.ascerProb) +
      this.params.foiTwo * this.params.ascerProb) / this.params.postDetection - (this.params.foiThree *
      (this.params.caseFatalityHosp * (1 - this.params.ascerProb) + this.params.caseFatality * this.params.ascerProb) *
      this.params.preBurialPeriod))
  }

  calcVars () {
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
    class: SirModel,
    name: 'SIR'
  },
  {
    class: SisModel,
    name: 'SIS'
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
