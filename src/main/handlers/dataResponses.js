import db from '../../common/components/db'
import transit from '../components/transit'

transit.on('data:req:recentFollowers', async event => {
  event.sender.send('data:res:recentFollowers', await db.getRecentFollows())
}, 'ipc')
