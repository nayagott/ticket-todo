import JSDOMEnvironment from 'jest-environment-jsdom';

// jsdom은 Fetch API(fetch/Request/Response)와 일부 인코딩 전역을 구현하지 않는다.
// MSW v2가 이를 필요로 하므로, Node(v24+)가 기본 제공하는 전역을 jsdom 컨텍스트에 주입한다.
export default class FetchAwareJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);
    this.global.fetch = fetch;
    this.global.Request = Request;
    this.global.Response = Response;
    this.global.Headers = Headers;
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.BroadcastChannel = BroadcastChannel;
    this.global.structuredClone = structuredClone;
    this.global.ReadableStream = ReadableStream;
    this.global.WritableStream = WritableStream;
    this.global.TransformStream = TransformStream;
  }
}
