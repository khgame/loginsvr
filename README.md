# loginsvr

[![Build Status](https://travis-ci.org/khgame/loginsvr.svg?branch=master)](https://travis-ci.org/khgame/loginsvr)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/khgame/loginsvr/master.svg?color=blue)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/khgame/loginsvr.svg?color=blue)
![NPM](https://img.shields.io/npm/l/@khgame/loginsvr.svg?color=purple)
![npm (tag)](https://img.shields.io/npm/v/@khgame/loginsvr/latest.svg?color=purple)

## Config

### Validator

### eos

- install:  
    > `npm install @khgame/loginsvr`
- run:  
    > `kh-loginsvr -h`
    ```bash
    Usage: kh-loginsvr [options] [command]
    
    Commands:
      start [options]    start running login server
      extract [options]  extract default config to a file
    ```
    > `kh-loginsvr start -h`
    ```bash
    Usage: start [options]
    
    start running login server
    
    Options:
      -d, --development    (default env setting) similar to set NODE_ENV=development, and will read login.development.json at executing position as config by default
      -p, --production     similar to set NODE_ENV=production, and will read login.production.json at executing position as config by default
      -c, --config <path>  set config path, and the specified conf will override the default one set by NODE_ENV
      -P, --port <port>    the port to serve api, will override the setting in config file, 11801 by default
      -m, --mock           start with mock mode
      -h, --help           output usage information
    ```
    > `kh-loginsvr extract -h`
    ```bash
    Usage: extract [options]
    
    extract default config to a file
    
    Options:
      -p, --path <path>  the export path
      -h, --help         output usage information
    ```
