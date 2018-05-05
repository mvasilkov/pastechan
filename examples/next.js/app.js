const express = require('express')
const { app: longApp, run } = require('longpaste')
const next = require('next')

const dev = ['development', undefined].includes(process.env.NODE_ENV)
const nextApp = next({ dev })

nextApp.prepare().then(function () {
    const app = express()

    app.use('/longpaste', longApp)

    app.get('*', nextApp.getRequestHandler())

    run(app)
})
