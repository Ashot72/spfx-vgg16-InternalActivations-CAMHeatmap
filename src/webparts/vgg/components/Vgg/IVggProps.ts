export interface IVggProps {
  blocks: string[]
  needsConfiguration: boolean
  cam: boolean
  serviceUrl: string
  numFilters: number
  onConfigure: () => void
}
