import {Global} from "../../global";
import * as IORedis from "ioredis";
import {forMs} from "kht";

let redisInstance: IORedis.Redis;
export const redis = () => {
    redisLockCountMax = Global.conf.redis.key_mutex_wait_threshold || 100;
    return redisInstance || (redisInstance = new IORedis(Global.conf.redis));
};

export const getRedisKey =
    (...keys: string[]) =>
        keys.reduce((_, s) => `${_}:${s}`);

let redisLockCountMax = 100;
let redisLockCount: any = {};

export const redisLock =
    async <T>(key: string,
              lockerIdentity: string,
              bWaitForLock: boolean = true,
              lockTime: number = 5000) => {
        if (!key) {
            throw new Error(`redisLock error : lock key cannot be empty`);
        }
        redisLockCount[key] = redisLockCount[key] ? redisLockCount[key] + 1 : 0;
        if (redisLockCount[key] >= 100) {
            throw new Error(`redisLock error : too much(${redisLockCount[key]}) wait for key<${key}>`);
        }
        const redisKey = getRedisKey("mutex", key);
        let ret: any;
        do {
            ret = await Promise.resolve(redis().send_command("set", redisKey, lockerIdentity, "PX", lockTime, "NX"));
        } while (ret !== "OK" || !bWaitForLock || (await forMs(5 * redisLockCount[key]) && false));
        redisLockCount[key] -= 1;
        return 'OK' === ret;
    };

export const redisUnlock =
    async <T>(key: string,
              lockerIdentity: string) => {
        const redisKey = getRedisKey("mutex", key);
        if (lockerIdentity !== await redis().get(redisKey)) {
            return;
            // throw new Error("redis unlock error: locker identity are not match"); // don't interrupt the program
        }
        await redis().pexpire(redisKey, 1);
    };

