(function () {
    const form = document.querySelector('form')
    const contents = document.querySelector('textarea')

    form.addEventListener('submit', function (event) {
        if (contents.value.trim() == '') {
            event.preventDefault()
        }
    })
})()
