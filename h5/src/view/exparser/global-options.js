const globalOptions = {
  renderingMode: 'full',
  keepWhiteSpace: false,
  parseTextContent: true,
  throwGlobalError: false
}

export function set (opts) {
  Object.assign(globalOptions, opts)
}

export default globalOptions
