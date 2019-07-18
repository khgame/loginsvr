# Configuration


## Drivers

example: config for validator
```json
{
    "host": "http://127.0.0.1:11601",
    "api": "/validate"
}
```

example: config for mongodb
```json
{
    "host": "127.0.0.1",
    "port": 27017,
    "username": "",
    "password": "",
    "database": "khgame_login_svr"
}

```
example: config for redis
```json
{
    "db": 0,
    "family": 4,
    "host": "127.0.0.1",
    "port": 6379,
    "keyPrefix": "KH_LoginSvr_default_redisKey:",
    "key_mutex_wait_threshold": 100
}
```

example: config fir serverInfo
```json
{
    "identity": "4",
    "url": api.bak,
    "code":"crpthrones3",
    "name":"萌萌"
}
```