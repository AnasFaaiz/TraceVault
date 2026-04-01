/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest(err, user) {
    // If there's an error or no user, we just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}
