import * as mongoose from "mongoose";
import {Document, Schema} from "mongoose";
import {CounterHelper} from "./counter";
import {DGID} from "dgip-ts";
import {Crypto} from "@khgame/turtle";

export interface IGameDoc extends Document {
    _id: number;
    service_name: string;
    hash: string;
    admin_dgid: DGID;
    create_at: Date;

}

const GameSchema = new Schema({
    _id: {type: Number, alias: "game_id"},
    service_name: {type: String, unique: true},
    hash: String,
    admin_dgid: {type: String, unique: true, required: true},
    create_at: Date
});

GameSchema.pre("save", async function (next) {
    const doc = this as IGameDoc;
    if (doc.isNew) {
        const now = new Date();
        doc._id = await CounterHelper.incAndGet("dgid");
        doc.hash = Crypto.getMd5(doc._id + ":" + Math.random());
        doc.create_at = now;
        // todo: create account?
    }
    next();
});

export const GameModel = mongoose.model<IGameDoc>("games", GameSchema);

export class GameHelper {

    public static async create(service_name: string, admin_dgid: DGID) {
        return await GameModel.create({
            service_name,
            admin_dgid
        });
    }

    public static async getByName(service_name: string) {
        return await GameModel.find({service_name});
    }

    public static async list() {
        return await GameModel.find();
    }

}
