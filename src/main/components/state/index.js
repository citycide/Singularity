import { createStore } from 'cubbie'

const store = createStore()

store.setInitialState({
  services: {
    /**
     * The Twitch service is always active,
     * so its property isn't all that useful.
     * It's mainly here as a guide for the
     * rest of the services.
     */
    twitch: {
      active: true
    }
  }
})

export default store
