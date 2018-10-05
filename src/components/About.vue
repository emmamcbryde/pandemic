<template>
  <md-layout
    style="
      margin: auto;
      max-width: 550px;
      padding: 2em;">

    <div
      style="
        padding-top: 7em;
        padding-bottom: 4em;
        width: 100%;
        text-align: left">

      <h1
        class="md-display-1"
        style="
          color: #333;
          font-size: 2em;
          letter-spacing: 0.2em;
          font-weight: 800;
          text-transform: uppercase">
        Global Pandemic Map
      </h1>
    </div>

    <div
      style="text-align: justify">

      <p> This is an interactive tool that creates a map of the risk
      of epidemic spread/cross-border incursion related to priority
      pathogens. This will show the risk of combining human air
      travel and risk of transmission of disease to determine in an
      emerging pandemic, an early outbreak. </p>

      <p class="md-subheading">
        Model
      </p>

      <p> Given the coarse granularity of the data, basic
      epidemiological models are used to model individual countries. This
      is sufficient to model the initial phases of an epidemic where
      long-term recurrent effects are yet to set in. </p>

      <p class="md-subheading">
        Data
      </p>

      <p>It currently uses consolidated flight data for
      inter-national travel patterns, provided by OAG, with a simple
      estimate of land travel.</p>

      <p class="md-subheading">
        Funding
      </p>

      <p> The Global Pandemic Map is part of  <a
        href="https://www.aithm.jcu.edu.au/research/tropical-partners/themes/theme-2/">Theme
        2b</a> of the <a
        href="https://www.aithm.jcu.edu.au/research/tropical-partners/overview-j9frv6/">"Tropical
        Partnerships to Enhance Surveillance and Response to
        Infectious Diseases"</a>. It is based at the <a
        href="https://www.aithm.jcu.edu.au/">Australian Institute of
        Tropical Health & Medicine</a>, Townsville, Australia.
      </p>

      <p class="md-subheading">
        Development Team
      </p>

      <p>
        <ul>
          <li>Lead Programmer/UX Designer: <a href="http://boscoh.com">Bosco
          Ho</a></li>
          <li>Model Development: Adeshina Adekunke</li>
          <li>Consulting Epidemiologist: James Trauer</li>
          <li>Project Lead: Emma McBryde</li>
        </ul>
      </p>
    </div>

  </md-layout>
</template>

<style>
.md-subheading {
  text-transform: uppercase;
  padding-top: 1em;
  width: 100%;
  font-size: 0.9em;
  font-weight: 800;
  text-align: left;
  letter-spacing: 0.2em;
}
</style>

<script>
export default { name: 'About' }
</script>
