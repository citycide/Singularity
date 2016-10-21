import Tock from 'common/utils/tock'
import weave from 'common/components/weave'
import { is, to, sleep } from 'common/utils/helpers'

export default function () {
  return {
    tick: new Tock(),
    weave,
    sleep,
    is,
    to
  }
}
