const tf: any = require('tf')
import { deprocessImage } from './utils'

export const getInternalActivations = async (
  model,
  img,
  blocks: string[],
  numFilters: number
): Promise<string[]> => {
  const layerOutputs = blocks.map(layerName => model.getLayer(layerName).output)

  const compositeModel = tf.model({
    inputs: model.input,
    outputs: layerOutputs.concat(model.outputs[0])
  })

  const outputs = compositeModel.predict(img)
  let imageData: string[] = []

  for (let i = 0; i < outputs.length - 1; i++) {
    const activationTensors = tf.split(
      outputs[i],
      outputs[i].shape[outputs[i].shape.length - 1],
      -1
    )

    const actualNumFilters =
      numFilters <= activationTensors.length
        ? numFilters
        : activationTensors.length

    for (let j = 0; j < actualNumFilters; j++) {
      const imageTensor = tf.tidy(() =>
        deprocessImage(tf.tile(activationTensors[j], [1, 1, 1, 3]))
      )

      const imgData = {
        data: (Array as any).from(await imageTensor.div(255).data()),
        shape: imageTensor.shape
      }
      const imgDataJSON: string = JSON.stringify(imgData)
      imageData.push(imgDataJSON)
    }

    tf.dispose(activationTensors)
  }
  tf.dispose(outputs)

  return imageData
}
