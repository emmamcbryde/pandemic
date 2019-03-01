<template>
  <v-toolbar
    dense
    tabs
    color="white"
  >
    <v-toolbar-title
      class="heading font-weight-medium"
      style="
        flex: 1;
        cursor: pointer;"
      @click="home"
    >
      Global Pandemic Map
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <v-toolbar-items>
      <v-btn
        flat
        to="/epimodel"
        router
      >
        epimodels
      </v-btn>

      <v-btn
        flat
        to="/about"
        router
      >
        About
      </v-btn>

      <template v-if="isUser">
        <v-menu
          v-if="user.authenticated"
          bottom
          left
          open-on-hover
        >
          <v-btn slot="activator">
            {{ user.name }}
            <v-icon>arrow_drop_down</v-icon>
          </v-btn>

          <v-list>
            <v-list-tile @click="editUser">
              <v-list-tile-title>
                Edit User
              </v-list-tile-title>
            </v-list-tile>

            <v-list-tile @click="logout">
              <v-list-tile-title>
                Logout
              </v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>

        <v-btn
          v-else
          flat
          to="/login"
        >
          Login
        </v-btn>
      </template>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import auth from '../modules/auth'
import config from '../config'

export default {
  data () {
    return {
      isUser: config.isUser,
      user: auth.user,
      title: config.title
    }
  },
  methods: {
    home () {
      this.$router.push('/')
    },
    editUser () {
      this.$router.push('/edit-user')
    },
    async logout () {
      await auth.logout()
      this.$router.push('/login')
    }
  }
}
</script>
