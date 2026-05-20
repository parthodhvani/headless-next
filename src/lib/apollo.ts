import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://192.168.1.112/headless/graphql",
  }),
  cache: new InMemoryCache(),
});

export default client;