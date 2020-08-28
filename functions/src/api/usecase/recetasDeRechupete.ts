import { parse } from "node-html-parser"
import { getHtml } from "../apiService"
import { RecetasDeRechupeteItem } from "../model/recetasDeRechupeteItem"
import { Item } from "../model/Item"
import { bannedTitles } from "../model/bannedTitles"
import { queryParam } from "../.."


const baseUrl = 'https://www.recetasderechupete.com/page/'

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
    const items = new Array<RecetasDeRechupeteItem>()
    const root = parse(html) as unknown as HTMLElement
    const nodes = root.querySelectorAll('.itemreceta')
    
    nodes.forEach((parentNode) => {
        
        const detailUrl = (parentNode.querySelector('a') as HTMLElement)?.getAttribute('href') || undefined
        const thumbnail = (parentNode.querySelector('a')?.querySelector('img') as HTMLElement)?.getAttribute('src') || undefined
        const title = (parentNode.querySelector('a')?.querySelector('h2') as HTMLElement)?.innerHTML || undefined

        if (title && !containsSpam(title) && contains(title, queryParam)) {
            const item = new RecetasDeRechupeteItem()
            item.detailUrl = detailUrl
            item.title = title
            item.thumbnail = thumbnail
            items.push(item)
        }
    })
    recipes.push(...items)
    const next = root.querySelector('.next.page-numbers')?.getAttribute('href')?.replace(baseUrl, '') || undefined
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
