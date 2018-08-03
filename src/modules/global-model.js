const _ = require('lodash')

function clearDict (aDict) {
  for (let key of _.keys(aDict)) {
    delete aDict[key]
  }
}

class GlobalModel {
  constructor (isIntervention) {
    this.countryIndices = []

    this.isIntervention = !!isIntervention
    console.log('GlobalModel.constructor isIntervention', this.isIntervention)

    this.countryModel = {}

    this.vars = {
      incidence: 0,
      prevalence: 0
    }

    this.solution = {
      incidence: [],
      prevalence: []
    }

    this.getTravelPerDay = null

    this.startTime = 0
    this.time = 0
    this.times = []

    this.interventionDay = null
    this.intervention = null
  }

  setCountryModel (countryIndices, ModelClass, sourceCountryName) {
    this.countryIndices = countryIndices
    clearDict(this.countryModel)
    for (let iCountry of this.countryIndices) {
      this.countryModel[iCountry] = new ModelClass(sourceCountryName)
    }
  }

  getInputParamEntries () {
    if (_.keys(this.countryModel).length > 0) {
      let result = this.countryModel[0].getInputParamEntries()
      if (!this.isIntervention) {
        let intervention = _.find(result, e => e.key === 'interventionDay')
        if (intervention) {
          this.interventionDay = intervention.value
        }
      }
      return result
    } else {
      return []
    }
  }

  makeIntervention () {
    this.intervention = new this.constructor(true)
    this.intervention.startTime = this.time
    this.intervention.getTravelPerDay = this.getTravelPerDay
    this.intervention.countryIndices = _.clone(this.countryIndices)
    for (let i of this.countryIndices) {
      this.intervention.countryModel[i] = _.cloneDeep(this.countryModel[i])
      if ('applyIntervention' in this.intervention.countryModel[i]) {
        this.intervention.countryModel[i].applyIntervention()
      }
      for (let sol of _.values(this.intervention.countryModel[i].solution)) {
        sol.length = 0
      }
    }
  }

  transferPeople () {
    if (!this.getTravelPerDay) {
      throw new Error('GlobalModel.getTravelPerDay function not set!')
    }

    let probSickCanTravel = 1

    for (let iFromCountry of this.countryIndices) {
      let fromCountry = this.countryModel[iFromCountry]

      fromCountry.calcVars()
      let fromPopulation = fromCountry.var.population

      for (let iToCountry of this.countryIndices) {
        if (iFromCountry !== iToCountry) {
          let travelPerDay = this.getTravelPerDay(iFromCountry, iToCountry)
          let probTravelPerDay = travelPerDay / fromPopulation
          let probSickTravelPerDay = probSickCanTravel * probTravelPerDay

          let delta = fromCountry.compartment.prevalence * probSickTravelPerDay

          fromCountry.delta.prevalence -= delta

          let toCountry = this.countryModel[iToCountry]
          toCountry.delta.prevalence += delta
          toCountry.importIncidence += delta
        }
      }
    }
  }

  run (nDay) {
    // Clear run
    this.solution.incidence.length = 0
    this.solution.prevalence.length = 0
    this.times = []
    this.time = this.startTime

    let dTimeInDay = 1

    _.times(nDay, () => {
      this.time += dTimeInDay
      this.times.push(this.time)

      for (let countryModel of _.values(this.countryModel)) {
        countryModel.clearDeltas()
        countryModel.importIncidence = 0
      }

      // sets countryModel.delta and countryModel.importIncidence
      this.transferPeople()

      this.vars.incidence = 0
      this.vars.prevalence = 0

      for (let countryModel of _.values(this.countryModel)) {
        countryModel.runStep(dTimeInDay)

        countryModel.solution.importIncidence.push(countryModel.importIncidence)
        this.vars.prevalence += countryModel.compartment.prevalence
        this.vars.incidence += _.last(countryModel.solution.incidence)
      }

      this.solution.incidence.push(this.vars.incidence)
      this.solution.prevalence.push(this.vars.prevalence)

      if (this.time === this.interventionDay) {
        this.makeIntervention()
      }
    })

    if (this.intervention) {
      this.intervention.run(nDay - this.interventionDay)
    }
  }
}

export { GlobalModel }
