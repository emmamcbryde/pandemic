<template>
  <md-toolbar
    md-theme="default"
    class="md-dense">

    <h2
      class="md-title"
      style="
        flex: 1;
        cursor: pointer;"
      @click="home">
      Global Pandemic Map
    </h2>

    <md-button @click="epiModel">
      epimodels
    </md-button>

    <md-button @click="about">
      About
    </md-button>

    <div v-if="isUser">

      <md-menu
        v-if="user.authenticated">
        <md-button
          md-menu-trigger>
          {{ user.name }}
        </md-button>

        <md-menu-content>
          <md-menu-item
            @click="editUser">
            Edit User
          </md-menu-item>

          <md-menu-item
            @click="logout">
            Logout
          </md-menu-item>
        </md-menu-content>
      </md-menu>

      <router-link
        v-else
        to="/login"
        tag="md-button">
        Login
      </router-link>

    </div>

  </md-toolbar>
</template>

<script>
import auth from '../modules/auth'
import config from '../config'

export default {
  name: 'Navbar',
  data() {
    return {
      isUser: config.isUser,
      user: auth.user,
      title: config.title
    }
  },
  methods: {
    async logout() {
      await auth.logout()
      this.$router.push('/login')
    },
    about() {
      this.$router.push('/about')
    },
    epiModel() {
      this.$router.push('/epimodel')
    },
    home() {
      this.$router.push('/')
    },
    editUser() {
      this.$router.push('/edit-user')
    }
  }
}
</script>
