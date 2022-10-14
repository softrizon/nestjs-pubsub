import { ClientConfig } from '@google-cloud/pubsub';

export interface IPubSubConfig {
  defaultTopicName: string;
  defaultFormat: string;
  config: ClientConfig;
}

export class PubSubConfig implements IPubSubConfig {
  constructor(
    public defaultTopicName: string,
    public config: ClientConfig,
    public defaultFormat: string,
  ) {}
}
