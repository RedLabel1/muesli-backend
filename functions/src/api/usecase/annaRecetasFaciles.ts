import { getHtml } from "../apiService"
import { AnnaRecetasFacilesItem } from "../model/annaRecetasFacilesItem"
import { Item } from "../model/Item"
import { bannedTitles } from "../model/bannedTitles"
import { parse } from "node-html-parser"


const baseUrl = 'https://www.annarecetasfaciles.com/'
let searchAppend = '?s='

export const getItems = async(query?: string): Promise<string> => {
    return getHtml(baseUrl + searchAppend + query)
}

export function parseHtml(html: string): Array<Item> {
    const items = new Array<Item>()
    const result: { items: Array<Item>, next?: string } = parseItems(html)
    return items.concat(result.items)
}

function parseItems(html: string): { items: Array<Item>, next?: string } {
    const items = new Array<AnnaRecetasFacilesItem>()
    const root = parse(html) as unknown as HTMLElement
    const nodes = root.querySelectorAll('.post-featured-image')
    nodes.forEach((parentNode) => {
        const detailUrl = (parentNode.firstChild as HTMLElement).getAttribute('href') || undefined
        const title = (parentNode.firstChild as HTMLElement).getAttribute('title') || undefined
        const thumbnail = (parentNode.firstChild?.firstChild as HTMLElement).getAttribute('src') || undefined

        let nodeContainsSpam = Object.values(bannedTitles).some(spam => {
            return title?.toLowerCase().includes(spam.toLowerCase())
        })
        
        if (!nodeContainsSpam) {
            const item = new AnnaRecetasFacilesItem()
            item.detailUrl = detailUrl
            item.title = title
            item.thumbnail = thumbnail
            items.push(item)
        }
    })
    const next = root.querySelector('.nextpostlink')?.getAttribute('href') || undefined
    return { items /*, next */ }
}
