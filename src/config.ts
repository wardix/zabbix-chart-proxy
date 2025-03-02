export const PORT = process.env.PORT || 3000
export const ZABBIX_LOGIN_URL =
  process.env.ZABBIX_LOGIN_URL || 'https://www.zabbix.com/'
export const ZABBIX_LOGIN_DEFAULT_USERNAME =
  process.env.ZABBIX_LOGIN_DEFAULT_USERNAME || 'guest'
export const ZABBIX_LOGIN_DEFAULT_PASSWORD =
  process.env.ZABBIX_LOGIN_DEFAULT_PASSWORD || 'zabbix'
export const ZABBIX_CREDENTIAL_TIMEZONE_CONFIG =
  process.env.ZABBIX_CREDENTIAL_TIMEZONE_CONFIG || '{}'
export const ZABBIX_CREDENTIAL_BRANCH_CONFIG =
  process.env.ZABBIX_CREDENTIAL_BRANCH_CONFIG || '{}'
export const ZABBIX_CHART_BASE_URL =
  process.env.ZABBIX_CHART_BASE_URL || 'https://www.zabbix.com/chart2.php'
export const ZABBIX_LEGACY_CHART_BASE_URL =
  process.env.ZABBIX_LEGACY_CHART_BASE_URL || 'https://www.zabbix.com/chart.php'
