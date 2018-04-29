const { ObjectId } = require('bson')
const cmark = require('cmark-emscripten')
const cookieParser = require('cookie-parser')
const express = require('express')
const favicon = require('serve-favicon')
const jwt = require('jsonwebtoken')
const logger = require('morgan')
const nunjucks = require('nunjucks')

const gracefulShutdown = require('./stop')
const levelup = require('./levelup')
const nope = require('./nope')
const { makeSecret, badPageId, badPageSecret } = require('./util')

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
            res.render('editor.html', options)
        },
        ['application/json']() {
            res.json(options)
        },
    })
})

app.use(cookieParser(`${secret}cookie`))

app.get('/p/:id', (req, res) => {
    const { id } = req.params
    if (badPageId(id)) {
        nope.badPageId(res)
        return
    }
    db.get(id, (err, post) => {
        if (err) {
            nope.pageNotFound(res)
            return
        }
        const options = { contents: post.contents_html }
        if (cookieSalt(req) == id) {
            options.change = `/p/${id}/${post.secret}`
        }
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

function cookieSalt(req) {
    const { change } = req.cookies
    if (change) {
        try {
            const decoded = jwt.verify(change, secret, { algorithms: ['HS256'] })
            return decoded.salt
        }
        catch (err) {
        }
    }
}

app.get('/p/:id/:secret', (req, res) => {
    const { id, secret: pSecret } = req.params
    if (badPageId(id) || badPageSecret(pSecret)) {
        nope.badPageId(res)
        return
    }
    db.get(id, (err, post) => {
        if (err) {
            nope.pageNotFound(res)
            return
        }
        if (pSecret != post.secret) {
            nope.badPageId(res)
            return
        }
        const token = jwt.sign({ salt: id, n: 3 }, secret, { expiresIn: '2 days' })
        const options = { token, contents: post.contents, secret: pSecret }
        res.format({
            ['text/html']() {
                res.render('editor.html', options)
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
    const { contents, token, secret: pSecret } = req.body
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
        if (pSecret == post.secret) {
            updatePost(res, post, contents, decoded)
            return
        }
        nope.badPageContents(res)
    })
})

function savePost(res, contents, { salt }) {
    const post = {
        contents,
        contents_html: cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true }),
    }
    makeSecret(pSecret => {
        if (pSecret) {
            post.secret = pSecret
            /* Set cookie for editing */
            const token = jwt.sign({ salt }, secret, { expiresIn: '256 seconds' })
            res.cookie('change', token, { httpOnly: true, secure: dev == false })
        }
        db.put(salt, post, err => {
            if (err) {
                nope.cannotSavePage(res)
                return
            }
            res.redirect(`/p/${salt}`)
        })
    })
}

function updatePost(res, post, contents, { salt }) {
    if (contents == post.contents) {
        res.redirect(`/p/${salt}`)
        return
    }
    post.contents = contents
    post.contents_html = cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true })
    db.put(salt, post, err => {
        if (err) {
            nope.cannotSavePage(res)
            return
        }
        res.redirect(`/p/${salt}`)
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
