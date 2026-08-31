// The gallery asks its bundler for a URL to the frozen "before" stylesheet
// rather than importing it for injection. Declared here so web-shared keeps
// no dependency on a particular bundler's ambient types.
declare module "*.css?url" {
  const url: string;
  export default url;
}
