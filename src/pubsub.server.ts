import { Logger } from '@nestjs/common';
import { ClientConfig, Message, PubSub, Subscription } from '@google-cloud/pubsub';
import { CustomTransportStrategy, Server, Transport } from '@nestjs/microservices';
import { ERROR_EVENT, MESSAGE_EVENT } from '@nestjs/microservices/constants';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';

/**
 * Supported server options.
 */
export interface PubSubServerOptions {
  config: ClientConfig;
  topic: string;
  subscription: string;
  noAck: boolean;
}

export interface PubSubMessage<T = any> {
  id: string;
  eventType: string;
  dataFormat?: string;
  timestamp?: number;
  data: T;
}

/**
 * Custom transport strategy to handle google pub/sub messages.
 */
export class PubSubServer extends Server implements CustomTransportStrategy {
  protected readonly logger = new Logger(PubSubServer.name);
  protected client: PubSub | null = null;
  protected readonly clientConfig: ClientConfig;
  protected readonly topicName: string;
  protected readonly subscriptionName: string;
  protected readonly noAck: boolean;
  protected subscription: Subscription | null = null;
  protected handlers = [];
  transportId?: Transport;

  constructor(protected readonly options: PubSubServerOptions) {
    super();
    this.clientConfig = this.options.config;
    this.topicName = this.options.topic;
    this.subscriptionName = this.options.subscription;
    this.noAck = this.options.noAck;
  }

  async listen(callback: (...optionalParams: unknown[]) => any) {
    this.client = this.createClient();
    this.subscription = this.client.subscription(this.subscriptionName);

    this.subscription
      .on(MESSAGE_EVENT, async (message: Message) => {
        await this.handleMessage(message);
        if (this.noAck) {
          message.ack();
        }
      })
      .on(ERROR_EVENT, (err: any) => this.logger.error(err));

    callback();
  }

  /**
   * Handle incoming Pub/Sub `message`.
   *
   * A Pub/Sub message is comprised of some metadata and a payload. The metadata
   * contains filtering info such as event type, data format, etc. and the payload
   * `data` field contains the actual information to be processed.
   */
  async handleMessage(message: Message) {
    const { eventType, data, dataFormat } = this.getData(message);

    if (!eventType) {
      this.logger.log('It was not possible to obtain the pattern of the message');
      return;
    }

    this.logger.log(eventType, dataFormat);
    const messageHandler =
      this.messageHandlers.get(eventType) ||
      this.messageHandlers.get(`{"dataFormat":"${dataFormat}","eventType":"${eventType}"}`);

    if (!messageHandler) {
      this.logger.log(`No handlers defined for '${eventType}' have been found`);
      return;
    }

    const ctx = new PubSubContext([message, eventType]);
    await messageHandler(data, ctx);
  }

  protected getData(message: Message): Partial<PubSubMessage> {
    try {
      const data = JSON.parse(message.data.toString());

      return {
        eventType: data?.eventType,
        dataFormat: data?.dataFormat,
        timestamp: data?.timestamp,
        data: data?.data,
        id: data?.id ?? message.id,
      };
    } catch (error) {
      this.logger.warn('[Message.data] could not be parsed as JSON');
      return {};
    }
  }

  async close() {
    await this.subscription?.close();
    await this.client.close();
  }

  private createClient(): PubSub {
    return new PubSub(this.clientConfig);
  }
}

export class PubSubContext extends BaseRpcContext<[Message, string]> {
  constructor(args: [Message, string]) {
    super(args);
  }

  /**
   * Returns the original message (with properties, fields, and content).
   */
  get message(): Message {
    return this.args[0];
  }

  /**
   * Returns the name of the pattern.
   */
  get pattern(): string {
    return this.args[1];
  }
}
