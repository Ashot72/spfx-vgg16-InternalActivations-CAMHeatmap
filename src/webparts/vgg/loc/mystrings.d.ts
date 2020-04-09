declare interface IVggWebPartStrings {
  Settings: string
  IconText: string
  Description: string
  ButtonLabel: string
  SelectImage: string
  Predict: string
  GenInternalActivations: string
  ViewInternalActivations: string
  GenCAMHeatmap: string
  ViewCAMHeatmap: string
  InternalActivations: string
  CAMHeatmap: string
  LoadingModelStatus: string
  PredictingStatus: string
  GenInternalActivationsStatus: string
  GenCAMHeatmapStatus: string
  ServiceURL: string
  VGG16Layers: string
  NumOfFilters: string
}

declare module 'VggWebPartStrings' {
  const strings: IVggWebPartStrings
  export = strings
}
