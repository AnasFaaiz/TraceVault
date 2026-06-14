import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';

interface ThreadJoinPayload {
  reflectionId?: string;
}

interface ThreadMessagePayload {
  id: string;
  reflectionId: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

@WebSocketGateway({
  namespace: '/threads',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ThreadsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token = this.getTokenFromClient(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'fallback_secret',
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.removeAllListeners();
  }

  @SubscribeMessage('thread:join')
  handleJoin(
    @MessageBody() payload: ThreadJoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.reflectionId) return { ok: false };
    client.join(this.getRoom(payload.reflectionId));
    return { ok: true };
  }

  @SubscribeMessage('thread:leave')
  handleLeave(
    @MessageBody() payload: ThreadJoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.reflectionId) return { ok: false };
    client.leave(this.getRoom(payload.reflectionId));
    return { ok: true };
  }

  emitMessage(payload: ThreadMessagePayload) {
    this.server
      ?.to(this.getRoom(payload.reflectionId))
      .emit('thread:message', payload);
  }

  private getRoom(reflectionId: string) {
    return `thread:${reflectionId}`;
  }

  private getTokenFromClient(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }

    return null;
  }
}
