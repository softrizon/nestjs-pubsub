import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { EmitOptions, PubSubClient } from './pubsub.client';
import { PubSubConfig } from './pubsub.config';

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  protected readonly client: PubSubClient;

  constructor(config: PubSubConfig) {
    this.client = new PubSubClient(config);
  }

  emit(emitOptions: EmitOptions): void {
    const { data, ...pattern } = emitOptions;
    this.client.emit(pattern, data);
  }

  onModuleDestroy(): void {
    this.client.close();
  }

  onModuleInit(): void {
    this.client.connect();
  }
}
