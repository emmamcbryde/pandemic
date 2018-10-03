<template>
  <md-layout style="margin: 15px">
    <md-card
      style="
          max-width: 600px;
          padding: 2em;">
      <h1 class="md-display-1">
        Global Pandemic Map
      </h1>

      <p> This is an interactive tool that creates a map of the risk
      of epidemic
      spread/cross-border incursion related to priority pathogens.
      This will
      show the risk of combining human air travel and risk of
      transmission
      of disease to determine in an emerging pandemic, an early
      outbreak. It
      currently uses national populations, and consolidated flight
      data for inter-national travel patterns. </p>

      <p> Given the coarse granularity of the data, basic
      epidemiological are used to model individual countries. This
      is
      sufficient to model the initial phases of an epidemic where
      long-term recurrent effects are yet to set in. </p>

      <p>Data provided by OAG</p>

      <p> It is developed as part of <a
        href="https://www.aithm.jcu.edu.au/research/tropical-partners/overview-j9frv6/">Tropical
        Partnerships to Enhance Surveillance and Response to
        Infectious
        Diseases"</a>, based at the <a
          href="https://www.aithm.jcu.edu.au/">Australian Institute of
        Tropical Health & Medicine</a>. Specifically, it falls under
        <a
          href="https://www.aithm.jcu.edu.au/research/tropical-partners/themes/theme-2/">Theme
        2b</a>. </p>

      <p>
        Development team:
      </p>
      <ul>
        <li>Lead Programmer/UX Designer: <a href="http://boscoh.com">Bosco
        Ho</a></li>
        <li>Model Development: Adeshina Adekunke</li>
        <li>Consulting Epidemiologist: James Trauer</li>
        <li>Project Lead: Emma McBryde</li>
      </ul>
    </md-card>
  </md-layout>
</template>

<script>
export default { name: 'About' }
</script>
