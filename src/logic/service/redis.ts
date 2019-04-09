import {Global} from "../../global";
import * as IORedis from "ioredis";

let redisInstance: IORedis.Redis;
export const redis = () => {
    return redisInstance || (redisInstance = new IORedis(Global.conf.redis));
};
export const getRedisKey =
    (...keys: string[]) =>
        keys.reduce((_, s) => `${_}:${s}`, Global.conf.redis.app_key || 'KHGame_default_redisKey');

