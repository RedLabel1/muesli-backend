import { Item } from "./item"

export class RecetasDeRechupeteItem implements Item {
    private site: string = "www.recetasderechupete.com"
    detailUrl?: string
    title?: string
    thumbnail?: string

    getSite(): string {
        return this.site
    }
}
