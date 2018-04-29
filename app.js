const { ObjectId } = require('bson')
const cmark = require('cmark-emscripten')
const express = require('express')
const favicon = require('serve-favicon')
const jwt = require('jsonwebtoken')
const logger = require('morgan')
const nunjucks = require('nunjucks')

const gracefulShutdown = require('./stop')
const levelup = require('./levelup')
const nope = require('./nope')

const dev = ['development', undefined].includes(process.env.NODE_ENV)
const secret = 'potato'

const app = express()
const db = levelup(`${__dirname}/LevelDB`, { valueEncoding: 'json' })

nunjucks.configure(`${__dirname}/templates`, {
    autoescape: false,
    express: app,
    watch: dev,
})

app.use(logger(dev ? 'dev' : 'short'))
app.use(favicon(`${__dirname}/static/favicon.ico`))
app.use('/static', express.static(`${__dirname}/static`, { index: false }))

app.get('/', (req, res) => {
    const objectid = ObjectId()
    const token = jwt.sign({ salt: objectid.toString(), n: 3 }, secret, { expiresIn: '2 days' })
    const options = { token }
    res.format({
        ['text/html']() {
            res.render('index.html', options)
        },
        ['application/json']() {
            res.json(options)
        },
    })
})

app.get('/p/:id', (req, res) => {
    const { id } = req.params
    if (!id || id.length != 24) {
        nope.badPageId(res)
        return
    }
    db.get(id, (err, post) => {
        if (err) {
            nope.pageNotFound(res)
            return
        }
        const options = { contents: post.contents_html }
        res.format({
            ['text/html']() {
                res.render('page.html', options)
            },
            ['application/json']() {
                res.json(options)
            },
        })
    })
})

app.use(express.json({ strict: true }))
app.use(express.urlencoded({ extended: false }))

app.post('/p', (req, res) => {
    const { contents, token } = req.body
    if (!contents) {
        nope.badPageContents(res)
        return
    }

    let decoded
    try {
        decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    }
    catch (err) {
        nope.badPageContents(res)
        return
    }

    db.get(decoded.salt, (err, post) => {
        if (err) {
            /* Good path: page not found */
            if (err.notFound) {
                savePost(res, contents, decoded)
                return
            }
            /* Database error */
            nope.cannotSavePage(res)
            return
        }
        /* Page found */
        nope.badPageContents(res)
    })
})

function savePost(res, contents, decoded) {
    const post = {
        contents,
        contents_html: cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true }),
    }
    db.put(decoded.salt, post, err => {
        if (err) {
            nope.cannotSavePage(res)
            return
        }
        res.redirect(`/p/${decoded.salt}`)
    })
}

app.use((req, res, next) => {
    nope.pageNotFound(res)
})

function run() {
    const server = app.listen(process.env.PORT || 3000, 'localhost', () => {
        gracefulShutdown(server, db)

        const a = server.address()
        console.log(`Longpaste app listening on ${a.address} port ${a.port}`)
    })
}

// if __name__ == __main__
if (require.main === module) {
    run()
}

module.exports = {
    app,
    run,
}
