import {initDB} from "./db";
import {redis} from "./redis";

export * from './db';
export * from './redis';
export * from './validator';
export * from './assert';
export * from './logger';

export async function initServices(){
    redis();
    return await initDB();
}
