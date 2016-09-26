export default Array(10).fill('').map((v, i) => {
  return {
    user: {
      username: 'citycide',
      badges: {
        broadcaster: '1'
      },
      'display-name': 'citycide',
      color: '#13a89e',
      emotes: {
        25: (i + 1 < 10 ? ['74-78'] : ['75-79'])
      }
    },
    message: `testing with a message this should be a couple lines long and is test #${i + 1} Kappa`,
    channel: 'citycide',
    action: false,
    self: false
  }
})
