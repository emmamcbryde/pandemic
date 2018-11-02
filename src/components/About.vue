<template>
  <md-layout
    style="
      margin: auto;
      max-width: 550px;
      padding: 2em;">

    <div
      style="
        padding-top: 10em;
        padding-bottom: 3em;
        width: 100%;
        text-align: left">

      <div
        class="md-title"
        style="
          font-weight: normal;
          font-size: 36px;
          ">
        Global Pandemic Map
      </div>
    </div>

    <div
      style="
        text-align: justify;
        padding-bottom: 15em">

      <p> This is an interactive tool that creates a map of the risk
      of epidemic spread/cross-border incursion related to priority
      pathogens. It combines human air travel with the risk of
      transmission of disease, to determine the risk of an early
      outbreak in an emerging pandemic. </p>

      <p class="md-subheading">
        Country Model
      </p>

      <p> Given the coarse granularity of the data, simple
      epidemiological models are used to model individual countries.
      This
      is sufficient to model the initial phases of an epidemic where
      long-term recurrent effects are yet to set in. </p>

      <p class="md-subheading">
        Travel Data
      </p>

      <p>Travel data is generated from consolidated international
      flight
      data from <a href="https://www.oag.com/">OAG</a>, combined with a simple estimate of land travel
      between neighbouring countries.</p>

      <p class="md-subheading">
        Global Model
      </p>

      <p> The global model is a geospatial model consisting of
      each individual country model combined with an inter-country
      transfer of people at each major time-step. The number of
      people transferring is derived from the travel data. All
      model calculations are carried out in the browser directly.
      </p>

      <p class="md-subheading">
        Development Team
      </p>

      <p>
        <ul>
          <li>Lead Programmer/UX Designer: <a href="http://boscoh.com">Bosco
          Ho</a></li>
          <li>Model Development: Adeshina Adekunle</li>
          <li>Consulting Epidemiologist: James Trauer</li>
          <li>Project Lead: Emma McBryde</li>
        </ul>
      </p>

      <p class="md-subheading">
        Source
      </p>

      <p>
        <a href="http://github.com/boscoh/pandemic">
          http://github.com/boscoh/pandemic</a>
      </p>

      <p class="md-subheading">
        Funding
      </p>

      <p>
        <a
          href="https://www.aithm.jcu.edu.au/research/tropical-partners/themes/theme-2/">Theme
        2b</a> //
        <a
          href="https://www.aithm.jcu.edu.au/research/tropical-partners/overview-j9frv6/">Tropical
          Partnerships to Enhance Surveillance and Response to
          Infectious Diseases</a>
      </p>
      <p>
        <a
          href="https://www.aithm.jcu.edu.au/">Australian Institute of
          Tropical Health & Medicine</a>
        <br>Townsville, Australia
      </p>
    </div>

  </md-layout>
</template>

<style>
.md-subheading {
  padding-top: 1em;
  width: 100%;
  text-align: left;
}
</style>

<script>
export default { name: 'About' }
</script>
