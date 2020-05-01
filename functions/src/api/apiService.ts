const fetch = require('node-fetch')

export async function getHtml(url: string): Promise<string> {
    const response = await fetch(url)
    return await response.text()
}
