import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { ClientConfig, PubSub, Topic } from '@google-cloud/pubsub';
import { Logger, NotImplementedException } from '@nestjs/common';

export class PubSubClient extends ClientProxy {
  protected readonly topicName: string;
  protected pubSubClient: PubSub;
  protected readonly clientConfig: ClientConfig;
  protected topic: Topic | null = null;

  private readonly logger: Logger = new Logger(PubSubClient.name);

  constructor(config: { topicName: string; config: ClientConfig }) {
    super();
    this.topicName = config.topicName;
    this.clientConfig = config.config;
  }

  async connect(): Promise<PubSub> {
    if (this.pubSubClient) {
      return this.pubSubClient;
    }

    this.pubSubClient = this.createClient();
    this.topic = this.pubSubClient.topic(this.topicName);
  }

  async close() {
    await this.topic.flush();
    await this.pubSubClient.close();
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    this.topic.publishMessage({ json: this.serialize(packet) }, (err) => {
      if (err) {
        this.logger.error(err);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): () => void {
    throw new NotImplementedException('Use `dispatchEvent` instead.');
  }

  /**
   * Redecorates the packet with additional supported fields.
   */
  protected serialize(packet: MetaPacket & ReadPacket, metadata?: any): MetaPacket & ReadPacket {
    metadata = metadata ?? {
      timestamp: Date.now(),
      dataFormat: packet.dataFormat ?? 'JSON_API_V1',
      eventType: packet.pattern?.toUpperCase().replaceAll('-', '_'),
    };
    delete packet.pattern; // Use `eventType` instead.

    return { ...packet, ...metadata };
  }

  private createClient(): PubSub {
    return new PubSub(this.clientConfig);
  }
}

/**
 * Support for additional fields in the read packet.
 */
interface MetaPacket {
  timestamp?: number;
  eventType?: string;
  dataFormat?: string;
}