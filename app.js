const { ObjectId } = require('bson')
const cmark = require('cmark-emscripten')
const express = require('express')
const favicon = require('serve-favicon')
const logger = require('morgan')
const nunjucks = require('nunjucks')

const gracefulShutdown = require('./stop')
const levelup = require('./levelup')
const nope = require('./nope')

const is_dev = ['development', undefined].includes(process.env.NODE_ENV)

const app = express()
const db = levelup(`${__dirname}/LevelDB`, { valueEncoding: 'json' })

nunjucks.configure(`${__dirname}/templates`, {
    autoescape: false,
    express: app,
    watch: is_dev,
})

app.use(logger(is_dev ? 'dev' : 'short'))
app.use(favicon(`${__dirname}/static/favicon.ico`))
app.use('/static', express.static(`${__dirname}/static`, { index: false }))

app.get('/', (req, res) => {
    res.render('index.html')
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
        res.render('page.html', { contents: post.contents_html })
    })
})

app.use(express.json({ strict: true }))
app.use(express.urlencoded({ extended: false }))

app.post('/p', (req, res) => {
    const { contents } = req.body
    if (!contents) {
        nope.badPageContents(res)
        return
    }
    const post = {
        contents,
        contents_html: cmark.markdownToHtml(contents, { hardbreaks: true, safe: true, validateUTF8: true }),
    }
    const objectid = ObjectId()
    db.put(objectid.toString(), post, err => {
        if (err) {
            nope.cannotSavePage(res)
            return
        }
        res.redirect(`/p/${objectid}`)
    })
})

app.use((req, res, next) => {
    nope.pageNotFound(res)
})

const server = app.listen(process.env.PORT || 3000, 'localhost', () => {
    gracefulShutdown(server, db)

    const a = server.address()
    console.log(`Longpaste app listening on ${a.address} port ${a.port}`)
})
