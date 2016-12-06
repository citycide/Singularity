<style lang="scss" scoped>
  s {
    text-decoration: line-through;
  }

  .setup-heading.singularity-logo {
    position: relative;
    transform: translate(-50%, -50%);
    top: 100px;
    left: 50%;
  }

  .setup-content {
    background-color: #fff;
    border: 1px solid #d8d8d8;
    margin: 65px auto 40px auto;
    padding: 40px 20px;
    width: 85%;
  }

  .step-body {
    padding: 20px 0 20px 0;
    margin-left: auto;
    margin-right: auto;
    width: 60%;

    p {
      padding: 0 0 10px 0;
    }

    p.heading {
      padding: 20px 0 10px 0;
      font-size: 2.5em;
    }

    .fa-icon.heart {
      fill: #da4a4a;
    }

    .fa-icon.shuttle {
      transform: rotate(-90deg);
    }

    &.deactivation {
      margin: initial;
      width: initial;
    }
  }

  .step-footer {
    padding: 10px 0 0 0;
  }
</style>

<template>
  <div class="setup-wrapper">
    <div class="setup-heading singularity-logo has-text-centered">
      <img src="./setup/singularity_lg.png" width="128" height="128">
    </div>

    <div class="setup-content">
      <vs-wizard :current-index.sync="setup.currentStep">
        <vs-wizard-step
          title="WELCOME" description=""
          :progress="setup.zero.progress" :valid="setup.zero.valid"
        ></vs-wizard-step>
        <vs-wizard-step
          title="CHANGELOG" description=""
          :progress="setup.one.progress" :valid="setup.one.valid"
        ></vs-wizard-step>
        <vs-wizard-step
          title="FEEDBACK" description=""
          :progress="setup.two.progress" :valid="setup.two.valid"
        ></vs-wizard-step>
        <vs-wizard-step
          title="CONNECT WITH TWITCH" description=""
          :progress="setup.three.progress" :valid="setup.three.valid"
        ></vs-wizard-step>
        <vs-wizard-step
          title="SETUP COMPLETE" description=""
          :progress="setup.four.progress" :valid="setup.four.valid"
        ></vs-wizard-step>
      </vs-wizard>

      <div class="setup-step-zero has-text-centered" v-if="setup.currentStep === 0">
        <div class="step-body">
          <p class="content">
            Let's take care of a few things before we get started.
          </p>
        </div>
        <div class="step-footer">
          <ui-button
            @click.stop.prevent="setProgress(1)"
            color="primary" icon="arrow_forward" icon-right
          >START</ui-button>
        </div>
      </div>
      <div class="setup-step-one has-text-centered" v-if="setup.currentStep === 1">
        <div class="step-body">
          <changelog></changelog>
        </div>

        <div class="step-footer">
          <ui-button
            @click.stop.prevent="setProgress(2)"
            color="primary" icon="arrow_forward" icon-right
          >NEXT</ui-button>
        </div>
      </div>

      <div class="setup-step-two has-text-centered" v-if="setup.currentStep === 2">
        <div class="step-body">
          <p class="heading">HOW'S MY CODING?</p>
          <p>
            Sure, sure, I made it with <icon name="heart" class="heart"></icon> and
            all that. But if you do happen to run into issues, please check the
            <a @click="openLink('github-issues')">issue list</a>
            to see if it's already there. If it is, feel free to add your voice.
            If it hasn't been reported already, please provide as much info as
            you can about the situation.
          </p>
          <p>
            For all the great things you might <s>never</s> want to say to me,
            check out my <a @click="openLink('twitter')">Twitter</a>!
          </p>
        </div>

        <div class="step-footer">
          <ui-button
            @click.stop.prevent="setProgress(3)"
            color="primary" icon="arrow_forward" icon-right
          >NEXT</ui-button>
        </div>
      </div>

      <div class="setup-step-three has-text-centered" v-if="setup.currentStep === 3">
        <div class="step-body">
          <ui-button
            class="twitch-connect" color="primary" @click="twitchConnect"
            text="Connect with Twitch" raised
          ></ui-button>
        </div>
      </div>

      <div class="setup-step-four has-text-centered" v-if="setup.currentStep === 4">
        <div class="step-body">
          <icon class="shuttle" name="space-shuttle" scale="10"></icon>
          <p class="heading">YOU'RE ALL SET, {{ channelName }}</p>
          <p class="content">Are you ready to cross the event horizon?</p>
        </div>

        <div class="step-footer">
          <ui-button
            @click.stop.prevent="finish" color="primary"
          >LET'S GO</ui-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script type="text/babel">
  import icon from 'vue-awesome'
  import { UiButton } from 'keen-ui'
  import changelog from './changelog'

  import {
    wizard as vsWizard,
    wizardStep as vsWizardStep
  } from 'gritcode-components/dist/gritcode-components'

  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {
        setup: {
          currentStep: 0,
          zero: {
            progress: 0,
            valid: false
          },
          one: {
            progress: 0,
            valid: false
          },
          two: {
            progress: 0,
            valid: false
          },
          three: {
            progress: 0,
            valid: false
          },
          four: {
            progress: 0,
            valid: false
          }
        }
      }
    },

    ready () {
      this.$store.subscribe(({ type }, state) => {
        if (type === 'AUTHENTICATE' && state.user.authorized) {
          this.setProgress(4)
        }
      })
    },

    methods: {
      ...mapActions(['channel', 'authenticate', 'setupFinished']),

      setProgress (step) {
        const [curr, next] = this.getSteps(step)
        this.setup[curr].valid = true
        this.setup.currentStep = next
      },

      twitchConnect () {
        if (this.channel.name) {
          this.setProgress(4)
        } else {
          this.authenticate()
        }
      },

      finish () {
        this.setupFinished()
        this.$router.go('dashboard')
      },

      getSteps (step) {
        switch (step) {
          case 0: return [undefined, 0]
          case 1: return ['zero', 1]
          case 2: return ['one', 2]
          case 3: return ['two', 3]
          case 4: return ['three', 4]
          default: return []
        }
      },

      openLink (link) {
        switch (link) {
          case 'github-issues':
            this.$electron.remote.shell.openExternal(
              'https://www.github.com/citycide/singularity/issues'
            )
            break
          case 'twitter':
            this.$electron.remote.shell.openExternal(
              'https://twitter.com/thecitycide'
            )
            break
          default: return
        }
      }
    },

    computed: {
      ...mapGetters(['channel']),

      channelName () {
        return this.channel.name.toUpperCase()
      }
    },

    components: {
      icon,
      UiButton,
      changelog,
      vsWizard,
      vsWizardStep
    }
  }
</script>
