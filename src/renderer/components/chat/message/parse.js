const emoteMap = new Map()

export function parseBTTVEmotes (message) {
  for (const [k, v] of emoteMap) {
    const img = `<img class="emoticon" src=${v}>`
    message = message.replace(k, img)
  }

  return message
}

export function parseTwitchEmotes (message, emotes, self) {
  if (!self) {
    // convert the message string to an array
    let splitText = message.split('')

    // emotes = { '25': [ '0-4' ] }
    for (const emote in emotes) {
      if (!emotes.hasOwnProperty(emote)) continue

      const set = emotes[emote]
      for (const location of set) {
        // location is the string value in each emote's array, ie. '0-4'
        // each digit is an offset from total message start
        if (typeof location === 'string') {
          // split the location into its two values
          let pair = location.split('-')
          const emoteStart = parseInt(pair[0])
          const emoteEnd = parseInt(pair[1])
          if (typeof emoteStart !== 'number' || typeof emoteEnd !== 'number') {
            console.log('Emote location invalid:: ', typeof emoteStart, typeof emoteEnd)
            continue
          }

          // create an empty array between the two values
          const length = (emoteEnd - emoteStart) + 1
          if (length < 1) continue
          const empty = new Array(length).fill('')

          // add the empty array between the two values
          splitText = splitText
            .slice(0, emoteStart)
            .concat(empty)
            .concat(splitText.slice(emoteEnd + 1, splitText.length))

          // replace each instance of an emote with an HTML image node
          const img = `<img class="emoticon" src="//static-cdn.jtvnw.net/emoticons/v1/${emote}/1.0">`
          splitText.splice(emoteStart, 1, img)
        }
      }
    }

    // convert the message back to a string
    return splitText.join('')
  } else {
    let output = ''

    const text = message.split(' ')
    for (const word of text) {
      if (emoteMap.has(word)) {
        console.log(emoteMap.get(word))
        output += `<img class="emoticon" src="${emoteMap.get(word)}">`
      } else {
        output += word + ' '
      }
    }

    return output
  }
}
