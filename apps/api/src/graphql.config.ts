import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';

export const graphqlConfig = {
  driver: ApolloDriver,
  autoSchemaFile: true,
  playground: false,
} satisfies ApolloDriverConfig;
