/**
 * An instance of this class is passed to extensions.
 * The `interface` element should export a default function
 * that receives it, uses the `extend` method and its
 * sub-methods to add UI elements, then calls the `commit`
 * method to submit the resulting object. This object is
 * then used in the renderer to generate the reactive
 * list of end-user-configurable settings.
 *
 * Possible UI elements should be:
 * - switches ( toggles, on / off )
 * - selections ( dropdown box, select one option )
 * - input ( text entry, number input? )
 * - file location ( browse & select )
 */

export default class Interface {
  constructor (manifest) {
    this.manifest = manifest
    this.elements = []
  }

  extend () {
    const addToggle = opts => this.addElement('toggle', opts)
    const addSelect = opts => this.addElement('select', opts)
    const addInput = opts => this.addElement('input', opts)

    return {
      addToggle,
      addSelect,
      addInput
    }
  }

  addElement (type, opts) {
    if (!type || !opts.label || !opts.value) return

    this.elements.push(Object.assign({}, {
      type
    }, opts))
  }

  commit () {
    const meta = () => ({
      manifest: this.manifest,
      elements: this.elements
    })

    console.log(this.elements)
    console.dir(meta)

    // pass `meta` to the renderer somehow
    // so its values can be added to the UI
  }
}
