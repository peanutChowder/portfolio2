declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

interface ImportMeta {
  hot?: {
    accept: (callback?: (modules: any[]) => void) => void;
    dispose: (callback: (data: any) => void) => void;
    data: any;
  };
}