import { IMailOption } from "@khgame/turtle/lib/utils/sendMail";

export interface ILoginRule {
    renewal_time_span: number;
    mail_option: IMailOption;
    servers: string[];
    active_host?: string;
    frontend_host?: string;
    validate_redirect?: string;
    use_public_id: boolean;
    login_html: string;
    find_pwd_html: string;
    client_ip: string;
}
