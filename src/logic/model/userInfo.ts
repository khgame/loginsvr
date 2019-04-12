import * as mongoose from "mongoose";
import { Document, Schema } from "mongoose";

export interface IUserInfoDocument extends Document {
    _id: string;
    login_time: Date;
    serverInfo: [{server_identity: string}];
}

const UserInfoSchema = new Schema({
    _id: String,
    login_time: Date,
    serverInfo: { type: [Object], default: [] }
});

export const UserInfoModel = mongoose.model<IUserInfoDocument>("user_info", UserInfoSchema);
