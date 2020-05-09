const fetch = require('node-fetch')

export const getHtml = async(url: string): Promise<string> => {
    const response = await fetch(url)
    return await response.text()
}
