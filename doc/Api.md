# Api

- prefix: `host:port/api/v1`

## Core

### health

- url: `prefix/core/health`
- method: GET

## Login

### validate_email

- url: `prefix/login/validate_email/:token`
- method: GET

### online_account

- url: `prefix/login/online_account/:token`
- method: GET

### sign_in

- url: `prefix/login/sign_in`
- method: POST
- params:  
  
  ```js
  {
    type: "passport" | "email" | "phone" | "sign",
    identity: string,
    pwd: string,
    reg_info?: IAccountRegInfo
  }
  ```

### login_by_email

- url: `prefix/login/login_by_email`
- method: POST
- params:  
  
  ```js
  {
    passport: string,
    pwd: string
  }
  ```

## Server

### list

- url: `prefix/server/list`
- method: GET

### status

- url: `prefix/server/list`
- method: GET

### choose

- url: `prefix/server/choose`
- method: POST
- params:  
  
  ```js
  {
    token: string,
    ServiceName: string
  }
  ```
