export class RecentServers {
  readonly #list: Map<String, Date>;

  private constructor(list: [string, Date][]) {
    this.#list = new Map(list);
  }

  private top(n: number) {
    return Array.from(this.#list.entries()).sort(([_, a], [_1, b]) =>
      b.getTime() - a.getTime()
    ).slice(0, n).map(([address, last]) => ({ address, last }));
  }

  public list(top: number) {
    return new Set(this.top(top).map((s) => s.address.toLowerCase()));
  }

  public using(address: string) {
    this.#list.set(address.toLowerCase(), new Date());
    this.save();
  }

  private save() {
    localStorage.setItem(
      "recentServers",
      JSON.stringify(Array.from(this.#list.entries())),
    );
  }

  public static load() {
    return new RecentServers(
      (JSON.parse(localStorage.getItem("recentServers") ?? "[]") as [
        string,
        string,
      ][]).map(([address, last]) => [address, new Date(last)]),
    );
  }
}
