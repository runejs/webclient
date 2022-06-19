export class Player {

    readonly username: string;

    private readonly password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

}
