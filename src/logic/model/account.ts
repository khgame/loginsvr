import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { CounterHelper } from "./counter";

export enum AUTH_VISIT {
    NORMAL = 1,
    BLACK_LST = 2,
    WHITE_LST = 3,
}

export enum AUTH_GM {
    NONE = 0,
    READ = 1,
    WRITE = 2,
    ADMIN = 3,
}

export interface IAccountRegInfo {
    ip?: string;
    channel?: string;
    device?: string;
}

export interface IAccountLoginInfo {
    ip?: string;
    channel?: string;
    device?: string;
}

export interface IAccountDocument extends Document {
    _id: number;
    // validate
    passport: string;
    email: string;
    phone: string;
    password: string;
    // auth
    auth_visit: AUTH_VISIT;
    auth_gm: AUTH_GM;
    // info
    reg_info: IAccountRegInfo;
    login_info: IAccountLoginInfo;

    login_ip: string;
    login_at: Date;
    create_at: Date;

    // server: string;
}

const AccountSchema = new Schema({
    _id: { type: Number, alias: "l2id" },

    passport: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,

    auth_visit: { type: Number, enum: [1, 2, 3], default: 1 },
    auth_gm: { type: Number, enum: [0, 1, 2, 3], default: 1 },

    reg_info: {
        ip: String,
        channel: String,
        device: String,
    },
    login_info: {
        ip: String,
        channel: String,
        device: String,
    },

    login_at: Date,
    create_at: Date,
});

AccountSchema.index({ passport: 1 });
AccountSchema.index({ phone: 1 });

AccountSchema.pre("save", async function (next) {
    const doc = this as IAccountDocument;
    if (doc.isNew) {
        const now = new Date();
        const value = await CounterHelper.incAndGet("l2id");
        doc._id = 20000000 + value;
        doc.create_at = doc.create_at || now;
        doc.login_at = doc.login_at || now;
        doc.auth_visit = doc.auth_visit || AUTH_VISIT.NORMAL;
        doc.auth_gm = doc.auth_gm || AUTH_GM.NONE;
        doc.passport = doc.passport || "";
        doc.email = doc.email || "";
        doc.phone = doc.phone || "";
        doc.reg_info = doc.reg_info || {};
        doc.login_info = doc.login_info || {};
    }
    next();
});

export const AccountModel = mongoose.model<IAccountDocument>("l2account", AccountSchema);

export class AccountHelper {

    static async getByUID(l2id: number): Promise<IAccountDocument | null> {
        return await AccountModel.findOne({ _id: l2id });
    }

    static async getByPassport(passport: string): Promise<IAccountDocument | null> {
        return await AccountModel.findOne({ passport: passport });
    }

    static async getByEmail(email: string): Promise<IAccountDocument | null> {
        return await AccountModel.findOne({ email: email });
    }


}
