import { Hono } from 'hono'
import { logger } from 'hono/logger'
import {
  PORT,
  ZABBIX_CHART_BASE_URL,
  ZABBIX_CREDENTIAL_TIMEZONE_CONFIG,
  ZABBIX_LEGACY_CHART_BASE_URL,
  ZABBIX_LOGIN_DEFAULT_PASSWORD,
  ZABBIX_LOGIN_DEFAULT_USERNAME,
  ZABBIX_LOGIN_URL,
} from './config'

const app = new Hono()

app.use(logger())

let cachedSessionCookie: any = {}

async function getSessionCookieByTimezone(timezone = 'Asia/Jakarta') {
  if (cachedSessionCookie[timezone]) {
    return cachedSessionCookie[timezone]
  }

  const config = JSON.parse(ZABBIX_CREDENTIAL_TIMEZONE_CONFIG)
  const { username, password } = config[timezone]
    ? config[timezone]
    : {
        username: ZABBIX_LOGIN_DEFAULT_USERNAME,
        password: ZABBIX_LOGIN_DEFAULT_PASSWORD,
      }

  const body = new URLSearchParams({
    name: username,
    password,
    autologin: '1',
    enter: 'Sign in',
  })

  const response = await fetch(ZABBIX_LOGIN_URL, {
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

  const [sessionCookie] = cookies.split('; ')
  cachedSessionCookie[timezone] = sessionCookie

  return sessionCookie
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/chart.php', async (c) => {
  const queryParams = c.req.query()
  let chartBaseUrl = ZABBIX_LEGACY_CHART_BASE_URL
  const graphId = queryParams.graphid
  let realGraphId = graphId
  let timezone = 'Asia/Jakarta'
  if (graphId.startsWith('m')) {
    timezone = 'Asia/Makassar'
    chartBaseUrl = ZABBIX_CHART_BASE_URL
    realGraphId = graphId.substring(1)
  } else if (graphId.startsWith('j')) {
    chartBaseUrl = ZABBIX_CHART_BASE_URL
    realGraphId = graphId.substring(1)
  }

  const imageUrl = new URL(chartBaseUrl)
  Object.keys(queryParams).forEach((key) => {
    if (key === 'graphid') {
      imageUrl.searchParams.append(key, realGraphId)
      return
    }
    imageUrl.searchParams.append(key, queryParams[key])
  })

  try {
    const sessionCookie = await getSessionCookieByTimezone(timezone)

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
