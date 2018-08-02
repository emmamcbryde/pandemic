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
    this.id = id

    this.modelType = 'BASE'

    // Keys are the names of all the compartments
    // in the model
    this.keys = []

    // Dictionary to hold the population of each
    // compartment. Each compartment is represented
    // by the key of the compartment.
    this.compartment = {}

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
    // time propagation
    this.params = {}

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
      inputIncidence: []
    }
  }

  /**
   * Convenient function to return GUI-friendly
   * list of parameters to modify
   *
   * @returns list[{}] paramEntries
   */
  getInputParamEntries () {
    return _.cloneDeep(this.inputParamEntries)
  }

  /**
   * Allows GUI-control of the simulation, where
   * this.params are set to values provided by
   * inputParams
   *
   * @param inputParams
   */
  resetParams (inputParams) {
    this.params = _.cloneDeep(this.defaultParams)
    _.assign(this.params, inputParams)
    for (let key of _.keys(inputParams)) {
      if (inputParams[key] !== this.params[key]) {
        console.log(
          `${this.modelType}-model.resetParams `,
          this.id,
          'error',
          inputParams[key],
          this.params[key]
        )
      }
    }
    this.clear()
    this.initParams()
    this.checkEvents()
  }

  /**
   * To be overriden. Initializations of this.params,
   * where new this.parmas can be calculated
   */
  initParams () {
  }

  /**
   * Clears solutions, compartments and times for
   * re-running the simulation from the beginning
   */
  clear () {
    this.keys = _.keys(this.compartment)
    for (let key of _.keys(this.solution)) {
      this.solution[key].length = 0
    }
    for (let key of this.keys) {
      this.compartment[key] = 0
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
          `Error: ${varEventKey} of this.varEvents not` +
          `found in this.calcVars`
        )
      }
    }
    for (let paramEvent of this.paramEvents) {
      let paramEventKey = paramEvent[2]
      let paramKeys = _.keys(this.params)
      if (!_.includes(paramKeys, paramEventKey)) {
        console.log(
          `Error: ${paramEventKey} of this.paramEvents not` +
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
      let [from, to, val] = event
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
      incubationPeriod: 10,
      infectiousPeriod: 10,
      prevalence: 3000,
      reproductionNumber: 1.5
    }

    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'susceptible', 'recoverRate'])

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 10,
        step: 1,
        placeHolder: '',
        label: 'Incubation Period'
      },
      {
        key: 'infectiousPeriod',
        value: 10,
        step: 1,
        placeHolder: '',
        label: 'Infectious Period'
      },
      {
        key: 'prevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  initParams () {
    this.params.period =
      this.params.infectiousPeriod + this.params.incubationPeriod
    this.params.recoverRate = 1 / this.params.period
    this.params.contactRate =
      this.params.reproductionNumber * this.params.recoverRate

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
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
      incubationPeriod: 10,
      infectiousPeriod: 10,
      prevalence: 3000,
      reproductionNumber: 1.5
    }

    this.varEvents.push(['susceptible', 'prevalence', 'rateForce'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.params = _.cloneDeep(this.defaultParams)

    this.inputParamEntries = [
      {
        key: 'incubationPeriod',
        value: 10,
        placeHolder: '',
        step: 1,
        label: 'Incubation Period'
      },
      {
        key: 'infectiousPeriod',
        value: 10,
        placeHolder: '',
        step: 1,
        label: 'Infectious Period'
      },
      {
        key: 'prevalence',
        value: 3000,
        placeHolder: '',
        step: 1,
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      },
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        placeHolder: '',
        label: 'intervention day'
      },
      {
        key: 'interventionReproductionNumber',
        value: 2.0,
        step: 1,
        placeHolder: '',
        label: 'intervention R0'
      }
    ]
  }

  initParams () {
    this.params.period =
      this.params.infectiousPeriod + this.params.incubationPeriod
    this.params.recoverRate = 1 / this.params.period
    this.params.contactRate =
      this.params.reproductionNumber * this.params.recoverRate

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  applyIntervention () {
    this.params.reproductionNumber = this.params.interventionReproductionNumber
    this.params.contactRate =
      this.params.reproductionNumber * this.params.recoverRate
  }

  runStep (dTime) {
    super.runStep(dTime)
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
      period: 30,
      incubation: 50,
      caseFatality: 200,
      prevalence: 3000,
      reproductionNumber: 1.5
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
        step: 1,
        label: 'Period'
      },
      {
        key: 'incubation',
        value: 50,
        step: 1,
        placeHolder: '',
        label: 'Latency'
      },
      {
        key: 'CaseFatality',
        value: 200,
        placeHolder: '',
        step: 1,
        label: 'Fatality'
      },
      {
        key: 'prevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  initParams () {
    this.params.recoverRate =
      (1 - 1 / this.params.caseFatality) / this.params.period
    this.params.incubationRate = 1 / this.params.incubation
    this.params.contactRate =
      this.params.reproductionNumber * (1 / this.params.period)

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
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
      reproductionNumber: 1.5
    }
    this.params = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'prevalence', 'incubationRate'])
    this.paramEvents.push(['prevalence', 'recovered', 'recoverRate'])

    this.inputParamEntries = [
      {
        key: 'period',
        value: 30,
        step: 1,
        placeHolder: '',
        label: 'Period'
      },
      {
        key: 'incubation',
        value: 50,
        step: 1,
        placeHolder: '',
        label: 'Latency'
      },
      {
        key: 'CaseFatality',
        value: 200,
        step: 1,
        placeHolder: '',
        label: 'Fatality'
      },
      {
        key: 'prevalence',
        value: 3000,
        step: 1,
        placeHolder: '',
        label: 'Prevalence'
      },
      {
        key: 'reproductionNumber',
        value: 1.5,
        step: 0.01,
        placeHolder: '',
        label: 'R0'
      }
    ]
  }

  initParams () {
    this.params.recoverRate =
      (1 - 1 / this.params.caseFatality) / this.params.period
    this.params.incubationRate = 1 / this.params.incubation
    this.params.contactRate =
      this.params.reproductionNumber * (1 / this.params.period)

    this.compartment.prevalence = this.params.prevalence
    this.compartment.susceptible =
      this.params.initPopulation - this.params.prevalence
  }

  calcVars () {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      this.params.contactRate /
      this.var.population *
      this.compartment.prevalence
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
  }
]

export { models }
