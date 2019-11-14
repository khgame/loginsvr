# loginsvr

[![Build Status](https://travis-ci.org/khgame/loginsvr.svg?branch=master)](https://travis-ci.org/khgame/loginsvr)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/khgame/loginsvr/master.svg?color=blue)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/khgame/loginsvr.svg?color=blue)
![NPM](https://img.shields.io/npm/l/@khgame/loginsvr.svg?color=purple)
![npm (tag)](https://img.shields.io/npm/v/@khgame/loginsvr/latest.svg?color=purple)

## Quick Start

It will take about 5 minutes to quickly launch a login server.

### Requirements

You need to have a nodejs runtime environment installed.

### Installation

To install the application, run the following commands. This will download the package @khgame/loginsvr and install it in your global repository.

```bash
npm i -g @khgame/loginsvr
kh-loginsvr --version
```

Now, you will see current version to loginSvr in your console.
Hence, you should create a config file at the directory where you need the loginSvr to run.
You can manually create a new config file, but the recomended way is using the `extract` command.

```bash
cd /your/awwwwsome/running/directory
kh-loginsvr extract -p ./loginSvr.development.json
```

> the extract command can be executed with the flag '-p', witch allows you specify the config name
> you can use this to create configs for different enviroments, e.g. loginSvr.production.json
> if it's didn't set, the default config name is ./loginSvr.development.json

### Configuration

After installation, you should got a config file like this:
*loginSvr.development.json*

```json
{
    "name": "loginSvr",
    "id": 0,
    "port": 12001,
    "setting": {
        "log_prod_console": "info"
    },
    "drivers": {
        "mongo": {
            "host": "127.0.0.1",
            "port": 27017,
            "database": "loginSvr",
            "username": "",
            "password": ""
        },
        "redis": {
            "db": 0,
            "family": 4,
            "host": "127.0.0.1",
            "port": 6379,
            "keyPrefix": "khgame:login:",
            "key_mutex_wait_threshold": 100
        },
        "discover/consul": {
            "optional": true,
            "health": {
                "api": "api/v1/core/health"
            },
            "did": {
                "head_refresh": "process"
            }
        }
    },
    "rules": {
        "admin_token": "FILL_THIS_FILED_WITH_RANDOM_STRING",
        "renewal_time_span": 600,
                "mail_option": {
                    "host": "smtp.exmail.qq.com",
                    "port": 465,
                    "secureConnection": true,
                    "auth": {
                        "user": "YOUR_EMAIL_ADDRESS",
                        "pass": "YOUR_EMAIL_PASS"
                    }
        },
        "active_host": "",
        "frontend_host": "",
        "validate_redirect": "https://www.github.com/bagaking", 
        "use_public_id": true,
        "sign_in_tpl": "./tpl/sign_in.html",
        "find_pwd_tpl": "./tpl/find_pwd.html",
    }
}
```

Updates these config entries, replace then with your own setting.

structure of "rules":

```typescript
export interface ILoginRule {

    renewal_time_span: number;

    mail_option: IMailOption;

    /**
     * name of all supported servers witch are provided by service discovery
     */
    servers: string[];

    /**
     * url for usr active, only used in sign-in email, e.p. http://www.login-svr.com:11801/
     */
    active_host?: string;

    /**
     * url for usr change pwd, only used in change-pwd email, e.p. http://game.cryptoheroes.co/
     */
    frontend_host?: string;

    /**
     * url for redirection after url in validate email clicked, e.p. https://www.cryptoheroes.co/
     */
    validate_redirect?: string;

    /**
     * determine which ip should be used when select server
     */
    use_public_id: boolean;

    /**
     * template page of sign in
     */
    sign_in_tpl: string;

    /**
     * template page of find pwd
     */
    find_pwd_tpl: string;
}

```

> for more information, you can check this document: [Configuration](./doc/Configuration.md)

### Running

Finally, you can start the loginSvr, just use the command `kh-loginsvr start`.
This command will find the config file `loginSvr.development.json`, and then start the loginSvr using settings in the configuration file.
If the config are not given, it will running with the defult setting, just like the extract command provides.
*therefore, you can also make your development enviroment match the default config to avoid these prepare operations*

Alternatively, there are another ways to start up your login server.

1. `kh-loginsvr start -p` will start loginsvr with NODE_ENV=production, and the default config to search will be `loginSvr.production.json`.
2. `kh-loginsvr start -c my.awwwwsome.config.json` will start loginsvr with specified config file.

> for more information, you can use the command `kh-loginsvr start -h`

## API usage

see [Api](./doc/Api.md)
