interface String {
    removeDiacritics(): string;
}

String.prototype.removeDiacritics = function(): string {
    // tslint:disable-next-line:no-invalid-this
    return this.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}
