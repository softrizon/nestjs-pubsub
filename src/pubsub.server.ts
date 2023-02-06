import { Logger } from '@nestjs/common';
import { ClientConfig, Message, PubSub, Subscription } from '@google-cloud/pubsub';
import { CustomTransportStrategy, MessageHandler, Server, Transport } from '@nestjs/microservices';
import { ERROR_EVENT, MESSAGE_EVENT } from '@nestjs/microservices/constants';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';
import { first, from } from 'rxjs';

/**
 * Supported server options.
 */
export interface PubSubServerOptions {
  config: ClientConfig;
  topic: string;
  subscriptions: string[];
}

export interface EventPattern {
  event: string;
  format: string;
}

/**
 * Custom transport strategy to handle google pub/sub messages.
 */
export class PubSubServer extends Server implements CustomTransportStrategy {
  protected readonly logger = new Logger(PubSubServer.name);
  protected client: PubSub | null = null;
  protected readonly clientConfig: ClientConfig;
  protected readonly topicName: string;
  protected readonly subscriptionNames: string[];
  protected subscriptions: Subscription[] = [];
  protected handlers = [];
  transportId?: Transport;

  constructor(protected readonly options: PubSubServerOptions) {
    super();
    this.clientConfig = this.options.config;
    this.topicName = this.options.topic;
    this.subscriptionNames = this.options.subscriptions;
  }

  async listen(callback: (...optionalParams: unknown[]) => any) {
    this.client = this.createClient();

    this.subscriptionNames.forEach((subscription) =>
      this.subscriptions.push(
        this.client
          .subscription(subscription)
          .on(MESSAGE_EVENT, (message: Message) =>
            from(this.handleMessage(message)).pipe(first()).subscribe(),
          )
          .on(ERROR_EVENT, (err: any) => this.logger.error(err)),
      ),
    );

    callback();
  }

  /**
   * Handle incoming Pub/Sub `message`.
   *
   * A Pub/Sub message is comprised of some metadata and a payload. The metadata
   * contains filtering info such as event type, data format, etc. and the payload
   * `data` field contains the actual information to be processed.
   */
  protected async handleMessage(message: Message) {
    const { event, format } = this.getAttributes(message);

    if (!event) {
      this.logger.log('It was not possible to obtain the pattern of the message');
      return;
    }

    let handler: MessageHandler;
    for (const [key, value] of this.getHandlers()) {
      try {
        const eventPattern: Partial<EventPattern> = JSON.parse(key);

        if (eventPattern?.event === event && eventPattern?.format === format) {
          handler = value;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!handler) {
      this.logger.log(`No handlers defined for '${event}' have been found`);
      return;
    }

    const ctx = new PubSubContext([message, event]);
    return await handler(message, ctx);
  }

  protected getAttributes(message: Message): Partial<EventPattern> {
    return {
      event: message?.attributes?.event,
      format: message?.attributes?.format,
    };
  }

  async close() {
    for (const subscription of this.subscriptions) {
      await subscription?.close();
    }
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
