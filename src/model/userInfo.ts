import {Document, Schema} from "mongoose";
import mongoose from "./mongoose";

export interface IUserInfoDocument extends Document{
    _id:string,
    login_time:Date,
}

const UserInfoSchema = new Schema({
    _id:String,
    login_time:Date
})

export const UserInfoModel = mongoose.model<IUserInfoDocument>("userInfo",UserInfoSchema);