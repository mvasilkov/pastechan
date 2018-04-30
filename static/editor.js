(function () {
    const form = document.querySelector('form')
    const contents = document.querySelector('textarea')
    const save = document.querySelector('.btn-save')

    form.addEventListener('submit', function (event) {
        event.preventDefault()
    })

    save.addEventListener('click', function (event) {
        if (contents.value.trim() == '') {
            return
        }
    })
})()
