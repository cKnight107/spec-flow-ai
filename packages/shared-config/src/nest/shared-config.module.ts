import type { ConfigSchema, InferSchemaOutput, LoadConfigOptions } from "../core/types";
import { loadConfig } from "../server/load-config";
import { SharedConfigService } from "./shared-config.service";
import { SHARED_CONFIG } from "./tokens";

export type DynamicModuleLike = Readonly<{
  module: typeof SharedConfigModule;
  global: true;
  providers: readonly unknown[];
  exports: readonly unknown[];
}>;

export class SharedConfigModule {}

export function createSharedConfigModule<TSchema extends ConfigSchema>(
  options: LoadConfigOptions<TSchema>,
): DynamicModuleLike {
  const config = loadConfig(options);
  const service = new SharedConfigService(config);

  return {
    module: SharedConfigModule,
    global: true,
    providers: Object.freeze([
      {
        provide: SHARED_CONFIG,
        useValue: config,
      },
      {
        provide: SharedConfigService,
        useValue: service,
      },
    ]),
    exports: Object.freeze([SHARED_CONFIG, SharedConfigService]),
  };
}

export type ServerConfig<TSchema extends ConfigSchema> = Readonly<InferSchemaOutput<TSchema>>;
