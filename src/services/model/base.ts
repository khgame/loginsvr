import * as mongoose from "mongoose";
require("mongoose-long")(mongoose);
import {Document, Schema} from "mongoose";

/** exports */
export {Document, Schema} from "mongoose";
export const {Long} = (Schema.Types as any);
export const db = mongoose;

export type UInt64 = string;
