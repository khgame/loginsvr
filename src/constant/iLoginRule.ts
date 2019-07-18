import {IMailOption} from "@khgame/turtle/lib/utils/sendMail";

export interface ILoginRule {
    renewal_time_span: number;
    mail_option: IMailOption;
    servers: string[];
}
