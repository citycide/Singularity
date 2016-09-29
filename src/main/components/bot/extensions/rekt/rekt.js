/**
 * rekt - responds with a random rekt-notrekt message
 *
 * @command rekt
 * @usage !rekt
 *
 * @source stock module
 * @author citycide
 */

export async function rekt (e, $) {
  if (!e.args.length) {
    const response = await $.db.getRandomRow('rekt')

    if (response) {
      $.say(e.sender, $.params(e, response.value))
    } else {
      $.say(e.sender, `I'm not going to dignify that with a response.`)
    }

    return
  }

  if (e.subcommand === 'add') {
    if (!e.subArgs[0]) {
      $.say(e.sender, `Usage: !rekt add (message)`)
      return
    }

    await $.db.set('rekt', { value: `☐ Not rekt ☑ ${e.subArgString}` })

    const res = await $.db.getRow('rekt', { value: `☐ Not rekt ☑ ${e.subArgString}` })
    const id = res ? res.id : false

    if (id) {
      $.say(e.sender, `rekt response added as #${id}.`)
    } else {
      $.say(e.sender, `Failed to add rekt response.`)
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!e.subArgs[0]) {
      $.say(e.sender, `Usage: !rekt remove (number >/= 1)`)
      return
    }

    const id = parseInt(e.subArgs[0])
    if (await $.db.del('rekt', { id })) {
      const count = $.db.countRows('rekt')
      $.say(e.sender, `rekt response removed. ${count} responses remaining.`)
    } else {
      $.say(e.sender, `Failed to remove rekt response #${id}.`)
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!e.subArgs.length < 2) {
      $.say(e.sender, `Usage: !rekt edit (number >/= 1) (message)`)
      return
    }

    if (!await $.db.exists('rekt', { id: e.subArgs[0] })) {
      $.say(e.sender, `There is no !rekt response with ID #${e.subArgs[0]}.`)
      return
    }

    const id = parseInt(e.subArgs[0])
    const value = e.subArgs.slice(1).join(' ')

    if (await $.db.set('rekt', { value }, { id })) {
      $.say(e.sender, `rekt response #${id} modified.`)
    } else {
      $.say(e.sender, `Failed to edit rekt response #${id}.`)
    }
  }
}

async function initResponses ($) {
  $.log('rekt', 'No rekt responses found, adding some defaults...')

  const defaults = [
    `☐ Not rekt ☑ REKT`,
    `☐ Not rekt ☑ Really Rekt`,
    `☐ Not rekt ☑ REKTangle`,
    `☐ Not rekt ☑ SHREKT`,
    `☐ Not rekt ☑ REKT-it Ralph`,
    `☐ Not rekt ☑ The Lord of the REKT`,
    `☐ Not rekt ☑ The Usual Susreks`,
    `☐ Not rekt ☑ North by NorthREKT`,
    `☐ Not rekt ☑ REKT to the Future`,
    `☐ Not rekt ☑ Once Upon a Time in the REKT`,
    `☐ Not rekt ☑ Full mast erektion`,
    `☐ Not rekt ☑ Rektum`,
    `☐ Not rekt ☑ Resurrekt`,
    `☐ Not rekt ☑ Correkt`,
    `☐ Not rekt ☑ Indirekt`,
    `☐ Not rekt ☑ Tyrannosaurus Rekt`,
    `☐ Not rekt ☑ Cash4Rekt.com`,
    `☐ Not rekt ☑ Grapes of Rekt`,
    `☐ Not rekt ☑ Ship Rekt`,
    `☐ Not rekt ☑ Rekt marks the spot`,
    `☐ Not rekt ☑ Caught rekt handed`,
    `☐ Not rekt ☑ The Rekt Side Story`,
    `☐ Not rekt ☑ Singin' In The Rekt`,
    `☐ Not rekt ☑ Painting The Roses Rekt`,
    `☐ Not rekt ☑ Rekt Van Winkle`,
    `☐ Not rekt ☑ Parks and Rekt`,
    `☐ Not rekt ☑ Lord of the Rekts: The Reking of the King`,
    `☐ Not rekt ☑ Star Trekt`,
    `☐ Not rekt ☑ The Rekt Prince of Bel-Air`,
    `☐ Not rekt ☑ A Game of Rekt`,
    `☐ Not rekt ☑ Rektflix`,
    `☐ Not rekt ☑ Rekt it like it's hot`,
    `☐ Not rekt ☑ RektBox 360`,
    `☐ Not rekt ☑ The Rekt-men`,
    `☐ Not rekt ☑ School Of Rekt`,
    `☐ Not rekt ☑ I am Fire, I am Rekt`,
    `☐ Not rekt ☑ Rekt and Roll`,
    `☐ Not rekt ☑ Professor Rekt`,
    `☐ Not rekt ☑ Catcher in the Rekt`,
    `☐ Not rekt ☑ Rekt-22`,
    `☐ Not rekt ☑ Harry Potter: The Half-Rekt Prince`,
    `☐ Not rekt ☑ Rekt Paper Scissors`,
    `☐ Not rekt ☑ RektCraft`,
    `☐ Not rekt ☑ Grand Rekt Auto V`,
    `☐ Not rekt ☑ Call of Rekt: Modern Reking 2`,
    `☐ Not rekt ☑ Legend of Zelda: Ocarina of Rekt`,
    `☐ Not rekt ☑ Rekt It Ralph`,
    `☐ Not rekt ☑ Left 4 Rekt`,
    `☐ Not rekt ☑ Pokemon: Fire Rekt`,
    `☐ Not rekt ☑ The Shawshank Rektemption`,
    `☐ Not rekt ☑ The Rektfather`,
    `☐ Not rekt ☑ The Rekt Knight`,
    `☐ Not rekt ☑ Fiddler on the Rekt`,
    `☐ Not rekt ☑ The Rekt Files`,
    `☐ Not rekt ☑ The Good, the Bad, and The Rekt`,
    `☐ Not rekt ☑ Forrekt Gump`,
    `☐ Not rekt ☑ The Silence of the Rekts`,
    `☐ Not rekt ☑ The Green Rekt`,
    `☐ Not rekt ☑ Gladirekt`,
    `☐ Not rekt ☑ Terminator 2: Rektment Day`,
    `☐ Not rekt ☑ The Rekt Knight Rises`,
    `☐ Not rekt ☑ The Rekt King`,
    `☐ Not rekt ☑ REKT-E`,
    `☐ Not rekt ☑ Citizen Rekt`,
    `☐ Not rekt ☑ Requiem for a Rekt`,
    `☐ Not rekt ☑ Star Wars: Episode VI - Return of the Rekt`,
    `☐ Not rekt ☑ Braverekt`,
    `☐ Not rekt ☑ Batrekt Begins`,
    `☐ Not rekt ☑ 2001: A Rekt Odyssey`,
    `☐ Not rekt ☑ The Wolf of Rekt Street`,
    `☐ Not rekt ☑ Rekt's Labyrinth`,
    `☐ Not rekt ☑ 12 Years a Rekt`,
    `☐ Not rekt ☑ Gravirekt`,
    `☐ Not rekt ☑ Finding Rekt`,
    `☐ Not rekt ☑ The Arekters`,
    `☐ Not rekt ☑ There Will Be Rekt`,
    `☐ Not rekt ☑ The Rekt Ultimatum`,
    `☐ Not rekt ☑ Shrekt`,
    `☐ Not rekt ☑ Rektal Exam`,
    `☐ Not rekt ☑ Rektium for a Dream`,
    `☐ Not rekt ☑ Erektile Dysfunction`
  ]

  defaults.forEach(async response => await $.db.set('rekt', { value: response }))

  $.log('rekt', `Done. ${defaults.length} default rekt responses added.`)
}

export default async function ($) {
  $.addCommand('rekt', { cooldown: 60 })

  $.addSubcommand('add', 'rekt', { permLevel: 1 })
  $.addSubcommand('remove', 'rekt', { permLevel: 1 })
  $.addSubcommand('edit', 'rekt', { permLevel: 1 })

  await $.db.addTable('rekt', true)

  if (!await $.db.countRows('rekt')) initResponses($)
}
