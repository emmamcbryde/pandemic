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
   * putting too much of a burden on the programmer,
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
   *    due to extrinsic import of people, via this.transferInfectiousTo
   * 2) recalculate this.var - should
   *    depends only on this.param and
   *    current this.compartment values
   * 3) Generate all events - single changes to
   *    to compartments, or paired changes to two
   *    compartments. The amount of changes in each
   *    event should be proportional to:
   *      - compartments
   *      - params
   *      - var
   * 4) Events are added to this.delta
   * 5) Deltas are multiplied by a time factor
   * 6) Compartments updated
   * 7) Chosen this.compartments and this.var at
   *    the given time-point
   *    to be saved in this.solutions
   */
  constructor(id) {
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
    //   1. infectious
    //   2. susceptible
    this.compartment = {
      infectious: 0,
      susceptible: 0
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
    this.param = {}

    this.defaultParams = {
      initPopulation: 50000,
      initPrevalence: 3000,
      probSickCanTravel: 1
    }

    // List of parameters that will be exported to a
    // GUI and used as a template to return values
    // to input into this.param
    this.guiParams = [
      // {
      //   key: 'initPrevalence',
      //   value: 3000,
      //   step: 1,
      //   placeHolder: '',
      //   label: 'infectious'
      // }
    ]

    // List of parameters that will be exported to a
    // GUI and used as a template to return values
    // to input into this.param
    this.interventionParams = [
      // Must have an interventionDay for the GUI
      // to recognize interventions properly
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
    // that are proportional to constants in this.param
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
      infectious: [],
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
  getGuiParams() {
    return this.guiParams
  }
  /**
   * Convenient function to return GUI-friendly
   * list of parameters to modify
   *
   * @returns list[{}] paramEntries
   */
  getInterventionParams() {
    if (this.interventionParams.length > 0) {
      return this.interventionParams
    } else {
      return []
    }
  }

  /**
   * Allows GUI-control of the simulation, where
   * this.param are set to values provided by
   * guiParams
   *
   * @param guiParams
   */
  importGuiParams(guiParams) {
    this.param = _.cloneDeep(this.defaultParams)
    for (let param of guiParams) {
      if (!_.isNil(param.key)) {
        this.param[param.key] = parseFloat(param.value)
      }
    }
  }

  /**
   * To be overridden. Calculates new this.param from
   * existing this.param.
   */
  calcExtraParams() {}

  /**
   * To be overridden. Initializations of compartments
   * from this.param, used at the beginning of a run and typically
   * called by this.initCompartments
   */
  initCompartmentsByParams() {
    this.compartment.infectious = this.param.initPrevalence
    this.compartment.susceptible =
      this.param.initPopulation - this.param.initPrevalence
  }

  /**
   * Called before running a simulation
   */
  initCompartments() {
    for (let key of this.keys) {
      this.compartment[key] = 0
    }
    this.calcExtraParams()
    this.initCompartmentsByParams()
    this.checkEvents()
  }

  /**
   * Takes user-input of intervention parameters to load into the model
   * to calculate an intervention
   *
   * @param [params] - a param folds a dictionary for a value and its bounds and step
   */
  applyIntervention(guiParams) {
    for (let param of guiParams) {
      if (!_.isNil(param.key)) {
        this.param[param.key] = parseFloat(param.value)
      }
    }
    this.calcExtraParams()
  }

  /**
   * Clears solutions, compartments and times for
   * re-running the simulation from the beginning and
   * for reseting a simulation as an intervention
   */
  clearSolutions() {
    this.keys = _.keys(this.compartment)

    this.solution = {}
    for (let key of this.keys) {
      this.solution[key] = []
    }
    this.solution.incidence = []
    this.solution.importIncidence = []

    this.times.length = 0
  }

  /**
   * Overridable function to calculate this.var
   * relevant to each time-point from compartment and
   * params values.
   */
  calcVars() {}

  /**
   * Sanity check to make sure that there are suitable
   * this.var and this.param for the varEvents and
   * paramEvents that are defined.
   */
  checkEvents() {
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
      let paramKeys = _.keys(this.param)
      if (!_.includes(paramKeys, paramEventKey)) {
        console.log(
          `Error: ${paramEventKey} of this.paramEvents not ` +
            `found in this.param`
        )
      }
    }
  }

  /**
   * Clears variables for transfers with other countryModels to occur
   */
  clearBeforeTransfer() {
    for (let key of this.keys) {
      this.delta[key] = 0
    }
    this.var.importIncidence = 0
  }

  /**
   * Moves only infectious people out of compartments to compartments in
   * toCountryModel, where the probabilities are also controlled by
   * potential travel bans both at the origin and destination countries
   *
   * @param toCountry - another BaseModel
   * @param travelPerDay - number of people travelling between the two models
   */
  transferInfectiousTo(toCountry, travelPerDay) {
    let fromCountry = this

    let probTravelPerDay = travelPerDay / fromCountry.var.population

    let probSickTravelPerDay =
      Math.min(
        fromCountry.param.probSickCanTravel,
        toCountry.param.probSickCanTravel
      ) * probTravelPerDay

    for (let key of ['infectious']) {
      let delta = fromCountry.compartment[key] * probSickTravelPerDay
      fromCountry.delta[key] -= delta
      toCountry.delta[key] += delta
      toCountry.var.importIncidence += delta
    }
  }

  /**
   * Calculates this.events, which encode specific
   * changes between compartments. These are stored
   * to allow for both the construction of differentials
   * and to use randomized samples further down the track
   */
  calcEvents() {
    this.calcVars()

    this.events.length = 0

    for (let [from, to, varKey] of this.varEvents) {
      let val = this.var[varKey] * this.compartment[from]
      this.events.push([from, to, val])
    }

    for (let [from, to, paramKey] of this.paramEvents) {
      let val = this.param[paramKey] * this.compartment[from]
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
  saveToSolution(dTime) {
    let incidence = 0
    for (let event of this.events) {
      let to = event[1]
      let val = event[2]
      if (to === 'infectious') {
        incidence += val * dTime
      }
    }
    this.solution.incidence.push(incidence)

    for (let key of _.keys(this.compartment)) {
      this.solution[key].push(this.compartment[key])
    }
  }

  runStep(dTime) {
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

  run(nStep = 30, dTimeInDay = 1) {
    console.log(`BaseModel.run nStep=${nStep} dT=${dTimeInDay}`)
    this.clearSolutions()
    this.initCompartments()

    this.time = this.startTime
    this.times.push(this.time)
    this.saveToSolution(0)

    _.times(nStep, () => {
      this.clearBeforeTransfer()
      this.runStep(dTimeInDay)
    })
  }
}

function convertParamsToDict(params) {
  let result = {}
  for (let param of params) {
    if (!_.isNil(param.key)) {
      result[param.key] = parseFloat(param.value)
    }
  }
  return result
}

class SisModel extends BaseModel {
  constructor(id) {
    super(id)

    this.modelType = 'SIS'

    this.compartment = {
      susceptible: 0,
      infectious: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      initPrevalence: 3000,
      infectiousPeriodSis: 5,
      transmissionRateSis: 0.36,
      probSickCanTravel: 1
    }
    this.param = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'infectious', 'rateForce'])
    this.paramEvents.push(['infectious', 'susceptible', 'recoverRate'])

    this.guiParams = [
      {
        key: 'transmissionRateSis',
        value: 0.36,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSis',
        value: 5,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.guiParams)
          let R0Sir = param.transmissionRateSis * param.infectiousPeriodSis
          return R0Sir.toFixed(2)
        }
      },
      {
        key: 'initPrevalence',
        value: 300,
        step: 1,
        min: 0,
        max: 10000,
        placeHolder: '',
        label: 'Initial Prevalence'
      },
      {
        key: 'initPopulation',
        value: 50000,
        step: 1,
        min: 0,
        max: 100000,
        placeHolder: '',
        label: 'Population'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        min: 0,
        max: 100,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'transmissionRateSis',
        value: 0.3,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSis',
        value: 4,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.interventionParams)
          let r0 = param.transmissionRateSis * param.infectiousPeriodSis
          return r0.toFixed(2)
        }
      }
    ]
  }

  calcExtraParams() {
    this.param.recoverRate = 1 / this.param.infectiousPeriodSis
  }

  calcVars() {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.transmissionRateSis / this.var.population) *
      this.compartment.infectious
  }
}

class SirModel extends BaseModel {
  constructor(id) {
    super(id)

    this.modelType = 'SIR'

    this.compartment = {
      susceptible: 0,
      infectious: 0,
      recovered: 0,
      dead: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      initPrevalence: 3000,
      infectiousPeriodSir: 5,
      transmissionRateSir: 0.35,
      caseFatalitySir: 0.02,
      probSickCanTravel: 1
    }

    this.varEvents.push(['susceptible', 'infectious', 'rateForce'])
    this.paramEvents.push(['infectious', 'recovered', 'recoverRate'])
    this.paramEvents.push(['infectious', 'dead', 'disDeath'])

    this.param = _.cloneDeep(this.defaultParams)

    this.guiParams = [
      {
        key: 'transmissionRateSir',
        value: 0.35,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSir',
        value: 5,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.guiParams)
          let r0 = param.transmissionRateSir * param.infectiousPeriodSir
          return r0.toFixed(2)
        }
      },
      {
        key: 'caseFatalitySir',
        value: 0.02,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'initPrevalence',
        value: 300,
        placeHolder: '',
        step: 1,
        min: 0,
        max: 100000,
        label: 'Initial Prevalence'
      },
      {
        key: 'initPopulation',
        value: 50000,
        step: 1,
        min: 0,
        max: 100000,
        placeHolder: '',
        label: 'Population'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        min: 0,
        max: 100,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'transmissionRateSir',
        value: 0.3,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSir',
        value: 4,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        key: 'travelBanFraction',
        value: 0.5,
        step: 0.1,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Travel Ban Fraction'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.interventionParams)
          let r0 = param.transmissionRateSir * param.infectiousPeriodSir
          return r0.toFixed(2)
        }
      }
    ]
  }

  calcExtraParams() {
    this.param.recoverRate =
      (1 - this.param.caseFatalitySir) * (1 / this.param.infectiousPeriodSir)
    this.param.disDeath =
      this.param.caseFatalitySir * (1 / this.param.infectiousPeriodSir)
    if (_.has(this.param, 'travelBanFraction')) {
      this.param.probSickCanTravel = 1 - this.param.travelBanFraction
    }
  }

  calcVars() {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.transmissionRateSir / this.var.population) *
      this.compartment.infectious
  }
}

class SEIRModel extends BaseModel {
  constructor(id) {
    super(id)
    this.id = id

    this.modelType = 'SEIR'

    this.compartment = {
      susceptible: 0,
      exposed: 0,
      infectious: 0,
      recovered: 0,
      dead: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      incubationPeriod: 100,
      infectiousPeriodSeir: 5,
      transmissionRateSeir: 0.35,
      caseFatalitySeir: 0.02,
      initPrevalence: 3000,
      probSickCanTravel: 1
    }
    this.param = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'infectious', 'incubationRate'])
    this.paramEvents.push(['infectious', 'dead', 'disDeath'])
    this.paramEvents.push(['infectious', 'recovered', 'recoverRate'])

    this.guiParams = [
      {
        key: 'transmissionRateSeir',
        value: 0.35,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSeir',
        value: 30,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.guiParams)
          let r0 = param.transmissionRateSeir * param.infectiousPeriodSeir
          return r0.toFixed(2)
        }
      },
      {
        key: 'incubationPeriod',
        value: 5,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Incubation Period (days)'
      },
      {
        key: 'caseFatalitySeir',
        value: 0.2,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'initPrevalence',
        value: 300,
        step: 1,
        min: 0,
        max: 10000,
        placeHolder: '',
        label: 'Initial Prevalence'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        min: 0,
        max: 100,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'transmissionRateSeir',
        value: 0.3,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSeir',
        value: 4,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.interventionParams)
          let r0 = param.transmissionRateSeir * param.infectiousPeriodSeir
          return r0.toFixed(2)
        }
      }
    ]
  }

  calcExtraParams() {
    this.param.incubationRate = 1 / this.param.incubationPeriod
    this.param.recoverRate =
      (1 - this.param.caseFatalitySeir) / this.param.infectiousPeriodSeir
    this.param.disDeath =
      this.param.caseFatalitySeir / this.param.infectiousPeriodSeir
    console.log('SEIRModel.calcExtraParams', this.param)
  }

  calcVars() {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.transmissionRateSeir / this.var.population) *
      this.compartment.infectious
  }
}

class SEIRSModel extends BaseModel {
  constructor(id) {
    super(id)
    this.id = id

    this.modelType = 'SEIRS'

    this.compartment = {
      susceptible: 0,
      exposed: 0,
      infectious: 0,
      recovered: 0,
      dead: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      incubationPeriod: 100,
      caseFatalitySeirs: 0.02,
      initPrevalence: 3000,
      infectiousPeriodSeirs: 5,
      transmissionRateSeirs: 0.35,
      immunityPeriodSeirs: 50,
      probSickCanTravel: 1
    }
    this.param = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'infectious', 'incubationRate'])
    this.paramEvents.push(['infectious', 'dead', 'disDeath'])
    this.paramEvents.push(['infectious', 'recovered', 'recoverRate'])
    this.paramEvents.push(['recovered', 'susceptible', 'immunityLossRate'])

    this.guiParams = [
      {
        key: 'transmissionRateSeirs',
        value: 0.35,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSeirs',
        value: 5,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.guiParams)
          let r0 = param.transmissionRateSeirs * param.infectiousPeriodSeirs
          return r0.toFixed(2)
        }
      },
      {
        key: 'incubationPeriod',
        value: 5,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Incubation Period (days)'
      },
      {
        key: 'caseFatalitySeirs',
        value: 0.2,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Case-Fatality Rate'
      },
      {
        key: 'immunityPeriodSeirs',
        value: 50,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Immunity Period (days) '
      },
      {
        key: 'initPrevalence',
        value: 300,
        step: 1,
        min: 0,
        max: 10000,
        placeHolder: '',
        label: 'Initial Prevalence'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        min: 0,
        max: 100,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'transmissionRateSeirs',
        value: 0.3,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate (per day)'
      },
      {
        key: 'infectiousPeriodSeirs',
        value: 4,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Infectious Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let param = convertParamsToDict(this.interventionParams)
          let r0 = param.transmissionRateSeirs * param.infectiousPeriodSeirs
          return r0.toFixed(2)
        }
      }
    ]
  }

  calcExtraParams() {
    this.param.incubationRate = 1 / this.param.incubationPeriod
    this.param.recoverRate =
      (1 - this.param.caseFatalitySeirs) / this.param.infectiousPeriodSeirs
    this.param.disDeath =
      this.param.caseFatalitySeirs / this.param.infectiousPeriodSeirs
    this.param.immunityLossRate = 1 / this.param.immunityPeriodSeirs
  }

  calcVars() {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.transmissionRateSeirs / this.var.population) *
      this.compartment.infectious
  }
}

class EbolaModel extends BaseModel {
  constructor(id) {
    super(id)
    this.id = id

    this.modelType = 'Ebola'

    this.compartment = {
      susceptible: 0,
      exposed: 0,
      infectedEarly: 0,
      infectious: 0,
      hospitalised: 0,
      recovered: 0,
      buried: 0,
      dead: 0
    }

    this.defaultParams = {
      initPopulation: 50000,
      initPrevalence: 5000,
      foiZero: 0.1,
      foi: 0.2,
      foiTwo: 0.02,
      foiThree: 0.2,
      incubationPeriod: 100,
      preDetection: 0.25,
      postDetection: 0.16,
      ascerProb: 0.05,
      hospitalCapacity: 10000,
      caseFatalityHosp: 0.35,
      caseFatality: 0.7,
      preBurialPeriod: 3,
      probSickCanTravel: 1
    }
    this.param = _.cloneDeep(this.defaultParams)

    this.varEvents.push(['susceptible', 'exposed', 'rateForce'])
    this.paramEvents.push(['exposed', 'infectedEarly', 'incubationRate'])
    this.varEvents.push(['infectedEarly', 'infectious', 'rateForce1'])
    this.varEvents.push(['infectedEarly', 'hospitalised', 'rateForce2'])
    this.paramEvents.push(['infectious', 'recovered', 'recoverRate1'])
    this.paramEvents.push(['hospitalised', 'recovered', 'recoverRate2'])
    this.paramEvents.push(['infectious', 'dead', 'deathRate1'])
    this.paramEvents.push(['hospitalised', 'dead', 'deathRate2'])
    this.paramEvents.push(['dead', 'buried', 'burialRate'])

    this.guiParams = [
      {
        key: 'foi',
        value: 0.35,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate from Infectious Individuals(per day)'
      },
      {
        key: 'ascerProb',
        value: 0.2,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Fraction of People Potentially Infectious During Incubation'
      },
      {
        key: 'incubationPeriod',
        value: 21,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Incubation Period (days)'
      },
      {
        key: 'hospitalCapacity',
        value: 10000,
        step: 1,
        min: 1,
        max: 100000,
        placeHolder: '',
        label: 'Hospital Capacity (number of isolation beds)'
      },
      {
        key: 'caseFatalityHosp',
        value: 0.35,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Case Fatality in Hospital'
      },
      {
        key: 'preBurialPeriod',
        value: 3,
        step: 1,
        min: 1,
        max: 100,
        placeHolder: '',
        label: 'Burial Period (days)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let guiParam = convertParamsToDict(this.guiParams)
          let R1 = guiParam.foi / this.defaultParams.preDetection
          let R2 =
            this.defaultParams.foiZero * (1 - guiParam.ascerProb) +
            this.defaultParams.foiThree * guiParam.ascerProb
          let R3 =
            (this.defaultParams.foiThree *
              (guiParam.caseFatalityHosp * (1 - guiParam.ascerProb) +
                guiParam.ascerProb * this.defaultParams.caseFatality)) /
            guiParam.preBurialPeriod
          let R0Ebola = R1 + R2 + R3
          return R0Ebola.toFixed(2)
        }
      },
      {
        key: 'initPrevalence',
        value: 300,
        step: 1,
        min: 0,
        max: 10000,
        placeHolder: '',
        label: 'Initial Prevalence'
      }
    ]

    this.interventionParams = [
      {
        key: 'interventionDay',
        value: 5,
        step: 1,
        min: 0,
        max: 100,
        placeHolder: '',
        label: 'Start Day'
      },
      {
        key: 'foi',
        value: 0.2,
        step: 0.01,
        min: 0,
        max: 1,
        placeHolder: '',
        label: 'Transmission Rate from Infectious Individuals(per day)'
      },
      {
        label: 'R0',
        isReadOnly: true,
        getValue: () => {
          let guiParam = convertParamsToDict(this.guiParams)
          let interventionParam = convertParamsToDict(this.interventionParams)

          let R11 = interventionParam.foi / this.defaultParams.preDetection
          let R12 =
            this.defaultParams.foiZero * (1 - guiParam.ascerProb) +
            this.defaultParams.foiThree * guiParam.ascerProb
          let R13 =
            (this.defaultParams.foiThree *
              (guiParam.caseFatalityHosp * (1 - guiParam.ascerProb) +
                guiParam.ascerProb * this.defaultParams.caseFatality)) /
            guiParam.preBurialPeriod

          var R0EbolaI = R11 + R12 + R13
          return R0EbolaI.toFixed(2)
        }
      },
      {
        key: 'hospitalCapacity',
        value: 10000,
        step: 1,
        min: 1,
        max: 100000,
        placeHolder: '',
        label: 'Hospital Capacity (number of isolation beds)'
      }
    ]
  }

  calcExtraParams() {
    this.param.incubationRate = 1 / this.param.incubationPeriod
    this.param.recoverRate1 =
      (1 - this.param.caseFatality) * this.param.postDetection
    this.param.recoverRate2 =
      (1 - this.param.caseFatalityHosp) * this.param.postDetection
    this.param.deathRate1 = this.param.caseFatality * this.param.postDetection
    this.param.deathRate2 =
      this.param.caseFatalityHosp * this.param.postDetection
    this.param.burialRate = 1 / this.param.preBurialPeriod
    this.param.reproductionNumber =
      this.param.foi / this.param.preDetection +
      (this.param.foiZero * (1 - this.param.ascerProb) +
        this.param.foiTwo * this.param.ascerProb) /
        this.param.postDetection +
      (this.param.foiThree *
        (this.param.caseFatalityHosp * (1 - this.param.ascerProb) +
          this.param.caseFatality * this.param.ascerProb)) /
        this.param.preBurialPeriod
  }

  calcVars() {
    this.var.population = _.sum(_.values(this.compartment))
    this.var.rateForce =
      (this.param.foi * this.compartment.infectious +
        this.param.foiZero * this.compartment.infectedEarly +
        this.param.foiTwo * this.compartment.hospitalised +
        this.param.foiThree * this.compartment.dead) /
      this.var.population
    /*
    console.log(this.var.rateForce)
    */
    this.var.rateForce1 =
      (1 -
        this.param.ascerProb *
          (1 - this.compartment.hospitalised / this.param.hospitalCapacity)) *
      this.param.preDetection
    this.var.rateForce2 =
      this.param.ascerProb *
      (1 - this.compartment.hospitalised / this.param.hospitalCapacity) *
      this.param.preDetection
  }
}

let models = [
  {
    Class: SirModel,
    name: 'Susceptible Infectious Recovered'
  },
  {
    Class: SisModel,
    name: 'Susceptible Infectious Susceptible'
  },
  {
    Class: SEIRModel,
    name: 'Susceptible Exposed Infections Recovered'
  },
  {
    Class: SEIRSModel,
    name: 'Susceptible Exposed Infections Recovered Susceptible'
  },
  {
    Class: EbolaModel,
    name: 'Ebola'
  }
]

export { models }
