import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { ClientConfig, PubSub, Topic } from '@google-cloud/pubsub';
import { Logger, NotImplementedException } from '@nestjs/common';
import { IPubSubConfig } from './pubsub.config';

export type EmitOptions = {
  event: string;
  data: object;
  topic?: string;
  format?: string;
};

export class PubSubClient extends ClientProxy {
  protected readonly defaultTopicName: string;
  protected readonly defaultFormat: string;
  protected readonly clientConfig: ClientConfig;
  protected topics: Record<string, Topic> = {};
  protected pubSubClient: PubSub;

  private readonly logger: Logger = new Logger(PubSubClient.name);

  constructor(config: IPubSubConfig) {
    super();
    this.defaultTopicName = config.defaultTopicName;
    this.defaultFormat = config.defaultFormat;
    this.clientConfig = config.config;
  }

  async connect(): Promise<PubSub> {
    if (this.pubSubClient) {
      return this.pubSubClient;
    }

    this.pubSubClient = this.createClient();
    this.topics[this.defaultTopicName] = this.pubSubClient.topic(this.defaultTopicName);

    return this.pubSubClient;
  }

  async close() {
    const closingTopics = Object.values(this.topics).map((topic) => topic.flush());
    await Promise.all(closingTopics);
    await this.pubSubClient.close();
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    const { topic, data, ...attributes } = this.serialize(packet);
    this.getTopic(topic).publishMessage({ json: data, attributes }, (err) => {
      if (err) this.logger.error(err);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): () => void {
    throw new NotImplementedException('Use `dispatchEvent` instead.');
  }

  /**
   * Redecorates the packet with additional supported fields.
   */
  protected serialize(packet: ReadPacket): Required<EmitOptions> {
    const pattern = packet.pattern as Omit<EmitOptions, 'data'>;
    return {
      format: pattern.format ?? this.defaultFormat,
      topic: pattern.topic ?? this.defaultTopicName,
      event: pattern.event.toUpperCase().replace(/-/gi, '_'),
      data: packet.data,
    };
  }

  protected getTopic(topicName: string): Topic {
    this.topics[topicName] ??= this.pubSubClient.topic(topicName);
    return this.topics[topicName];
  }

  private createClient(): PubSub {
    return new PubSub(this.clientConfig);
  }
}
