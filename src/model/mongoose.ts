import * as mongoose from "mongoose";
import {Global} from "../global";

const mongodb_url = Global.conf.mongodb_url;

mongoose.connect(mongodb_url, {useNewUrlParser: true});

mongoose.connection.on("connected", (err:any) => {
    console.log("Mongoose connection open to " + mongodb_url);
});

/**
 * 连接异常
 */
mongoose.connection.on("error", (err:any) => {
    console.log("Mongoose connection error to " + mongodb_url);
});

/**
 * 连接断开
 */
mongoose.connection.on("disconnected", (err:any) => {
    console.log("Mongoose connection disconnected to " + mongodb_url);
});
export default mongoose;
