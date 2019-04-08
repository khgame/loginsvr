import { Action, InterceptorInterface } from "routing-controllers";

export class MessageInterceptor implements InterceptorInterface {
    public intercept(action: Action, content: any): any {
        if (content) {
            return {
                status: 200,
                result: content,
                time: Date.now(),
            };
        } else {
            return {
                status: 200,
                time: Date.now(),
            };
        }
    }
}
