const axios = require('axios')
const words = require('words-en').split('\n')

const PARK_POINT = 'https://park.io/domains/index/all.json?limit=1000'
const SP_ENDPOINT = 'https://api.sparkpost.com/api/v1/transmissions'
const SP_KEY = 'd5ad8972' + process.env.SP_KEY_SUFFIX

const queryAndMail = async () => {
    const { data } = await axios.get(PARK_POINT)

    const intrests = data.domains
        .filter(d => {
            return d.name.length < 6 || words.includes(d.name.split('.')[0])
        })
        .filter(d => {
            return ['io', 'sh'].includes(d.tld)
        })
        .reduce((results, curr) => {
            if (!results[0]) {
                results.push(curr)
            } else if (curr.date_available === results[0].date_available) {
                results.push(curr)
            }
            return results
        }, [])

    const mail = {
        from: { name: 'Domain Notification', email: 'noreply@amio.cn' },
        subject: `${intrests.length} Domains Available @ ${intrests[0].date_available}`,
        text: formatText(intrests)
    }

    await sendMail(mail)

    return mail
}

const formatText = ds => {
    return ds
        .map(d => `${d.date_available}: ${d.name}`)
        .join('\n')
}

const sendMail= async ({to, from, subject, text} = {}) => {
    const envelop = {
        content: {
            "from": from || "noreply@amio.cn",
            "subject": subject || "Hello from Amio",
            "text": text || "Sword of Omens, give me sight BEYOND sight!",
        },
        recipients: [
            { "address": to || "amio.cn@gmail.com" }
        ]
    }

    return await axios.post(SP_ENDPOINT, envelop, {
        headers: {
            'Authorization': SP_KEY,
            'Content-Type': 'application/json'
        }
    }).then(res => res.data)

}

async function main () {
  if (!process.env.SP_KEY_SUFFIX) {
      return console.error('SP_KEY_SUFFIX required.')
  }

  const result = await queryAndMail()

  console.log('SENT', result)
}

main()
