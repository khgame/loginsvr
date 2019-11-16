import { IMailOption } from "@khgame/turtle/lib/utils/sendMail";

export interface ILoginRule {

    /**
     * the admin's token, which can be passed as a field of the request message to execute admin apis. such as /game/create
     */
    admin_token: string;

    renewal_time_span: number;

    mail_option: IMailOption;

    /**
     * url for usr active, only used in sign-in email, usually are the url of the login server itself. e.p. http://www.login-svr.com:11801/
     */
    active_host?: string;

    /**
     * url for usr change pwd, which points to the frontend-change-password page and only are used in change-pwd email.
     * e.p. when it be set as 'http://game.cryptoheroes.co/', the url 'http://game.cryptoheroes.co/?reset_pwd=TOKEN' will be send to sthe user
     */
    frontend_host?: string;

    /**
     * url for redirection after url in validate email clicked, e.p. https://www.cryptoheroes.co/
     */
    validate_redirect?: string;

    /**
     * determine which ip address should be used when select server
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
