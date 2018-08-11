(function () {
    'use strict'

    const APP_KEY = 'pcoqafxh1ze092a'
    const PAGE_URL = location.origin + '/options'

    setState('initializing')
    const storage = new ClientStorage('pastechan.json', {
        clientId: APP_KEY,
        accessToken: localStorage.getItem('access_token'),
        saveAccessToken: accessToken => {
            localStorage.setItem('access_token', accessToken)
        },
    })
    storage.authenticated().then(authenticated => {
        if (authenticated) {
            setState('authenticated')
        }
        else {
            setState('not-authenticated')
            setAuthLink(storage.authenticationUrl(PAGE_URL))
        }
    })

    function setState(state) {
        [].slice.call(document.getElementsByClassName('state')).forEach(a => {
            a.style.display = a.classList.contains(`state-${state}`) ? 'block' : 'none'
        })
    }
    function setAuthLink(url) {
        document.getElementById('client-storage-auth-link').href = url
    }
})()
