import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { PORT, ZABBIX_PREFIX_CONFIG } from './config'

const app = new Hono()

app.use(logger())

let cachedSessionCookie: any = {}

async function getSessionCookieByZabbixPrefix(prefix = 'o') {
  if (cachedSessionCookie[prefix]) {
    return cachedSessionCookie[prefix]
  }

  const config = JSON.parse(ZABBIX_PREFIX_CONFIG)
  const { username, password, login_url } = config[prefix]

  const body = new URLSearchParams({
    name: username,
    password,
    autologin: '1',
    enter: 'Sign in',
  })

  const response = await fetch(login_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'manual',
    body: body.toString(),
  })

  if (!response.ok && response.status !== 302) {
    throw new Error('Failed to log in and get session cookie')
  }

  const cookies = response.headers.get('set-cookie') || ''

  const matches = cookies.match(/(zbx_session(id)?=([^;]+))/g)
  const sessionCookie = matches ? matches[matches.length - 1] : ''

  cachedSessionCookie[prefix] = sessionCookie

  return sessionCookie
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/chart.php', async (c) => {
  const config = JSON.parse(ZABBIX_PREFIX_CONFIG)
  const queryParams = c.req.query()
  let prefix = 'o'
  const graphId = queryParams.graphid
  let realGraphId = graphId

  if (graphId.startsWith('m')) {
    prefix = 'm'
    realGraphId = graphId.substring(1)
  } else if (graphId.startsWith('j')) {
    prefix = 'j'
    realGraphId = graphId.substring(1)
  } else if (graphId.startsWith('b')) {
    prefix = 'b'
    realGraphId = graphId.substring(1)
  } else if (graphId.startsWith('o')) {
    prefix = 'o'
    realGraphId = graphId.substring(1)
  }

  const imageUrl = new URL(config[prefix].chart_base_url)
  Object.keys(queryParams).forEach((key) => {
    if (key === 'graphid') {
      imageUrl.searchParams.append(key, realGraphId)
      return
    }
    imageUrl.searchParams.append(key, queryParams[key])
  })

  try {
    const sessionCookie = await getSessionCookieByZabbixPrefix(prefix)

    const response = await fetch(imageUrl.toString(), {
      headers: {
        Cookie: sessionCookie,
      },
    })

    if (!response.ok) {
      return c.text('Failed to fetch the image', 500)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    c.header('Content-Type', 'image/png')

    return c.body(imageBuffer)
  } catch (error: any) {
    return c.text('Error: ' + error.message, 500)
  }
})

export default {
  port: Number(PORT),
  fetch: app.fetch,
}
