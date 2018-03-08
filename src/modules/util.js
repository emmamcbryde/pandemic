export default {

  jstr (s) {
    return JSON.stringify(s, null)
  },

  downloadFile (fname, s) {
    let data = 'text/json;charset=utf-8,' + encodeURIComponent(s)

    let a = document.createElement('a')
    a.href = 'data:' + data
    a.download = 'data.json'
    a.innerHTML = 'download JSON'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  },

  delay (time) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(time) }, time)
    })
  },

  makeArray (n, v) {
    let result = []
    for (let i = 0; i < n; i += 1) {
      result.push(v)
    }
    return result
  }

}
