import { IMailOption } from "@khgame/turtle/lib/utils/sendMail";

export interface ILoginRule {

    renewal_time_span: number;

    mail_option: IMailOption;

    servers: string[];

    /**
     * url for usr active, e.p. http://www.login-svr.com:11801/
     */
    active_host?: string;

    /**
     * url for usr change pwd, e.p. http://game.cryptoheroes.co/
     */
    frontend_host?: string;

    /**
     * url for login redirection, e.p. https://www.cryptoheroes.co/
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
