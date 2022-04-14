import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { PubSubClient } from './pubsub.client';
import { PubSubConfig } from './pubsub.config';

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  protected readonly client: ClientProxy;

  constructor(config: PubSubConfig) {
    this.client = new PubSubClient(config);
  }

  emit(pattern: string, data: object): void {
    this.client.emit(pattern, data);
  }

  onModuleDestroy(): void {
    this.client.close();
  }

  onModuleInit(): void {
    this.client.connect();
  }
}
