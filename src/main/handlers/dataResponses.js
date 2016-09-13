import db from 'common/components/db'
import transit from 'main/components/transit'

transit.on('data:req:recentFollowers', async event => {
  event.sender.send('data:res:recentFollowers', await db.getRecentFollows())
}, 'ipc')
