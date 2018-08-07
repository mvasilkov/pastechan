/* This file is part of the Longpaste project.
 * https://github.com/mvasilkov/longpaste
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const assert = require('assert')
const ObjectId = require('bson/lib/bson/objectid')
const cmark = require('cmark-emscripten')
const cookieParser = require('cookie-parser')
const format = require('date-fns/format')
const express = require('express')
const favicon = require('serve-favicon')
const jwt = require('jsonwebtoken')
const logger = require('morgan')
const nunjucks = require('nunjucks')

const dataview = require('./app/dataview')
const gracefulShutdown = require('./app/stop')
const levelup = require('./app/levelup')
const nope = require('./app/nope')
const pow = require('./app/pow')
const { makePageSecret, badPageId, badPageSecret, cleanupCRLF } = require('./app/functions')

/* We use the following environment variables:
 * APP_SECRET: same as Django's SECRET_KEY
 * LEVELDB: path to the LevelDB location
 * NODE_ENV: can be 'development' or 'production'
 * PORT: defaults to 3000
 * DATAVIEW: enable the dataview app in production */

const dev = ['development', undefined].includes(process.env.NODE_ENV)
const appSecret = dev ? 'potato' : process.env.APP_SECRET

assert(appSecret, 'APP_SECRET is required')

const app = express()
const db = levelup(process.env.LEVELDB || `${__dirname}/LevelDB`, { keyEncoding: 'hex', valueEncoding: 'json' })

app.enable('case sensitive routing')
app.disable('x-powered-by')
app.set('trust proxy', 'loopback')
// Application-specific settings
app.set('app name', 'pastechan.org')
app.set('default title', 'pastechan.org, an anonymous quasi-blogging platform')

const nenv = nunjucks.configure(`${__dirname}/templates`, {
    autoescape: false,
    express: app,
    watch: dev,
})

nenv.addFilter('pubdate', function pubdate(a) {
    return format(a, 'YYYY-MM-DD')
})

app.use(function frameOptions(req, res, next) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    next()
})
app.use(logger(dev ? 'dev' : 'short'))
app.use(favicon(`${__dirname}/static/favicon.ico`))
app.use('/static', express.static(`${__dirname}/static`, { index: false }))

app.get('/', (req, res) => {
    const pageId = (new ObjectId).toString()
    const token = jwt.sign({ salt: pageId, n: pow.difficulty() }, appSecret, { expiresIn: '2 days' })
    const options = { token }
    res.format({
        ['text/html']() {
            options.title = app.get('default title')
            res.render('editor.html', options)
        },
        ['application/json']() {
            res.json(options)
        },
    })
})

app.use(cookieParser(`${appSecret}cookie`))

app.get('/p/:pageId', (req, res) => {
    const { pageId } = req.params
    if (badPageId(pageId)) {
        nope.badPageId(res)
        return
    }
    db.get(pageId, (err, post) => {
        if (err) {
            nope.pageNotFound(res)
            return
        }
        const options = { contents: post.contents_html, created: post.created, updated: post.updated }
        if (cookieSalt(req) == pageId) {
            options.change = `/p/${pageId}/${post.secret}`
        }
        res.format({
            ['text/html']() {
                options.title = app.get('default title')
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
            const decoded = jwt.verify(change, appSecret, { algorithms: ['HS256'] })
            return decoded.salt
        }
        catch (err) {
        }
    }
}

app.get('/p/:pageId/:pageSecret', (req, res) => {
    const { pageId, pageSecret } = req.params
    if (badPageId(pageId) || badPageSecret(pageSecret)) {
        nope.badPageId(res)
        return
    }
    db.get(pageId, (err, post) => {
        if (err) {
            nope.pageNotFound(res)
            return
        }
        if (pageSecret != post.secret) {
            nope.cannotChangePage(res)
            return
        }
        const token = jwt.sign({ salt: pageId, n: pow.difficulty() }, appSecret, { expiresIn: '2 days' })
        const options = { token, contents: post.contents, secret: pageSecret }
        res.format({
            ['text/html']() {
                options.title = app.get('default title')
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
    const { token, nonce, secret: pageSecret } = req.body

    let { contents } = req.body
    if (!contents) {
        nope.badPageContents(res)
        return
    }
    contents = cleanupCRLF(contents)

    let pageId, n
    try {
        const decoded = jwt.verify(token, appSecret, { algorithms: ['HS256'] })
        pageId = decoded.salt
        n = decoded.n
    }
    catch (err) {
        nope.badPageContents(res)
        return
    }

    if (badPageId(pageId)) {
        nope.badPageContents(res)
        return
    }

    if (!pow.validate(nonce, pageId, n, contents)) {
        nope.badPageContents(res)
        return
    }

    db.get(pageId, (err, post) => {
        if (err) {
            /* Good path: page not found */
            if (err.notFound) {
                savePost(res, pageId, contents)
                return
            }
            /* Database error */
            nope.cannotSavePage(res)
            return
        }
        /* Page found */
        if (pageSecret == post.secret) {
            updatePost(res, post, pageId, contents)
            return
        }
        nope.badPageContents(res)
    })
})

function savePost(res, pageId, contents) {
    const created = Date.now()
    const post = {
        contents,
        contents_html: cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true }),
        created,
        updated: created,
    }
    makePageSecret(pageSecret => {
        if (pageSecret) {
            post.secret = pageSecret
            /* Set cookie for editing */
            const token = jwt.sign({ salt: pageId }, appSecret, { expiresIn: '256 seconds' })
            res.cookie('change', token, { httpOnly: true, secure: dev == false })
        }
        db.put(pageId, post, err => {
            if (err) {
                nope.cannotSavePage(res)
                return
            }
            res.redirect(`${getMountPath()}/p/${pageId}`)
        })
    })
}

function updatePost(res, post, pageId, contents) {
    if (contents == post.contents) {
        /* No changes */
        res.redirect(`${getMountPath()}/p/${pageId}`)
        return
    }
    post.contents = contents
    post.contents_html = cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true })
    post.updated = Date.now()
    db.put(pageId, post, err => {
        if (err) {
            nope.cannotSavePage(res)
            return
        }
        res.redirect(`${getMountPath()}/p/${pageId}`)
    })
}

function getMountPath() {
    const p = Array.isArray(app.mountpath) ? app.mountpath[0] : app.mountpath
    if (!p || p == '/') return ''
    return p
}

app.get('/options', (req, res) => {
    res.render('options.html')
})

if (dev || process.env.DATAVIEW) {
    dataview.init(app, db)
}

app.get('/-debug-ip', (req, res) => {
    res.send(req.ip)
})

app.use((req, res, next) => {
    nope.pageNotFound(res)
})

function run(app) {
    const server = app.listen(process.env.PORT || 3000, 'localhost', () => {
        gracefulShutdown(server, db)

        const a = server.address()
        const appName = app.get('app name') || 'Longpaste'
        console.log(`${appName} app listening on ${a.address} port ${a.port}`)
    })
}

// if __name__ == __main__
if (require.main === module) {
    run(app)
}

module.exports = {
    app,
    run,
}
