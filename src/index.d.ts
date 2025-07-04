export declare class Store {
  constructor(data?: object | string | null, opt?: {
    interceptor?: {
      beforeGet?: Function;
      afterGet?: Function;
      beforePost?: Function;
      afterPost?: Function;
      beforePut?: Function;
      afterPut?: Function;
      beforeDelete?: Function;
      afterDelete?: Function;
    };
    adapter?: any;
  });
  get(path: string, query?: object): any;
  post(path: string, data: object): any;
  put(path: string, data: object): any;
  delete(path: string): any;
} 