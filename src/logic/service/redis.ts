import {Global} from "../../global";
import * as IORedis from "ioredis";

let redisInstance: IORedis.Redis;
export const redis = () => {
    return redisInstance || (redisInstance = new IORedis(Global.conf.redis));
};

export const getRedisKey =
    (...keys: string[]) =>
        keys.reduce((_, s) => `${_}:${s}`);

export const redisLock =
    async <T>(key: string,
              lockerIdentity: string,
              bWaitForLock: boolean = true,
              lockTime: number = 5000) => {
        const redisKey = getRedisKey("mutex", key);
        return 'OK' === await Promise.resolve(redis().send_command("set", redisKey, lockerIdentity, "PX", lockTime, "NX"));
    };

export const redisUnlock =
    async <T>(key: string,
              lockerIdentity: string) => {
        const redisKey = getRedisKey("mutex", key);
        if (lockerIdentity !== await redis().get(redisKey)) {
            return ;
            // throw new Error("redis unlock error: locker identity are not match"); // don't interrupt the program
        }
        await redis().pexpire(redisKey, 1);
    };

