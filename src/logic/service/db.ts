import * as mongoose from "mongoose";
import {Global} from "../../global";

export function initDB() {
    const {host, port, database, username, password} = Global.conf.mongo;
    const authStr = username ? `${username}${password ? ":" + password : ""}@` : "";
    const mongodbUrl = `mongodb://${authStr}${host}${port ? ":" + port : ""}/${database || "khgame_login_svr"}`;
    mongoose.connect(mongodbUrl, {useNewUrlParser: true});
    mongoose.connection.on("connected", (err: any) => {
        console.log("Mongoose connection open to " + mongodbUrl);
    });
    mongoose.connection.on("error", (err: any) => {
        console.log("Mongoose connection error to " + mongodbUrl);
    });
    mongoose.connection.on("disconnected", (err: any) => {
        console.log("Mongoose connection disconnected to " + mongodbUrl);
    });
    return mongoose;
}
