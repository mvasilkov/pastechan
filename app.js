const { ObjectId } = require('bson')
const express = require('express')
const favicon = require('serve-favicon')
const logger = require('morgan')
const nunjucks = require('nunjucks')

const levelup = require('./levelup')
const nope = require('./nope')

const is_dev = ['development', undefined].includes(process.env.NODE_ENV)

const app = express()
const db = levelup(`${__dirname}/LevelDB`)

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
        res.render('page.html', { contents: post })
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
    const objectid = ObjectId()
    db.put(objectid.toString(), contents, err => {
        if (err) {
            nope.cannotSavePage(res)
            return
        }
        res.redirect(`/p/${objectid}`)
    })
})

app.listen(3000, 'localhost', () => {
    console.log('Longpaste app listening on port 3000')
})
