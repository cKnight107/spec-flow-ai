export class SharedConfigService<TConfig extends Readonly<Record<string, unknown>>> {
  public constructor(private readonly config: TConfig) {}

  public get<TKey extends keyof TConfig>(key: TKey): TConfig[TKey] {
    return this.config[key];
  }

  public all(): TConfig {
    return this.config;
  }
}
