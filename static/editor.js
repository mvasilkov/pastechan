(function () {
    const form = document.querySelector('form')
    const contents = document.querySelector('textarea')
    const token = document.querySelector('[name="token"]')
    const nonce = document.querySelector('[name="nonce"]')
    const save = document.querySelector('.btn-save')

    form.addEventListener('submit', function (event) {
        event.preventDefault()
    })

    save.addEventListener('click', function (event) {
        if (contents.value.trim() == '') {
            return
        }

        const decoded = jwt_decode(token.value)

        // nonce : salt : n : contents
        const buf = stringToUTF8(['oooo', decoded.salt, 'o', cleanupCRLF(contents.value)].join(':'))
        const pbuf = new DataView(buf.buffer)

        pbuf.setUint8(decoded.salt.length + 6, decoded.n)

        foo(0)

        function foo(n) {
            pbuf.setUint32(0, n, false)
            crypto.subtle.digest('SHA-256', buf).then(function (sha256sum) {
                sha256sum = new DataView(sha256sum)

                let k = 0
                for (let p = 0; p < 32; p += 4) {
                    const a = sha256sum.getUint32(p, false)
                    if (a == 0) {
                        k += 32
                        continue
                    }
                    k += 32 - Math.floor(Math.log2(a) + 1)
                    break
                }

                if (k >= decoded.n) {
                    nonce.value = n
                    form.submit()
                    return
                }
                foo(n + 1)
            })
        }
    })

    function cleanupCRLF(a) {
        return a.replace(/\r\n/g, '\n')
    }
})()
