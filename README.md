# Pub/Sub Wrapper for NestJS

[![npm version][version-img]][version-url]
[![MIT License][license-img]][license-url]

[![N|Solid](https://i.ibb.co/rxN33YX/poweredbysoftrizon.png)](https://softrizon.com)

## Description

This is a custom transport stategy wrapper for Google Cloud Pub/Sub within the
NestJS framework. In other words, it provides a simple way to publish and
subscribe to a topic.

## Installation

This service is built with Node (`v16.14.2` using `npm@8.5.0`) and NestJS.

```bash
npm install @softrizon/pubsub
```

## Usage

### Publish messages

- Module configuration

```ts
import { Module } from '@nestjs/common';
import { PubSubModule } from '@softrizon/pubsub';
import { MessageService } from './message.service';

@Module({
  imports: [
    PubSubModule.forRoot({
      topicName: 'my-topic',
      config: { projectId: 'my-project' },
    }),
  ],
  providers: [MessageService],
})
export class AppModule {}
```

- Inject the service (e.g., `MessageService`) to emit messages.

```ts
import { Injectable } from '@nestjs/common';
import { PubSubService } from '@softrizon/pubsub';

@Injectable()
export class MessageService {
  constructor(private pubsub: PubSubService) {}

  emit<T = any>(pattern: string, data: T): void {
    this.pubsub.emit(pattern, data);
  }
}
```

### Subscribe on messages

- Server configuration

```ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { PubSubServer } from '@softrizon/pubsub';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    strategy: new PubSubServer({
      config: { projectId: 'my-project' },
      topic: 'my-topic',
      subscription: 'my-subscription',
      noAck: true,
    }),
  });

  app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

- Subscribe to message pattern

```ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MessagesEventController {
  @MessagePattern('my-pattern')
  async doSomething(@Payload() data: any): Promise<void> {
    // do something with data...
  }
}
```

> Note: Do not forget to register the controller in the corresponding module.

### Read more

Visit the [main page][googleapis-url] to learn more about its key features,
configurations, limitations, and API.

## Author

Developed by [Softrizon](https://github.com/softrizon).

## License

This project is [MIT-licensed](LICENSE).

[googleapis-url]: https://github.com/googleapis/nodejs-pubsub
[version-img]: https://img.shields.io/npm/v/@softrizon/pubsub
[version-url]: https://www.npmjs.com/package/@softrizon/pubsub
[license-img]: https://img.shields.io/npm/l/@softrizon/pubsub
[license-url]: https://opensource.org/licenses/MIT
