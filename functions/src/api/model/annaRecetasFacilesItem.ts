import { Item } from "./item"

export class AnnaRecetasFacilesItem implements Item {
    private site: string = "www.annarecetasfaciles.com"
    detailUrl?: string
    title?: string
    thumbnail?: string

    getSite(): string {
        return this.site
    }
}
