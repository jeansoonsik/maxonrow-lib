'use strict'

class Utils {
  static hashCode (str) {
    var result = []
    while (str.length >= 2) {
      result.push(parseInt(str.substring(0, 2), 16))
      str = str.substring(2, str.length)
    }

    return result
  }

  static toUTF8Array (str) {
    var utf8 = []
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i)
      if (charcode < 0x80) utf8.push(charcode)
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6),
          0x80 | (charcode & 0x3f))
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f))
      } else {
        // surrogate pair
        i++
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff)) + 0x010000
        utf8.push(0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f))
      }
    }
    return utf8
  }

  static fromUTF8Array (data) { // array of bytes
    var str = ''
    var i

    for (i = 0; i < data.length; i++) {
      var value = data[i]

      if (value < 0x80) {
        str += String.fromCharCode(value)
      } else if (value > 0xBF && value < 0xE0) {
        str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F)
        i += 1
      } else if (value > 0xDF && value < 0xF0) {
        str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F)
        i += 2
      } else {
        // surrogate pair
        var charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000

        str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00)
        i += 3
      }
    }

    return str
  }

  static sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static makeUniqueString (length) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }
}

module.exports = Utils
