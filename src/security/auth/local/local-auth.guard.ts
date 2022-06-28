import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

// https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
