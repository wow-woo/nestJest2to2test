import { User } from '../entities/user.entity';
import { CoreOutput } from './output.dto';
declare const LoginInput_base: import("@nestjs/common").Type<Pick<User, "password" | "email">>;
export declare class LoginInput extends LoginInput_base {
}
export declare class LoginOutput extends CoreOutput {
    token?: string;
}
export {};
