export class Node {
    id: number;
    prev: Node;
    next: Node;

    unlink() {
        this.prev.next = this.next;
        this.next.prev = this.prev;

        this.prev = null;
        this.next = null;
    }
}
