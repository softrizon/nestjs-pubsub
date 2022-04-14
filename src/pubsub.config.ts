import { ClientConfig } from '@google-cloud/pubsub';

export interface IPubSubConfig {
  topicName: string;
  config: ClientConfig;
}

export class PubSubConfig implements IPubSubConfig {
  constructor(public topicName: string, public config: ClientConfig) {}
}
