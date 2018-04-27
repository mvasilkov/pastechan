const termSignals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGUSR2']

function doShutdown(server, db) {
    let errorCode = 0

    server.close(err => {
        if (err) console.error(err)

        db.close(err => {
            if (err) console.error(err)

            console.log('Goodbye')
            process.exit(errorCode)
        })
    })
}

function gracefulShutdown(server, db) {
    let poweringDown = false

    function handler(name) {
        if (poweringDown) {
            console.log(`Got ${name} while powering down`)
            return
        }
        poweringDown = true
        console.log(`Got ${name}. Powering down`)
        doShutdown(server, db)
    }

    termSignals.forEach(name => process.once(name, handler))
}

module.exports = gracefulShutdown
