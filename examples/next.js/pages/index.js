import React from 'react'
import 'isomorphic-fetch'

const defaults = {
    headers: { accept: 'application/json' },
}

export default class extends React.Component {
    constructor(props) {
        super(props)

        this.submit = this.submit.bind(this)
    }

    static async getInitialProps({ req }) {
        // Development only
        const host = req ? 'http://' + req.headers['host'] : ''

        // Get the Longpaste challenge
        let ch = await fetch(`${host}/longpaste`, defaults)
        ch = await ch.json() // { token: '...' }
        return { host, ...ch }
    }

    render() {
        return <button onClick={this.submit}>hello, world</button>
    }

    async submit(event) {
        const { host } = this.props

        // Solve the challenge

        let res = await fetch(`${host}/longpaste/p`, { method: 'post', ...defaults })
        res = await res.json()
        console.log(res)
    }
}
