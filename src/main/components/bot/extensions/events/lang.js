export default function ($) {
  $.weave.set('alerts.settings', 'Follows: {0}, Hosts: {1}, Subs: {2}, Tips: {3}')
  
  $.weave.set('alerts.follows.usage', 'Usage: !alerts follow (enable | disable) » currently {0}')
  $.weave.set('alerts.follows.enabled.success', 'Alerts for new followers enabled.')
  $.weave.set('alerts.follows.disabled.success', 'Alerts for new followers disabled.')
  $.weave.set('alerts.follows.response-reward', 'Thanks for the follow, {0}! +{1}')
  $.weave.set('alerts.follows.response-no-reward', 'Thanks for the follow, {0}!')
  
  $.weave.set('alerts.host.usage', 'Usage: !alerts host (enable | disable) » currently {0}')
  $.weave.set('alerts.host.enabled.success', 'Alerts for host events enabled.')
  $.weave.set('alerts.host.disabled.success', 'Alerts for host events disabled.')
  $.weave.set('alerts.host.response-reward', '{0} fired up the host machine for {1} viewers. Thanks! +{2}')
  $.weave.set('alerts.host.response-no-reward', '{0} fired up the host machine for {1} viewers. Thanks!')
  
  $.weave.set('alerts.sub.usage', 'Usage: !alerts sub (enable | disable) » currently {0}')
  $.weave.set('alerts.sub.enabled.success', 'Alerts for new subscribers enabled.')
  $.weave.set('alerts.sub.disabled.success', 'Alerts for new subscribers disabled.')
  $.weave.set('alerts.sub.response-reward', '{0} subscribed! +{1}!')
  $.weave.set('alerts.sub.response-no-reward', 'Thanks for the sub, {0}!')
  $.weave.set('alerts.sub.resub-reward', '{0} has been subbed for {1} months! +{2}')
  $.weave.set('alerts.sub.resub-no-reward', '{0} has been subbed for {1} months!')
  
  $.weave.set('alerts.tip.usage', 'Usage: !alerts tip (enable | disable) » currently {0}')
  $.weave.set('alerts.tip.enabled.success', 'Alerts for tips enabled.')
  $.weave.set('alerts.tip.disabled.success', 'Alerts for tips disabled.')
  $.weave.set('alerts.tip.response-reward', '{0} tipped {1}. Thank you! PogChamp +{2}')
  $.weave.set('alerts.tip.response-no-reward', '{0} tipped {1}. Thank you! PogChamp')
}
