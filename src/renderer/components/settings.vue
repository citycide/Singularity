<style lang="scss">
  .step-body {
    padding: 20px 0 20px 0;
    margin-left: auto;
    margin-right: auto;
    width: 60%;

    p {
      padding: 0 0 10px 0;
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
  <div>
    <bot-settings></bot-settings>
    <ui-tabs type="text" fullwidth>
      <ui-tab header="TipeeeStream">
        <div v-if="!tipeeeEnabled">
          <vs-wizard :current-index.sync="tipeee.currentStep">
            <vs-wizard-step
              title="INSERT COIN" description="Get your API key"
              :progress="tipeee.one.progress" :valid="tipeee.one.valid"
            ></vs-wizard-step>
            <vs-wizard-step
              title="KEY TO THE KINGDOM" description="We're going to need that"
              :progress="tipeee.two.progress" :valid="tipeee.two.valid"
            ></vs-wizard-step>
          </vs-wizard>

          <div class="tipeee-step-one has-text-centered" v-if="tipeee.currentStep === 0">
            <div class="step-body">
              <p>
                <strong>singularity</strong> supports tip alerts through TipeeeStream. To activate
                this feature, you'll need to get your API key. Please click the link below to open
                TipeeeStream's dashboard in a new window where you can copy the API key. Then come
                back here to submit it.
              </p>
            </div>
            <div class="tipeee-image">
              <!--<img src="/images/streamtip-setup.png" class="tipeee-img-responsive">-->
            </div>
            <div class="step-footer">
              <ui-button
                @click.stop.prevent="openLink('tipeee')"
                color="primary" icon="open_in_new" icon-right
              >GO TO TIPEEESTREAM</ui-button>
            </div>
          </div>
          <div class="tipeee-step-two has-text-centered" v-if="tipeee.currentStep === 1">
            <div class="step-body">
              <p>
                Enter the API key you just grabbed from TipeeeStream below,
                then click <strong>SUBMIT</strong>.
              </p>

              <ui-textbox
                name="API Key" icon="vpn_key" type="text"
                :value.sync="tipeee.token" placeholder="TipeeeStream API Key"
                help-text="Enter your TipeeeStream API Key here."
                validation-rules="required|min:35|max:45"
              ></ui-textbox>
            </div>

            <div class="step-footer">
              <ui-button
                @click.stop.prevent="enable('tipeee')"
                color="primary" icon="check" icon-right
              >SUBMIT</ui-button>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="step-body deactivation">
            <p>
              TipeeeStream has already been enabled.
              If you want to disable it, click the button below.
            </p>
          </div>
          <div class="step-footer">
            <ui-button
              @click="tipeee.showDeactModal = true" color="warning"
            >DEACTIVATE</ui-button>
          </div>
        </div>
      </ui-tab>

      <ui-tab header="Streamlabs">
        <div v-if="!streamlabsEnabled">
          <vs-wizard :current-index.sync="streamlabs.currentStep">
            <vs-wizard-step
              title="INSERT COIN" description="Get your API key"
              :progress="streamlabs.one.progress" :valid="streamlabs.one.valid"
            ></vs-wizard-step>
            <vs-wizard-step
              title="KEY TO THE KINGDOM" description="We're going to need that"
              :progress="streamlabs.two.progress" :valid="streamlabs.two.valid"
            ></vs-wizard-step>
          </vs-wizard>

          <div class="streamlabs-step-one has-text-centered" v-if="streamlabs.currentStep === 0">
            <div class="step-body">
              <p>
                <strong>singularity</strong> supports tip alerts through Streamlabs.
                To activate this feature, you'll need to get your API Access Token.
                Please click the link below to open Streamlabs' dashboard in a new
                window where you can copy the API Access Token. Then come back here to submit it.
              </p>
            </div>
            <div class="streamlabs-image">
              <!--<img src="/images/streamtip-setup.png" class="tipeee-img-responsive">-->
            </div>
            <div class="step-footer">
              <ui-button
                @click.stop.prevent="openLink('streamlabs')"
                color="primary" icon="open_in_new" icon-right
              >GO TO STREAMLABS</ui-button>
            </div>
          </div>
          <div class="streamlabs-step-two has-text-centered" v-if="streamlabs.currentStep === 1">
            <div class="step-body">
              <p>
                Enter the API key you just grabbed from Streamlabs below,
                then click <strong>SUBMIT</strong>.
              </p>

              <ui-textbox
                name="API Key" icon="vpn_key" type="text"
                :value.sync="streamlabs.token" placeholder="Streamlabs API Key"
                help-text="Enter your Streamlabs API Key here."
                validation-rules="required|min:35|max:45"
              ></ui-textbox>
            </div>

            <div class="step-footer">
              <ui-button
                @click.stop.prevent="enable('streamlabs')"
                color="primary" icon="check" icon-right
              >SUBMIT</ui-button>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="step-body deactivation">
            <p>
              Streamlabs has already been enabled.
              If you want to disable it, click the button below.
            </p>
          </div>
          <div class="step-footer">
            <ui-button
              @click="streamlabs.showDeactModal = true" color="warning"
            >DEACTIVATE</ui-button>
          </div>
        </div>
      </ui-tab>

      <ui-tab header="StreamTip">
        <div v-if="!streamtipEnabled">
          <vs-wizard :current-index.sync="streamtip.currentStep">
            <vs-wizard-step
              title="INSERT COIN" description="Get your API key"
              :progress="streamtip.one.progress" :valid="streamtip.one.valid"
            ></vs-wizard-step>
            <vs-wizard-step
              title="KEY TO THE KINGDOM" description="We're going to need that"
              :progress="streamtip.two.progress" :valid="streamtip.two.valid"
            ></vs-wizard-step>
          </vs-wizard>

          <div class="streamtip-step-one has-text-centered" v-if="streamtip.currentStep === 0">
            <div class="step-body">
              <p>
                <strong>singularity</strong> supports tip alerts through StreamTip.
                To activate this feature, you'll need to get your API Access Token.
                Please click the link below to open StreamTip's dashboard in a new
                window where you can copy the API Access Token. Then come back here to submit it.
              </p>
            </div>
            <div class="streamtip-image">
              <!--<img src="/images/streamtip-setup.png" class="tipeee-img-responsive">-->
            </div>
            <div class="step-footer">
              <ui-button
                @click.stop.prevent="openLink('streamtip')"
                color="primary" icon="open_in_new" icon-right
              >GO TO STREAMLABS</ui-button>
            </div>
          </div>
          <div class="streamtip-step-two has-text-centered" v-if="streamtip.currentStep === 1">
            <div class="step-body">
              <p>
                Enter the API key you just grabbed from StreamTip below,
                then click <strong>SUBMIT</strong>.
              </p>

              <ui-textbox
                name="API Key" icon="vpn_key" type="text"
                :value.sync="streamtip.token" placeholder="StreamTip API Key"
                help-text="Enter your StreamTip API Key here."
                validation-rules="required|min:35|max:45"
              ></ui-textbox>
            </div>

            <div class="step-footer">
              <ui-button
                @click.stop.prevent="enable('streamtip')"
                color="primary" icon="check" icon-right
              >SUBMIT</ui-button>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="step-body deactivation">
            <p>
              StreamTip has already been enabled.
              If you want to disable it, click the button below.
            </p>
          </div>
          <div class="step-footer">
            <ui-button
              @click="streamtip.showDeactModal = true" color="warning"
            >DEACTIVATE</ui-button>
          </div>
        </div>
      </ui-tab>
    </ui-tabs>

    <ui-confirm
      header="Deactivate TipeeeStream?" @confirmed="disable('tipeee')" @denied=""
      :show.sync="tipeee.showDeactModal" close-on-confirm
    > If you deactivate TipeeeStream, you'll need to go
      through the setup process again. Are you sure?
    </ui-confirm>
    <ui-confirm
      header="Deactivate Streamlabs?" @confirmed="disable('streamlabs')" @denied=""
      :show.sync="streamlabs.showDeactModal" close-on-confirm
    > If you deactivate Streamlabs, you'll need to go
      through the setup process again. Are you sure?
    </ui-confirm>
    <ui-confirm
      header="Deactivate Streamtip?" @confirmed="disable('streamtip')" @denied=""
      :show.sync="streamtip.showDeactModal" close-on-confirm
    > If you deactivate Streamtip, you'll need to go
      through the setup process again. Are you sure?
    </ui-confirm>
  </div>
</template>

<script>
  import {
    UiButton,
    UiConfirm,
    UiTabs,
    UiTab,
    UiTextbox
  } from 'keen-ui'

  import {
    wizard as vsWizard,
    wizardStep as vsWizardStep
  } from 'gritcode-components/dist/gritcode-components'

  import botSettings from './settings/bot'

  import { mapGetters, mapActions } from 'vuex'
  import transit from './js/transit'

  export default {
    data () {
      return {
        tipeee: {
          currentStep: 0,
          showDeactModal: false,
          one: {
            progress: 0,
            valid: false
          },
          two: {
            progress: 0,
            valid: false
          },
          url: 'https://www.tipeeestream.com/dashboard/api-key'
        },

        streamtip: {
          currentStep: 0,
          showDeactModal: false,
          one: {
            progress: 0,
            valid: false
          },
          two: {
            progress: 0,
            valid: false
          },
          url: 'https://streamtip.com/account'
        },

        streamlabs: {
          currentStep: 0,
          showDeactModal: false,
          one: {
            progress: 0,
            valid: false
          },
          two: {
            progress: 0,
            valid: false
          },
          url: 'https://streamlabs.com/dashboard/api-settings'
        }
      }
    },

    methods: {
      openLink (service) {
        this.$electron.remote.shell.openExternal(this[service].url)
        this[service].one.valid = true
        this[service].currentStep = 1
      },

      ...mapActions(['enableService', 'disableService']),

      enable (service) {
        this.enableService({ service, token: this[service].token })
      },

      disable (service) {
        this.disableService(service)
      }
    },

    computed: mapGetters(['tipeeeEnabled', 'streamtipEnabled', 'streamlabsEnabled']),

    components: {
      botSettings,
      UiButton,
      UiConfirm,
      UiTabs,
      UiTab,
      UiTextbox,
      vsWizard,
      vsWizardStep
    }
  }
</script>
