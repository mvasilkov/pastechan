(function () {
    const form = document.getElementsByTagName('form')[0]
    const textarea = document.getElementsByTagName('textarea')[0]

    form.addEventListener('submit', function (event) {
        if (textarea.value.trim() == '') {
            event.preventDefault()
        }
    })
})()
