const { ObjectId } = require('bson')
const express = require('express')
const levelup = require('./levelup')

const app = express()
const db = levelup(`${__dirname}/LevelDB`)

app.get('/', (req, res) => {
    res.send('I specifically requested the opposite of this')
})

app.get('/p/:id', (req, res) => {
    const { id } = req.params
    if (!id || id.length != 24) {
        res.sendStatus(404)
        return
    }
    db.get(id, (err, post) => {
        if (err) {
            res.sendStatus(404)
            return
        }
        res.send(post)
    })
})

app.use(express.json({ strict: true }))

app.post('/p', (req, res) => {
    const { contents } = req.body
    if (!contents) {
        res.sendStatus(404)
        return
    }
    const objectid = ObjectId()
    db.put(objectid.toString(), contents, err => {
        if (err) {
            res.sendStatus(404)
            return
        }
        res.redirect(`/p/${objectid}`)
    })
})

app.listen(3000, 'localhost', () => {
    console.log('Longpaste app listening on port 3000')
})
