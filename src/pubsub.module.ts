import { Module, DynamicModule } from '@nestjs/common';

import { PubSubConfig, IPubSubConfig } from './pubsub.config';
import { PubSubService } from './pubsub.service';

@Module({
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {
  static forRoot(config: IPubSubConfig): DynamicModule {
    return {
      global: true,
      module: PubSubModule,
      providers: [
        {
          provide: PubSubConfig,
          useValue: config,
        },
      ],
    };
  }
}
