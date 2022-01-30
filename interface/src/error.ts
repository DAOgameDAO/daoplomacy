import * as types from "./types";

export class GameError extends Error {}

export class UnknownProvince extends GameError {
    constructor(province: types.Province, coast?: types.Coast) {
        let coastSuffix = "";
        if (coast) {
            coastSuffix = "/" + coast.toString().toLowerCase()[0] + "c";
        }
        super("Unknown province " + province + coastSuffix)
    }
}
