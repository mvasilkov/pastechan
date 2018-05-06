'use strict'

const { solve } = require('./pow')

const form = document.querySelector('form')
const contents = document.querySelector('textarea')
const tokenInput = document.querySelector('[name="token"]')
const nonceInput = document.querySelector('[name="nonce"]')
const save = document.querySelector('.btn-save')
const modalOverlay = document.querySelector('.modal-overlay')

form.addEventListener('submit', function (event) {
    event.preventDefault()
})

save.addEventListener('click', function (event) {
    if (contents.value.trim() == '') return

    const decoded = jwt_decode(tokenInput.value)

    disableUI()
    solve(decoded.salt, decoded.n, cleanupCRLF(contents.value), nonce => {
        enableUI()
        nonceInput.value = nonce
        form.submit()
    })
})

function cleanupCRLF(a) {
    return a.replace(/\r\n/g, '\n')
}

function disableUI() {
    // modalOverlay.style.display = ''
    contents.disabled = save.disabled = true
}

function enableUI() {
    modalOverlay.style.display = 'none'
    contents.disabled = save.disabled = false
    // contents.focus()
}
