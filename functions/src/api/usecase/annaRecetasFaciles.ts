import { parse } from "node-html-parser"
import { getHtml } from "../apiService"
import { AnnaRecetasFacilesItem } from "../model/annaRecetasFacilesItem"
import { Item } from "../model/Item"
import { bannedTitles } from "../model/bannedTitles"
import { queryParam } from "../.."


const baseUrl = 'https://www.annarecetasfaciles.com/page/'

export const getItems = async(query: string, recipes: Array<Item>): Promise<Array<Item>> => {
    const html = await getHtml(baseUrl + query)
    return await parseHtml(html, recipes)
}

const parseHtml = async(html: string, recipes: Array<Item>): Promise<Array<Item>> => {
    const result: { items: Array<Item>, next?: string } = parseItems(html, recipes)
    if (result.next) { await getItems(result.next, recipes) }
    return recipes
}

const parseItems = (html: string, recipes: Array<Item>): { items: Array<Item>, next?: string } => {
    const items = new Array<AnnaRecetasFacilesItem>()
    const root = parse(html) as unknown as HTMLElement
    const nodes = root.querySelectorAll('.post-featured-image')
    nodes.forEach((parentNode) => {
        const prefix = 'https://annarecetasfaciles.com'
        let detailUrl = (parentNode.querySelector('a') as HTMLElement)?.getAttribute('href') || undefined
        if (detailUrl) { detailUrl = prefix.concat(detailUrl) }
        let thumbnail = (parentNode.querySelector('a')?.querySelector('img') as HTMLElement)?.getAttribute('src') || undefined
        if (thumbnail) { thumbnail = prefix.concat(thumbnail) }
        const title = (parentNode.querySelector('a') as HTMLElement)?.getAttribute('title') || undefined

        if (title && !containsSpam(title) && contains(title, queryParam)) {
            const item = new AnnaRecetasFacilesItem()
            item.detailUrl = detailUrl
            item.title = title
            item.thumbnail = thumbnail
            items.push(item)
        }
    })
    recipes.push(...items)
    const next = root.querySelector('.nextpostslink')?.getAttribute('href') || undefined
    return { items, next }
}

const containsSpam = (title: string): boolean => {
    const hasSpam = (spam: string) =>
    title.toLowerCase().removeDiacritics().includes(spam.toLowerCase())
    return Object.values(bannedTitles).some(hasSpam)
}

const contains = (title: string, keyword: string): boolean => {
    const normalizedTitle = title.toLowerCase().removeDiacritics()
    const normalizedKeyword = keyword.toLowerCase().removeDiacritics()
    const includesKeywords = (component: string) => normalizedTitle.includes(component)
    return normalizedKeyword.split(' ').every(includesKeywords)
}
