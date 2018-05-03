'use strict'

const warningCloseButton = document.querySelector('.warning-close')

if (warningCloseButton) {
    warningCloseButton.addEventListener('click', function (event) {
        document.body.classList.remove('show-warning')
    })
}
